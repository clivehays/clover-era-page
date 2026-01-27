import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function is called when an inbound email is received (via SendGrid Inbound Parse)
// or manually triggered when a reply is detected

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { type, email_id, from_email, subject, body_text, contact_id } = body;

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Type 1: Mark an outreach email as replied
    if (type === 'mark_replied' && email_id) {
      return await markEmailReplied(supabase, email_id);
    }

    // Type 2: Process inbound email (from SendGrid Inbound Parse)
    if (type === 'inbound_email' && from_email) {
      return await processInboundEmail(supabase, from_email, subject, body_text);
    }

    // Type 3: Manually create opportunity from contact
    if (type === 'create_opportunity' && contact_id) {
      return await createOpportunityFromContact(supabase, contact_id);
    }

    throw new Error('Invalid request type');

  } catch (error) {
    console.error('Handle reply error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function markEmailReplied(supabase: any, emailId: string) {
  // Get email with contact and campaign data
  const { data: email, error: emailError } = await supabase
    .from('outreach_emails')
    .select(`
      *,
      contact:contacts(*,
        company:companies(*)
      ),
      campaign_contact:campaign_contacts(
        campaign:outreach_campaigns(*)
      )
    `)
    .eq('id', emailId)
    .single();

  if (emailError || !email) {
    throw new Error(`Email not found: ${emailError?.message}`);
  }

  // Update email status
  await supabase
    .from('outreach_emails')
    .update({
      status: 'replied',
      replied_at: new Date().toISOString(),
    })
    .eq('id', emailId);

  // Update campaign contact status
  if (email.campaign_contact_id) {
    await supabase
      .from('campaign_contacts')
      .update({ status: 'replied' })
      .eq('id', email.campaign_contact_id);

    // Update campaign stats
    if (email.campaign_contact?.campaign?.id) {
      await supabase
        .from('outreach_campaigns')
        .update({
          emails_replied: supabase.sql`emails_replied + 1`,
        })
        .eq('id', email.campaign_contact.campaign.id);
    }
  }

  // Cancel any pending follow-up emails for this contact
  await supabase
    .from('outreach_emails')
    .update({ status: 'draft' }) // Move back to draft rather than delete
    .eq('campaign_contact_id', email.campaign_contact_id)
    .in('status', ['scheduled', 'approved'])
    .gt('position', email.position);

  // Check settings for auto-opportunity creation
  const { data: settings } = await supabase
    .from('outreach_settings')
    .select('value')
    .eq('key', 'reply_creates_opportunity')
    .single();

  let opportunity = null;

  if (settings?.value === 'true') {
    opportunity = await createOpportunity(supabase, email.contact, email.contact.company);
  }

  // Record event
  await supabase.from('email_events').insert({
    outreach_email_id: emailId,
    event_type: 'replied',
    event_data: { manually_marked: true },
    received_at: new Date().toISOString(),
  });

  console.log('Marked email as replied:', emailId);

  return new Response(
    JSON.stringify({
      success: true,
      email_id: emailId,
      opportunity_created: !!opportunity,
      opportunity_id: opportunity?.id,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  );
}

async function processInboundEmail(
  supabase: any,
  fromEmail: string,
  subject: string,
  bodyText: string
) {
  // Find contact by email
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('*, company:companies(*)')
    .eq('email', fromEmail.toLowerCase())
    .single();

  if (contactError || !contact) {
    console.log('Contact not found for inbound email:', fromEmail);
    return new Response(
      JSON.stringify({ success: true, matched: false, reason: 'Contact not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }

  // Find most recent sent outreach email to this contact
  const { data: email } = await supabase
    .from('outreach_emails')
    .select('*, campaign_contact:campaign_contacts(*)')
    .eq('contact_id', contact.id)
    .in('status', ['sent', 'delivered', 'opened'])
    .order('sent_at', { ascending: false })
    .limit(1)
    .single();

  if (!email) {
    console.log('No recent outreach email found for contact:', contact.id);
    return new Response(
      JSON.stringify({ success: true, matched: false, reason: 'No recent outreach' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }

  // Mark the email as replied
  await supabase
    .from('outreach_emails')
    .update({
      status: 'replied',
      replied_at: new Date().toISOString(),
    })
    .eq('id', email.id);

  // Update campaign contact
  if (email.campaign_contact_id) {
    await supabase
      .from('campaign_contacts')
      .update({ status: 'replied' })
      .eq('id', email.campaign_contact_id);
  }

  // Record the reply event with the actual reply content
  await supabase.from('email_events').insert({
    outreach_email_id: email.id,
    event_type: 'replied',
    event_data: {
      subject,
      body_preview: bodyText?.substring(0, 500),
      from: fromEmail,
    },
    received_at: new Date().toISOString(),
  });

  // Check settings for auto-opportunity creation
  const { data: settings } = await supabase
    .from('outreach_settings')
    .select('value')
    .eq('key', 'reply_creates_opportunity')
    .single();

  let opportunity = null;

  if (settings?.value === 'true') {
    opportunity = await createOpportunity(supabase, contact, contact.company);
  }

  console.log('Processed inbound reply from:', fromEmail);

  return new Response(
    JSON.stringify({
      success: true,
      matched: true,
      email_id: email.id,
      contact_id: contact.id,
      opportunity_created: !!opportunity,
      opportunity_id: opportunity?.id,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  );
}

async function createOpportunityFromContact(supabase: any, contactId: string) {
  // Get contact with company
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('*, company:companies(*)')
    .eq('id', contactId)
    .single();

  if (contactError || !contact) {
    throw new Error(`Contact not found: ${contactError?.message}`);
  }

  const opportunity = await createOpportunity(supabase, contact, contact.company);

  return new Response(
    JSON.stringify({
      success: true,
      opportunity,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  );
}

async function createOpportunity(supabase: any, contact: any, company: any) {
  // Check if opportunity already exists for this contact
  const { data: existing } = await supabase
    .from('opportunities')
    .select('id')
    .eq('contact_id', contact.id)
    .in('stage', ['lead', 'qualified', 'demo-scheduled', 'demo-completed', 'proposal', 'negotiation', 'pilot'])
    .limit(1)
    .single();

  if (existing) {
    console.log('Opportunity already exists for contact:', contact.id);
    return existing;
  }

  // Calculate estimated deal value based on employee count
  const employeeCount = company?.employee_count || 100;
  const estimatedManagers = Math.ceil(employeeCount / 10); // Assume 1 manager per 10 employees
  const pricePerManager = 295;
  const estimatedValue = estimatedManagers * pricePerManager * 12; // Annual value

  // Create opportunity
  const { data: opportunity, error: oppError } = await supabase
    .from('opportunities')
    .insert({
      company_id: company?.id,
      contact_id: contact.id,
      title: `${company?.name || contact.first_name} - Outreach Reply`,
      stage: 'lead',
      value: estimatedValue,
      probability: 10,
      managers_count: estimatedManagers,
      monthly_recurring_revenue: estimatedManagers * pricePerManager,
      annual_contract_value: estimatedValue,
      source: 'outbound',
      next_step: 'Follow up on outreach reply',
      notes: `Created automatically from outreach reply.\nContact: ${contact.first_name} ${contact.last_name}\nTitle: ${contact.title}`,
    })
    .select()
    .single();

  if (oppError) {
    console.error('Failed to create opportunity:', oppError);
    throw new Error(`Failed to create opportunity: ${oppError.message}`);
  }

  // Create follow-up task
  await supabase.from('activities').insert({
    opportunity_id: opportunity.id,
    company_id: company?.id,
    contact_id: contact.id,
    type: 'task',
    subject: 'Follow up on outreach reply',
    description: `${contact.first_name} ${contact.last_name} replied to outreach email. Follow up within 24 hours.`,
    completed: false,
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  });

  console.log('Created opportunity:', opportunity.id, 'for contact:', contact.id);

  return opportunity;
}
