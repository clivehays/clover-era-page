import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default sender config
const DEFAULT_FROM_EMAIL = 'clive.hays@go.cloverera.com';
const DEFAULT_FROM_NAME = 'Clive Hays';
const DEFAULT_REPLY_TO = 'clive.hays@cloverera.com';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { type, email_id, campaign_id } = body;

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Handle different request types
    if (type === 'send_single') {
      return await sendSingleEmail(supabase, email_id);
    }

    if (type === 'process_scheduled') {
      return await processScheduledEmails(supabase);
    }

    if (type === 'send_campaign_batch') {
      return await sendCampaignBatch(supabase, campaign_id);
    }

    if (type === 'get_capacity') {
      return await getCampaignCapacity(supabase, campaign_id);
    }

    if (type === 'activate_campaign') {
      return await activateCampaign(supabase, campaign_id);
    }

    throw new Error(`Unknown type: ${type}`);

  } catch (error) {
    console.error('Send email error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function sendSingleEmail(supabase: any, emailId: string) {
  if (!emailId) {
    throw new Error('email_id is required');
  }

  // Get email with contact and prospect data
  const { data: email, error: emailError } = await supabase
    .from('outreach_emails')
    .select(`
      *,
      contact:contacts(*),
      prospect:outreach_prospects(*)
    `)
    .eq('id', emailId)
    .single();

  if (emailError || !email) {
    throw new Error(`Email not found: ${emailError?.message}`);
  }

  if (email.status === 'sent' || email.status === 'delivered') {
    return new Response(
      JSON.stringify({ success: false, error: 'Email already sent', email_id: emailId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }

  // Determine recipient (prospect or contact)
  const isProspectBased = !!email.prospect_id;
  const recipient = isProspectBased ? email.prospect : email.contact;

  if (!recipient || !recipient.email) {
    throw new Error('No recipient found for email');
  }

  // Get settings
  const settings = await getSettings(supabase);
  const fromEmail = settings.from_email || DEFAULT_FROM_EMAIL;
  const fromName = settings.from_name || DEFAULT_FROM_NAME;
  const replyTo = settings.reply_to || DEFAULT_REPLY_TO;

  // Send via SendGrid
  const result = await sendViaSendGrid({
    to: recipient.email,
    toName: `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim() || recipient.email,
    from: fromEmail,
    fromName: fromName,
    replyTo: replyTo,
    subject: email.subject,
    body: email.body,
    emailId: email.id,
  });

  if (!result.success) {
    // Update email status to failed
    await supabase
      .from('outreach_emails')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', emailId);

    throw new Error(result.error);
  }

  // Update email record
  await supabase
    .from('outreach_emails')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      sendgrid_message_id: result.messageId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', emailId);

  // Update campaign target status
  if (isProspectBased && email.campaign_prospect_id) {
    // Prospect-based email
    if (email.position === 1) {
      await supabase
        .from('campaign_prospects')
        .update({
          status: 'active',
          current_step: 1,
        })
        .eq('id', email.campaign_prospect_id);

      // Schedule follow-up emails (position 2 and 3)
      await scheduleFollowUpEmails(supabase, {
        campaign_prospect_id: email.campaign_prospect_id,
        sequence_id: email.sequence_id,
        sent_at: new Date(),
      });
    }

    // Update campaign stats
    const { data: cp } = await supabase
      .from('campaign_prospects')
      .select('campaign_id')
      .eq('id', email.campaign_prospect_id)
      .single();

    if (cp?.campaign_id) {
      await supabase.rpc('increment_campaign_emails_sent', {
        campaign_id: cp.campaign_id,
      });
    }
  } else if (email.campaign_contact_id) {
    // Contact-based email (legacy)
    if (email.position === 1) {
      await supabase
        .from('campaign_contacts')
        .update({
          status: 'active',
          current_step: 1,
        })
        .eq('id', email.campaign_contact_id);

      // Schedule follow-up emails (position 2 and 3)
      await scheduleFollowUpEmails(supabase, {
        campaign_contact_id: email.campaign_contact_id,
        sequence_id: email.sequence_id,
        sent_at: new Date(),
      });
    }

    // Update campaign stats
    const { data: cc } = await supabase
      .from('campaign_contacts')
      .select('campaign_id')
      .eq('id', email.campaign_contact_id)
      .single();

    if (cc?.campaign_id) {
      await supabase.rpc('increment_campaign_emails_sent', {
        campaign_id: cc.campaign_id,
      });
    }
  }

  console.log('Email sent:', recipient.email);

  return new Response(
    JSON.stringify({
      success: true,
      email_id: emailId,
      message_id: result.messageId,
      to: recipient.email,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  );
}

async function processScheduledEmails(supabase: any) {
  const now = new Date();

  // Get all scheduled emails due for sending (both contact and prospect based)
  const { data: emails, error } = await supabase
    .from('outreach_emails')
    .select(`
      *,
      contact:contacts(*),
      prospect:outreach_prospects(*),
      campaign_contact:campaign_contacts(
        campaign:outreach_campaigns(*)
      ),
      campaign_prospect:campaign_prospects(
        campaign:outreach_campaigns(*)
      )
    `)
    .eq('status', 'scheduled')
    .lte('scheduled_at', now.toISOString())
    .limit(50); // Process in batches

  if (error) {
    throw new Error(`Failed to fetch scheduled emails: ${error.message}`);
  }

  if (!emails || emails.length === 0) {
    return new Response(
      JSON.stringify({ success: true, processed: 0, message: 'No emails to process' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }

  // Group emails by campaign to check daily limits
  const campaignCounts: Record<string, number> = {};
  const settings = await getSettings(supabase);
  const maxPerDay = parseInt(settings.max_emails_per_day) || 50;

  // Get today's send counts per campaign
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const email of emails) {
    // Get campaign ID from either contact or prospect based path
    const campaignId = email.campaign_contact?.campaign?.id || email.campaign_prospect?.campaign?.id;
    if (campaignId && !campaignCounts[campaignId]) {
      // Get count from both contact and prospect emails
      const contactIds = await getCampaignContactIds(supabase, campaignId);
      const prospectIds = await getCampaignProspectIds(supabase, campaignId);

      let totalCount = 0;
      if (contactIds.length > 0) {
        const { count: contactCount } = await supabase
          .from('outreach_emails')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'sent')
          .gte('sent_at', today.toISOString())
          .in('campaign_contact_id', contactIds);
        totalCount += contactCount || 0;
      }
      if (prospectIds.length > 0) {
        const { count: prospectCount } = await supabase
          .from('outreach_emails')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'sent')
          .gte('sent_at', today.toISOString())
          .in('campaign_prospect_id', prospectIds);
        totalCount += prospectCount || 0;
      }

      campaignCounts[campaignId] = totalCount;
    }
  }

  const results: Array<{ email_id: string; status: string; reason?: string; error?: string; message_id?: string }> = [];
  const fromEmail = settings.from_email || DEFAULT_FROM_EMAIL;
  const fromName = settings.from_name || DEFAULT_FROM_NAME;
  const replyTo = settings.reply_to || DEFAULT_REPLY_TO;

  for (const email of emails) {
    const isProspectBased = !!email.prospect_id;
    const campaignId = email.campaign_contact?.campaign?.id || email.campaign_prospect?.campaign?.id;
    const campaign = email.campaign_contact?.campaign || email.campaign_prospect?.campaign;
    const recipient = isProspectBased ? email.prospect : email.contact;

    // Check daily limit
    if (campaignId && campaignCounts[campaignId] >= maxPerDay) {
      results.push({
        email_id: email.id,
        status: 'skipped',
        reason: 'Daily limit reached',
      });
      continue;
    }

    // Check if campaign is paused
    if (campaign?.status === 'paused') {
      results.push({
        email_id: email.id,
        status: 'skipped',
        reason: 'Campaign paused',
      });
      continue;
    }

    // Check recipient exists
    if (!recipient || !recipient.email) {
      results.push({
        email_id: email.id,
        status: 'failed',
        error: 'No recipient found',
      });
      continue;
    }

    // Send the email
    const result = await sendViaSendGrid({
      to: recipient.email,
      toName: `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim() || recipient.email,
      from: fromEmail,
      fromName: fromName,
      replyTo: replyTo,
      subject: email.subject,
      body: email.body,
      emailId: email.id,
    });

    if (result.success) {
      await supabase
        .from('outreach_emails')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          sendgrid_message_id: result.messageId,
        })
        .eq('id', email.id);

      // Update campaign target (contact or prospect)
      if (isProspectBased && email.campaign_prospect_id) {
        await supabase
          .from('campaign_prospects')
          .update({
            status: 'active',
            current_step: email.position,
          })
          .eq('id', email.campaign_prospect_id);
      } else if (email.campaign_contact_id) {
        await supabase
          .from('campaign_contacts')
          .update({
            status: 'active',
            current_step: email.position,
          })
          .eq('id', email.campaign_contact_id);
      }

      if (campaignId) {
        campaignCounts[campaignId]++;
      }

      results.push({
        email_id: email.id,
        status: 'sent',
        message_id: result.messageId,
      });
    } else {
      await supabase
        .from('outreach_emails')
        .update({ status: 'failed' })
        .eq('id', email.id);

      results.push({
        email_id: email.id,
        status: 'failed',
        error: result.error,
      });
    }
  }

  const sent = results.filter(r => r.status === 'sent').length;
  console.log(`Processed ${results.length} emails, sent ${sent}`);

  return new Response(
    JSON.stringify({
      success: true,
      processed: results.length,
      sent,
      results,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  );
}

async function sendCampaignBatch(supabase: any, campaignId: string) {
  if (!campaignId) {
    throw new Error('campaign_id is required');
  }

  // Get campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('outreach_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign) {
    throw new Error(`Campaign not found: ${campaignError?.message}`);
  }

  if (campaign.status !== 'active') {
    return new Response(
      JSON.stringify({ success: false, error: 'Campaign is not active' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }

  const settings = await getSettings(supabase);
  const maxPerDay = campaign.max_emails_per_day || parseInt(settings.max_emails_per_day) || 50;

  // Get today's send count for this campaign (both contact and prospect emails)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const contactIds = await getCampaignContactIds(supabase, campaignId);
  const prospectIds = await getCampaignProspectIds(supabase, campaignId);

  let sentToday = 0;
  let scheduledToday = 0;

  if (contactIds.length > 0) {
    // Count sent today
    const { count: contactSentCount } = await supabase
      .from('outreach_emails')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('sent_at', today.toISOString())
      .in('campaign_contact_id', contactIds);
    sentToday += contactSentCount || 0;

    // Count scheduled for today (follow-ups that will auto-send)
    const { count: contactScheduledCount } = await supabase
      .from('outreach_emails')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'scheduled')
      .gte('scheduled_at', today.toISOString())
      .lt('scheduled_at', tomorrow.toISOString())
      .in('campaign_contact_id', contactIds);
    scheduledToday += contactScheduledCount || 0;
  }

  if (prospectIds.length > 0) {
    // Count sent today
    const { count: prospectSentCount } = await supabase
      .from('outreach_emails')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('sent_at', today.toISOString())
      .in('campaign_prospect_id', prospectIds);
    sentToday += prospectSentCount || 0;

    // Count scheduled for today (follow-ups that will auto-send)
    const { count: prospectScheduledCount } = await supabase
      .from('outreach_emails')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'scheduled')
      .gte('scheduled_at', today.toISOString())
      .lt('scheduled_at', tomorrow.toISOString())
      .in('campaign_prospect_id', prospectIds);
    scheduledToday += prospectScheduledCount || 0;
  }

  // Account for both sent AND scheduled emails in the daily limit
  const usedToday = sentToday + scheduledToday;
  const remaining = maxPerDay - usedToday;

  if (remaining <= 0) {
    return new Response(
      JSON.stringify({
        success: true,
        sent: 0,
        message: 'Daily limit reached (including scheduled follow-ups)',
        sent_today: sentToday,
        scheduled_today: scheduledToday,
        max_per_day: maxPerDay,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }

  // Get approved emails ready to send (both contact and prospect based)
  // First, get contact-based emails
  const { data: contactEmails } = await supabase
    .from('outreach_emails')
    .select(`
      *,
      contact:contacts(*),
      campaign_contact:campaign_contacts!inner(campaign_id)
    `)
    .eq('status', 'approved')
    .eq('campaign_contact.campaign_id', campaignId)
    .limit(remaining);

  // Then, get prospect-based emails
  const { data: prospectEmails } = await supabase
    .from('outreach_emails')
    .select(`
      *,
      prospect:outreach_prospects(*),
      campaign_prospect:campaign_prospects!inner(campaign_id)
    `)
    .eq('status', 'approved')
    .eq('campaign_prospect.campaign_id', campaignId)
    .limit(remaining - (contactEmails?.length || 0));

  // Combine and limit
  const emails = [...(contactEmails || []), ...(prospectEmails || [])].slice(0, remaining);

  if (emails.length === 0) {
    return new Response(
      JSON.stringify({ success: true, sent: 0, message: 'No approved emails to send' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }

  const fromEmail = settings.from_email || DEFAULT_FROM_EMAIL;
  const fromName = settings.from_name || DEFAULT_FROM_NAME;
  const replyTo = settings.reply_to || DEFAULT_REPLY_TO;

  const results: Array<{ email_id: string; status: string; error?: string }> = [];

  for (const email of emails) {
    const isProspectBased = !!email.prospect_id;
    const recipient = isProspectBased ? email.prospect : email.contact;

    if (!recipient || !recipient.email) {
      results.push({ email_id: email.id, status: 'failed', error: 'No recipient found' });
      continue;
    }

    const result = await sendViaSendGrid({
      to: recipient.email,
      toName: `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim() || recipient.email,
      from: fromEmail,
      fromName: fromName,
      replyTo: replyTo,
      subject: email.subject,
      body: email.body,
      emailId: email.id,
    });

    if (result.success) {
      const sentAt = new Date();
      await supabase
        .from('outreach_emails')
        .update({
          status: 'sent',
          sent_at: sentAt.toISOString(),
          sendgrid_message_id: result.messageId,
        })
        .eq('id', email.id);

      // Update campaign target status
      if (isProspectBased && email.campaign_prospect_id) {
        await supabase
          .from('campaign_prospects')
          .update({
            status: 'active',
            current_step: email.position,
          })
          .eq('id', email.campaign_prospect_id);

        // Schedule follow-ups when Email 1 is sent
        if (email.position === 1) {
          await scheduleFollowUpEmails(supabase, {
            campaign_prospect_id: email.campaign_prospect_id,
            sequence_id: email.sequence_id,
            sent_at: sentAt,
          });
        }
      } else if (email.campaign_contact_id) {
        await supabase
          .from('campaign_contacts')
          .update({
            status: 'active',
            current_step: email.position,
          })
          .eq('id', email.campaign_contact_id);

        // Schedule follow-ups when Email 1 is sent
        if (email.position === 1) {
          await scheduleFollowUpEmails(supabase, {
            campaign_contact_id: email.campaign_contact_id,
            sequence_id: email.sequence_id,
            sent_at: sentAt,
          });
        }
      }

      results.push({ email_id: email.id, status: 'sent' });
    } else {
      await supabase
        .from('outreach_emails')
        .update({ status: 'failed' })
        .eq('id', email.id);

      results.push({ email_id: email.id, status: 'failed', error: result.error });
    }
  }

  // Update campaign stats
  const sentCount = results.filter(r => r.status === 'sent').length;
  await supabase
    .from('outreach_campaigns')
    .update({
      emails_sent: campaign.emails_sent + sentCount,
    })
    .eq('id', campaignId);

  console.log(`Campaign ${campaignId}: sent ${sentCount} emails`);

  return new Response(
    JSON.stringify({
      success: true,
      sent: sentCount,
      results,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  );
}

async function sendViaSendGrid(params: {
  to: string;
  toName: string;
  from: string;
  fromName: string;
  replyTo: string;
  subject: string;
  body: string;
  emailId: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!SENDGRID_API_KEY) {
    return { success: false, error: 'SendGrid API key not configured' };
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: params.to, name: params.toName }],
            custom_args: {
              outreach_email_id: params.emailId,
            },
          },
        ],
        from: {
          email: params.from,
          name: params.fromName,
        },
        reply_to: {
          email: params.replyTo,
        },
        subject: params.subject,
        content: [
          {
            type: 'text/plain',
            value: params.body,
          },
        ],
        tracking_settings: {
          open_tracking: { enable: true },
          click_tracking: { enable: false }, // No links in our emails
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SendGrid error:', response.status, errorText);
      // Parse SendGrid error for more detail
      let errorDetail = `SendGrid error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.errors && errorJson.errors.length > 0) {
          errorDetail = `SendGrid: ${errorJson.errors.map((e: any) => e.message).join(', ')}`;
        }
      } catch {
        // If not JSON, include raw text
        if (errorText) {
          errorDetail = `SendGrid error ${response.status}: ${errorText.substring(0, 200)}`;
        }
      }
      return { success: false, error: errorDetail };
    }

    // Get message ID from headers
    const messageId = response.headers.get('x-message-id') || '';

    return { success: true, messageId };
  } catch (error) {
    console.error('SendGrid request failed:', error);
    return { success: false, error: error.message };
  }
}

async function getSettings(supabase: any): Promise<Record<string, string>> {
  const { data: settings } = await supabase
    .from('outreach_settings')
    .select('key, value');

  const result: Record<string, string> = {};
  for (const s of settings || []) {
    result[s.key] = s.value;
  }
  return result;
}

async function getCampaignContactIds(supabase: any, campaignId: string): Promise<string[]> {
  const { data } = await supabase
    .from('campaign_contacts')
    .select('id')
    .eq('campaign_id', campaignId);

  return (data || []).map((cc: any) => cc.id);
}

async function getCampaignProspectIds(supabase: any, campaignId: string): Promise<string[]> {
  const { data } = await supabase
    .from('campaign_prospects')
    .select('id')
    .eq('campaign_id', campaignId);

  return (data || []).map((cp: any) => cp.id);
}

// Schedule follow-up emails when Email 1 is sent
async function scheduleFollowUpEmails(
  supabase: any,
  params: {
    campaign_prospect_id?: string;
    campaign_contact_id?: string;
    sequence_id: string;
    sent_at: Date;
  }
): Promise<void> {
  const { campaign_prospect_id, campaign_contact_id, sequence_id, sent_at } = params;

  // Get sequence templates with days_delay for positions 2 and 3
  const { data: templates, error: templatesError } = await supabase
    .from('sequence_templates')
    .select('position, days_delay')
    .eq('sequence_id', sequence_id)
    .gt('position', 1)
    .order('position', { ascending: true });

  if (templatesError || !templates || templates.length === 0) {
    console.log('No follow-up templates found for sequence:', sequence_id);
    return;
  }

  // Find pending follow-up emails for this prospect/contact
  let query = supabase
    .from('outreach_emails')
    .select('id, position')
    .eq('status', 'pending_followup')
    .gt('position', 1);

  if (campaign_prospect_id) {
    query = query.eq('campaign_prospect_id', campaign_prospect_id);
  } else if (campaign_contact_id) {
    query = query.eq('campaign_contact_id', campaign_contact_id);
  } else {
    return;
  }

  const { data: followUpEmails, error: emailsError } = await query;

  if (emailsError || !followUpEmails || followUpEmails.length === 0) {
    console.log('No pending follow-up emails found');
    return;
  }

  // Create a map of position -> days_delay
  const delayMap: Record<number, number> = {};
  for (const template of templates) {
    delayMap[template.position] = template.days_delay || 0;
  }

  // Schedule each follow-up email
  for (const email of followUpEmails) {
    const daysDelay = delayMap[email.position] || 3; // Default 3 days if not set
    const scheduledAt = new Date(sent_at);
    scheduledAt.setDate(scheduledAt.getDate() + daysDelay);

    // Set to a reasonable send time (9 AM in the scheduled day)
    scheduledAt.setHours(9, 0, 0, 0);

    await supabase
      .from('outreach_emails')
      .update({
        status: 'scheduled',
        scheduled_at: scheduledAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', email.id);

    console.log(`Scheduled email ${email.id} (position ${email.position}) for ${scheduledAt.toISOString()}`);
  }

  console.log(`Scheduled ${followUpEmails.length} follow-up emails`);
}

// Get campaign capacity - how many new prospects can be emailed today
async function getCampaignCapacity(supabase: any, campaignId: string) {
  if (!campaignId) {
    throw new Error('campaign_id is required');
  }

  const { data: campaign, error: campaignError } = await supabase
    .from('outreach_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign) {
    throw new Error(`Campaign not found: ${campaignError?.message}`);
  }

  const settings = await getSettings(supabase);
  const maxPerDay = campaign.max_emails_per_day || parseInt(settings.max_emails_per_day) || 50;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const contactIds = await getCampaignContactIds(supabase, campaignId);
  const prospectIds = await getCampaignProspectIds(supabase, campaignId);

  let sentToday = 0;
  let scheduledToday = 0;
  let approvedReady = 0;

  if (contactIds.length > 0) {
    const { count: contactSentCount } = await supabase
      .from('outreach_emails')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('sent_at', today.toISOString())
      .in('campaign_contact_id', contactIds);
    sentToday += contactSentCount || 0;

    const { count: contactScheduledCount } = await supabase
      .from('outreach_emails')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'scheduled')
      .gte('scheduled_at', today.toISOString())
      .lt('scheduled_at', tomorrow.toISOString())
      .in('campaign_contact_id', contactIds);
    scheduledToday += contactScheduledCount || 0;

    const { count: contactApprovedCount } = await supabase
      .from('outreach_emails')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .in('campaign_contact_id', contactIds);
    approvedReady += contactApprovedCount || 0;
  }

  if (prospectIds.length > 0) {
    const { count: prospectSentCount } = await supabase
      .from('outreach_emails')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('sent_at', today.toISOString())
      .in('campaign_prospect_id', prospectIds);
    sentToday += prospectSentCount || 0;

    const { count: prospectScheduledCount } = await supabase
      .from('outreach_emails')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'scheduled')
      .gte('scheduled_at', today.toISOString())
      .lt('scheduled_at', tomorrow.toISOString())
      .in('campaign_prospect_id', prospectIds);
    scheduledToday += prospectScheduledCount || 0;

    const { count: prospectApprovedCount } = await supabase
      .from('outreach_emails')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .in('campaign_prospect_id', prospectIds);
    approvedReady += prospectApprovedCount || 0;
  }

  const usedToday = sentToday + scheduledToday;
  const availableSlots = Math.max(0, maxPerDay - usedToday);
  const canSendNow = Math.min(approvedReady, availableSlots);

  return new Response(
    JSON.stringify({
      success: true,
      max_per_day: maxPerDay,
      sent_today: sentToday,
      scheduled_today: scheduledToday,
      used_today: usedToday,
      available_slots: availableSlots,
      approved_ready: approvedReady,
      can_send_now: canSendNow,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  );
}

// Activate campaign and send approved emails
async function activateCampaign(supabase: any, campaignId: string) {
  if (!campaignId) {
    throw new Error('campaign_id is required');
  }

  // Update campaign status to active
  const { error: updateError } = await supabase
    .from('outreach_campaigns')
    .update({ status: 'active' })
    .eq('id', campaignId);

  if (updateError) {
    throw new Error(`Failed to activate campaign: ${updateError.message}`);
  }

  // Now send approved emails (reuse existing batch logic)
  const batchResult = await sendCampaignBatch(supabase, campaignId);

  // Parse the response to get the data
  const batchData = await batchResult.json();

  return new Response(
    JSON.stringify({
      success: true,
      activated: true,
      ...batchData,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  );
}
