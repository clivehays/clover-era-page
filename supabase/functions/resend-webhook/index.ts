import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const RESEND_WEBHOOK_SECRET = Deno.env.get('RESEND_WEBHOOK_SECRET');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Optional: Verify Resend webhook signature via svix headers
  if (RESEND_WEBHOOK_SECRET) {
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    if (svixId && svixTimestamp && svixSignature) {
      console.log('Resend webhook signature present (svix-id:', svixId, ')');
    }
  }

  try {
    const event = await req.json();

    if (!event || !event.type) {
      throw new Error('Invalid webhook event: missing type');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log(`Processing Resend event: ${event.type}`);

    const result = await processEvent(supabase, event);

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function processEvent(supabase: any, event: any) {
  const eventType = event.type; // e.g. 'email.delivered', 'email.opened'
  const data = event.data || {};
  const createdAt = event.created_at || new Date().toISOString();

  // Extract our outreach_email_id from tags
  let outreachEmailId: string | null = null;

  if (data.tags) {
    // Tags can be an object { name: value } or array [{ name, value }]
    if (Array.isArray(data.tags)) {
      const tag = data.tags.find((t: any) => t.name === 'outreach_email_id');
      if (tag) outreachEmailId = tag.value;
    } else if (typeof data.tags === 'object') {
      outreachEmailId = data.tags.outreach_email_id || null;
    }
  }

  // Try to find the outreach email by tag or by Resend email ID
  let emailRecord = null;

  if (outreachEmailId) {
    const { data: record } = await supabase
      .from('outreach_emails')
      .select('*')
      .eq('id', outreachEmailId)
      .single();
    emailRecord = record;
  }

  if (!emailRecord && data.email_id) {
    // Match by Resend email ID stored in sendgrid_message_id column
    const { data: record } = await supabase
      .from('outreach_emails')
      .select('*')
      .eq('sendgrid_message_id', data.email_id)
      .single();
    emailRecord = record;
  }

  if (!emailRecord) {
    console.log('Email record not found for event:', eventType, data.email_id);
    return { event_type: eventType, status: 'skipped', reason: 'Email not found' };
  }

  // Record the event
  await supabase.from('email_events').insert({
    outreach_email_id: emailRecord.id,
    event_type: mapResendEventType(eventType),
    event_data: event,
    received_at: createdAt,
  });

  // Update email status based on event type
  const statusUpdates: Record<string, any> = {};

  switch (eventType) {
    case 'email.sent':
      // Resend confirmed it was sent
      if (emailRecord.status === 'sent' || emailRecord.status === 'sending') {
        statusUpdates.status = 'sent';
      }
      break;

    case 'email.delivered':
      statusUpdates.status = 'delivered';
      statusUpdates.delivered_at = createdAt;
      break;

    case 'email.delivery_delayed':
      // Don't change status, just log the event
      console.log('Delivery delayed for email:', emailRecord.id);
      break;

    case 'email.opened':
      // Only update to opened if not already replied
      if (emailRecord.status !== 'replied') {
        statusUpdates.status = 'opened';
        if (!emailRecord.opened_at) {
          statusUpdates.opened_at = createdAt;
        }
      }

      // Update campaign stats
      await updateCampaignOpenCount(supabase, emailRecord);
      break;

    case 'email.clicked':
      if (emailRecord.status !== 'replied') {
        statusUpdates.status = 'clicked';
      }
      break;

    case 'email.bounced':
      statusUpdates.status = 'bounced';

      // Update campaign contact/prospect
      if (emailRecord.campaign_contact_id) {
        await supabase
          .from('campaign_contacts')
          .update({ status: 'bounced' })
          .eq('id', emailRecord.campaign_contact_id);
      }
      if (emailRecord.campaign_prospect_id) {
        await supabase
          .from('campaign_prospects')
          .update({ status: 'bounced' })
          .eq('id', emailRecord.campaign_prospect_id);
      }
      break;

    case 'email.complained':
      // Spam complaint - treat like bounce
      statusUpdates.status = 'bounced';

      // Mark contact to not email again
      if (emailRecord.contact_id) {
        await supabase
          .from('contacts')
          .update({ notes: 'SPAM REPORT - DO NOT EMAIL' })
          .eq('id', emailRecord.contact_id);
      }

      if (emailRecord.campaign_contact_id) {
        await supabase
          .from('campaign_contacts')
          .update({ status: 'unsubscribed' })
          .eq('id', emailRecord.campaign_contact_id);
      }
      if (emailRecord.campaign_prospect_id) {
        await supabase
          .from('campaign_prospects')
          .update({ status: 'unsubscribed' })
          .eq('id', emailRecord.campaign_prospect_id);
      }
      break;

    default:
      console.log('Unknown Resend event type:', eventType);
  }

  if (Object.keys(statusUpdates).length > 0) {
    await supabase
      .from('outreach_emails')
      .update(statusUpdates)
      .eq('id', emailRecord.id);
  }

  console.log('Processed event:', eventType, 'for email:', emailRecord.id);

  return {
    event_type: eventType,
    email_id: emailRecord.id,
    status: 'processed',
  };
}

// Map Resend event types to our internal event type names (for email_events table)
function mapResendEventType(resendType: string): string {
  const map: Record<string, string> = {
    'email.sent': 'sent',
    'email.delivered': 'delivered',
    'email.delivery_delayed': 'delivery_delayed',
    'email.opened': 'open',
    'email.clicked': 'click',
    'email.bounced': 'bounce',
    'email.complained': 'spamreport',
  };
  return map[resendType] || resendType;
}

async function updateCampaignOpenCount(supabase: any, emailRecord: any) {
  // Get campaign ID from either contact or prospect link
  let campaignId: string | null = null;

  if (emailRecord.campaign_contact_id) {
    const { data: cc } = await supabase
      .from('campaign_contacts')
      .select('campaign_id')
      .eq('id', emailRecord.campaign_contact_id)
      .single();
    campaignId = cc?.campaign_id;
  } else if (emailRecord.campaign_prospect_id) {
    const { data: cp } = await supabase
      .from('campaign_prospects')
      .select('campaign_id')
      .eq('id', emailRecord.campaign_prospect_id)
      .single();
    campaignId = cp?.campaign_id;
  }

  if (!campaignId) return;

  // Check if this is first open for this email
  const { count } = await supabase
    .from('email_events')
    .select('*', { count: 'exact', head: true })
    .eq('outreach_email_id', emailRecord.id)
    .eq('event_type', 'open');

  // Only increment on first open
  if (count === 1) {
    await supabase
      .from('outreach_campaigns')
      .update({
        emails_opened: supabase.sql`emails_opened + 1`,
      })
      .eq('id', campaignId);
  }
}
