import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Sync email statuses from the Resend API.
 *
 * This function compensates for missed webhook events by actively
 * polling Resend for email statuses and updating outreach_emails.
 *
 * Call with: POST { "days_back": 7 }
 * Or: POST { "resend_ids": ["id1", "id2"] }  (for specific emails)
 *
 * Can be invoked manually from the dashboard or scheduled via cron.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: 'RESEND_API_KEY not configured' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const daysBack = body.days_back || 7;
    const specificIds = body.resend_ids || null;

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    let results;
    if (specificIds && Array.isArray(specificIds) && specificIds.length > 0) {
      results = await syncSpecificEmails(supabase, specificIds);
    } else {
      results = await syncRecentEmails(supabase, daysBack);
    }

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/**
 * Sync recent emails by querying our DB for sent emails and checking Resend API.
 */
async function syncRecentEmails(supabase: any, daysBack: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);

  // Get all sent/delivered emails from the last N days that might need updating
  // Focus on emails where clicked_at is null (potential missed clicks)
  const { data: emails, error } = await supabase
    .from('outreach_emails')
    .select('id, sendgrid_message_id, status, opened_at, clicked_at, replied_at')
    .not('sendgrid_message_id', 'is', null)
    .gte('sent_at', cutoff.toISOString())
    .in('status', ['sent', 'delivered', 'opened'])
    .limit(200);

  if (error) {
    throw new Error(`Failed to fetch emails: ${error.message}`);
  }

  if (!emails || emails.length === 0) {
    return { checked: 0, updated: 0, message: 'No emails to sync' };
  }

  console.log(`Checking ${emails.length} emails against Resend API...`);

  let updated = 0;
  let errors = 0;

  // Process in batches to respect rate limits
  for (const email of emails) {
    try {
      const resendStatus = await getResendEmailStatus(email.sendgrid_message_id);
      if (!resendStatus) continue;

      const updates = computeUpdates(email, resendStatus);
      if (Object.keys(updates).length > 0) {
        await supabase
          .from('outreach_emails')
          .update(updates)
          .eq('id', email.id);
        updated++;
        console.log(`Updated email ${email.id}: ${JSON.stringify(updates)}`);
      }
    } catch (err) {
      errors++;
      console.error(`Error checking email ${email.id}:`, err.message);
    }

    // Small delay to respect Resend rate limits (10 req/s)
    await new Promise(resolve => setTimeout(resolve, 120));
  }

  return {
    checked: emails.length,
    updated,
    errors,
  };
}

/**
 * Sync specific emails by their Resend IDs (e.g., from a CSV export).
 */
async function syncSpecificEmails(supabase: any, resendIds: string[]) {
  let updated = 0;
  let notFound = 0;
  let errors = 0;

  for (const resendId of resendIds) {
    try {
      // Find our email record
      const { data: email } = await supabase
        .from('outreach_emails')
        .select('id, sendgrid_message_id, status, opened_at, clicked_at, replied_at')
        .eq('sendgrid_message_id', resendId)
        .single();

      if (!email) {
        notFound++;
        continue;
      }

      // Check Resend API
      const resendStatus = await getResendEmailStatus(resendId);
      if (!resendStatus) continue;

      const updates = computeUpdates(email, resendStatus);
      if (Object.keys(updates).length > 0) {
        await supabase
          .from('outreach_emails')
          .update(updates)
          .eq('id', email.id);
        updated++;
        console.log(`Updated email ${email.id}: ${JSON.stringify(updates)}`);
      }
    } catch (err) {
      errors++;
      console.error(`Error syncing ${resendId}:`, err.message);
    }

    await new Promise(resolve => setTimeout(resolve, 120));
  }

  return {
    checked: resendIds.length,
    updated,
    not_found: notFound,
    errors,
  };
}

/**
 * Get email status from Resend API.
 */
async function getResendEmailStatus(resendId: string): Promise<any | null> {
  const response = await fetch(`https://api.resend.com/emails/${resendId}`, {
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    if (response.status === 429) {
      // Rate limited - wait and retry once
      await new Promise(resolve => setTimeout(resolve, 2000));
      const retry = await fetch(`https://api.resend.com/emails/${resendId}`, {
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` },
      });
      if (!retry.ok) return null;
      return await retry.json();
    }
    console.error(`Resend API error ${response.status} for ${resendId}`);
    return null;
  }

  return await response.json();
}

/**
 * Compare our record with Resend status and compute needed updates.
 */
function computeUpdates(email: any, resendStatus: any): Record<string, any> {
  const updates: Record<string, any> = {};
  const lastEvent = resendStatus.last_event;

  // Don't downgrade from replied
  if (email.status === 'replied') return updates;

  // Map Resend last_event to our status hierarchy:
  // sent < delivered < opened < clicked < replied
  const hierarchy: Record<string, number> = {
    'sent': 1,
    'delivered': 2,
    'opened': 3,
    'clicked': 4,
    'replied': 5,
    'bounced': 0,
    'complained': 0,
  };

  const currentLevel = hierarchy[email.status] || 0;
  const newLevel = hierarchy[lastEvent] || 0;

  // Only upgrade status, never downgrade
  if (newLevel > currentLevel) {
    updates.status = lastEvent;
  }

  // Set opened_at if Resend shows opened or clicked (click implies open)
  if (!email.opened_at && (lastEvent === 'opened' || lastEvent === 'clicked')) {
    // Use created_at from the Resend record as approximate open time
    updates.opened_at = resendStatus.created_at || new Date().toISOString();
  }

  // Set clicked_at if Resend shows clicked
  if (!email.clicked_at && lastEvent === 'clicked') {
    updates.clicked_at = resendStatus.created_at || new Date().toISOString();
  }

  // Handle bounces
  if (lastEvent === 'bounced' && email.status !== 'bounced') {
    updates.status = 'bounced';
  }

  return updates;
}
