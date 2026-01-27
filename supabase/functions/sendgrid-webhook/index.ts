import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SENDGRID_WEBHOOK_KEY = Deno.env.get('SENDGRID_WEBHOOK_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Verify webhook signature if configured
  if (SENDGRID_WEBHOOK_KEY) {
    const signature = req.headers.get('x-twilio-email-event-webhook-signature');
    const timestamp = req.headers.get('x-twilio-email-event-webhook-timestamp');

    // In production, verify the signature using ECDSA
    // For now, we'll just log that verification is configured
    console.log('Webhook signature verification configured');
  }

  try {
    const events = await req.json();

    if (!Array.isArray(events)) {
      throw new Error('Expected array of events');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log(`Processing ${events.length} SendGrid events`);

    const results = [];

    for (const event of events) {
      try {
        const result = await processEvent(supabase, event);
        results.push(result);
      } catch (error) {
        console.error('Event processing error:', error);
        results.push({ event_type: event.event, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
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
  const {
    event: eventType,
    sg_message_id,
    email: recipientEmail,
    timestamp,
    ip,
    useragent,
    reason,
    bounce_classification,
  } = event;

  // Get custom args (contains our outreach_email_id)
  const outreachEmailId = event.outreach_email_id || event.custom_args?.outreach_email_id;

  // Try to find the outreach email by message ID or custom arg
  let emailRecord = null;

  if (outreachEmailId) {
    const { data } = await supabase
      .from('outreach_emails')
      .select('*')
      .eq('id', outreachEmailId)
      .single();
    emailRecord = data;
  }

  if (!emailRecord && sg_message_id) {
    // SendGrid message IDs can have a filter suffix, strip it
    const baseMessageId = sg_message_id.split('.')[0];

    const { data } = await supabase
      .from('outreach_emails')
      .select('*')
      .like('sendgrid_message_id', `${baseMessageId}%`)
      .single();
    emailRecord = data;
  }

  if (!emailRecord) {
    console.log('Email record not found for event:', eventType, sg_message_id);
    return { event_type: eventType, status: 'skipped', reason: 'Email not found' };
  }

  // Record the event
  await supabase.from('email_events').insert({
    outreach_email_id: emailRecord.id,
    event_type: eventType,
    event_data: event,
    ip_address: ip,
    user_agent: useragent,
    received_at: new Date(timestamp * 1000).toISOString(),
  });

  // Update email status based on event type
  const statusUpdates: Record<string, any> = {};

  switch (eventType) {
    case 'delivered':
      statusUpdates.status = 'delivered';
      statusUpdates.delivered_at = new Date(timestamp * 1000).toISOString();
      break;

    case 'open':
      // Only update to opened if not already replied
      if (emailRecord.status !== 'replied') {
        statusUpdates.status = 'opened';
        if (!emailRecord.opened_at) {
          statusUpdates.opened_at = new Date(timestamp * 1000).toISOString();
        }
      }

      // Update campaign stats
      await updateCampaignOpenCount(supabase, emailRecord);
      break;

    case 'click':
      statusUpdates.status = 'clicked';
      break;

    case 'bounce':
    case 'dropped':
      statusUpdates.status = 'bounced';

      // Update campaign contact
      if (emailRecord.campaign_contact_id) {
        await supabase
          .from('campaign_contacts')
          .update({ status: 'bounced' })
          .eq('id', emailRecord.campaign_contact_id);
      }
      break;

    case 'spamreport':
      statusUpdates.status = 'bounced'; // Treat spam reports as bounces

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
      break;

    case 'unsubscribe':
      if (emailRecord.campaign_contact_id) {
        await supabase
          .from('campaign_contacts')
          .update({ status: 'unsubscribed' })
          .eq('id', emailRecord.campaign_contact_id);
      }
      break;

    default:
      // Unknown event type, just log it
      console.log('Unknown event type:', eventType);
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

async function updateCampaignOpenCount(supabase: any, emailRecord: any) {
  if (!emailRecord.campaign_contact_id) return;

  // Get campaign ID
  const { data: cc } = await supabase
    .from('campaign_contacts')
    .select('campaign_id')
    .eq('id', emailRecord.campaign_contact_id)
    .single();

  if (!cc?.campaign_id) return;

  // Check if this is first open for this contact
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
      .eq('id', cc.campaign_id);
  }
}
