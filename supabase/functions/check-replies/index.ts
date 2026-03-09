import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const AZURE_TENANT_ID = Deno.env.get('AZURE_TENANT_ID');
const AZURE_CLIENT_ID = Deno.env.get('AZURE_CLIENT_ID');
const AZURE_CLIENT_SECRET = Deno.env.get('AZURE_CLIENT_SECRET');
const AZURE_MAIL_USER = Deno.env.get('AZURE_MAIL_USER') || 'clive.hays@cloverera.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// How far back to check for replies (minutes)
const LOOKBACK_MINUTES = 15;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Step 1: Get OAuth2 token from Azure AD
    const token = await getAzureToken();
    if (!token) {
      throw new Error('Failed to get Azure AD token');
    }

    // Step 2: Get all active outreach prospect emails for matching
    const { data: prospects, error: prospError } = await supabase
      .from('outreach_prospects')
      .select('id, email, first_name, last_name, company_name')
      .not('email', 'is', null);

    if (prospError) throw new Error(`Failed to load prospects: ${prospError.message}`);
    if (!prospects || prospects.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No prospects to check', replies_found: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build email lookup map (lowercase)
    const prospectByEmail: Record<string, any> = {};
    for (const p of prospects) {
      if (p.email) {
        prospectByEmail[p.email.toLowerCase()] = p;
      }
    }

    // Step 3: Query inbox for recent messages
    const lookbackTime = new Date(Date.now() - LOOKBACK_MINUTES * 60 * 1000).toISOString();
    const messages = await getRecentInboxMessages(token, lookbackTime);

    console.log(`Found ${messages.length} messages in last ${LOOKBACK_MINUTES} minutes`);

    let repliesFound = 0;
    const processedSenders: string[] = [];

    for (const msg of messages) {
      const senderEmail = msg.from?.emailAddress?.address?.toLowerCase();
      if (!senderEmail) continue;

      // Check if sender is a known prospect
      const prospect = prospectByEmail[senderEmail];
      if (!prospect) continue;

      // Avoid processing same sender twice in one run
      if (processedSenders.includes(senderEmail)) continue;
      processedSenders.push(senderEmail);

      console.log(`Reply detected from ${senderEmail} (${prospect.first_name} ${prospect.last_name} @ ${prospect.company_name})`);

      // Step 4: Find their campaign_prospect records
      const { data: campaignProspects } = await supabase
        .from('campaign_prospects')
        .select('id, status, campaign_id')
        .eq('prospect_id', prospect.id)
        .in('status', ['active', 'pending', 'contacted']);

      if (!campaignProspects || campaignProspects.length === 0) continue;

      for (const cp of campaignProspects) {
        // Find the most recent sent email for this campaign_prospect
        const { data: sentEmails } = await supabase
          .from('outreach_emails')
          .select('id, position, status')
          .eq('campaign_prospect_id', cp.id)
          .eq('status', 'sent')
          .order('position', { ascending: false })
          .limit(1);

        if (sentEmails && sentEmails.length > 0) {
          // Mark the sent email as replied
          await supabase
            .from('outreach_emails')
            .update({
              status: 'replied',
              replied_at: new Date().toISOString(),
            })
            .eq('id', sentEmails[0].id);

          console.log(`Marked email ${sentEmails[0].id} (position ${sentEmails[0].position}) as replied`);
        }

        // Cancel any pending follow-up emails
        const { data: pendingEmails, error: pendingErr } = await supabase
          .from('outreach_emails')
          .select('id, position, status')
          .eq('campaign_prospect_id', cp.id)
          .in('status', ['pending_followup', 'scheduled', 'draft', 'approved']);

        if (pendingEmails && pendingEmails.length > 0) {
          const pendingIds = pendingEmails.map(e => e.id);
          await supabase
            .from('outreach_emails')
            .update({ status: 'cancelled' })
            .in('id', pendingIds);

          console.log(`Cancelled ${pendingIds.length} pending follow-up emails for campaign_prospect ${cp.id}`);
        }

        // Update campaign_prospect status to replied
        await supabase
          .from('campaign_prospects')
          .update({ status: 'replied' })
          .eq('id', cp.id);

        repliesFound++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      messages_checked: messages.length,
      replies_found: repliesFound,
      prospects_matched: processedSenders,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('check-replies error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getAzureToken(): Promise<string | null> {
  const tokenUrl = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: AZURE_CLIENT_ID!,
    client_secret: AZURE_CLIENT_SECRET!,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure token error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Azure token request failed:', error);
    return null;
  }
}

async function getRecentInboxMessages(token: string, sinceDateTime: string): Promise<any[]> {
  // Query inbox for messages received after sinceDateTime
  // Filter to inbox folder only, exclude sent items
  const filter = `receivedDateTime ge ${sinceDateTime}`;
  const select = 'id,from,subject,receivedDateTime,isRead';
  const orderBy = 'receivedDateTime desc';
  const top = 50;

  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(AZURE_MAIL_USER)}/mailFolders/inbox/messages?$filter=${encodeURIComponent(filter)}&$select=${select}&$orderby=${encodeURIComponent(orderBy)}&$top=${top}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Graph API error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    return data.value || [];
  } catch (error) {
    console.error('Graph API request failed:', error);
    return [];
  }
}
