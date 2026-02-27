import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function is called when a reply is detected (via outreach-reply-detection cron)
// or manually triggered from the CRM

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
  // Get email with contact, prospect, and campaign data
  const { data: email, error: emailError } = await supabase
    .from('outreach_emails')
    .select(`
      *,
      contact:contacts(*,
        company:companies(*)
      ),
      prospect:outreach_prospects(*),
      campaign_contact:campaign_contacts(
        campaign:outreach_campaigns(*)
      ),
      campaign_prospect:campaign_prospects(
        campaign:outreach_campaigns(*)
      )
    `)
    .eq('id', emailId)
    .single();

  if (emailError || !email) {
    throw new Error(`Email not found: ${emailError?.message}`);
  }

  const isProspectBased = !!email.prospect_id;

  // Update email status
  await supabase
    .from('outreach_emails')
    .update({
      status: 'replied',
      replied_at: new Date().toISOString(),
    })
    .eq('id', emailId);

  let contact = email.contact;
  let company = email.contact?.company;
  let campaignId = null;

  if (isProspectBased) {
    // PROSPECT-BASED: Convert prospect to CRM contact
    const conversionResult = await convertProspectToContact(supabase, email.prospect);
    contact = conversionResult.contact;
    company = conversionResult.company;

    // Update campaign prospect status
    if (email.campaign_prospect_id) {
      await supabase
        .from('campaign_prospects')
        .update({ status: 'replied' })
        .eq('id', email.campaign_prospect_id);

      campaignId = email.campaign_prospect?.campaign?.id;
    }

    // Cancel any pending follow-up emails for this prospect
    await supabase
      .from('outreach_emails')
      .update({ status: 'draft' })
      .eq('campaign_prospect_id', email.campaign_prospect_id)
      .in('status', ['scheduled', 'approved'])
      .gt('position', email.position);

  } else {
    // CONTACT-BASED (legacy): Update campaign contact status
    if (email.campaign_contact_id) {
      await supabase
        .from('campaign_contacts')
        .update({ status: 'replied' })
        .eq('id', email.campaign_contact_id);

      campaignId = email.campaign_contact?.campaign?.id;
    }

    // Cancel any pending follow-up emails for this contact
    await supabase
      .from('outreach_emails')
      .update({ status: 'draft' })
      .eq('campaign_contact_id', email.campaign_contact_id)
      .in('status', ['scheduled', 'approved'])
      .gt('position', email.position);
  }

  // Update campaign stats
  if (campaignId) {
    await supabase
      .from('outreach_campaigns')
      .update({
        emails_replied: supabase.sql`emails_replied + 1`,
      })
      .eq('id', campaignId);
  }

  // Check settings for auto-opportunity creation
  const { data: settings } = await supabase
    .from('outreach_settings')
    .select('value')
    .eq('key', 'reply_creates_opportunity')
    .single();

  let opportunity = null;

  if (settings?.value === 'true' && contact) {
    opportunity = await createOpportunity(supabase, contact, company);
  }

  // Record event
  await supabase.from('email_events').insert({
    outreach_email_id: emailId,
    event_type: 'replied',
    event_data: {
      manually_marked: true,
      prospect_converted: isProspectBased,
    },
    received_at: new Date().toISOString(),
  });

  console.log('Marked email as replied:', emailId, isProspectBased ? '(prospect converted)' : '');

  return new Response(
    JSON.stringify({
      success: true,
      email_id: emailId,
      prospect_converted: isProspectBased,
      contact_id: contact?.id,
      company_id: company?.id,
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
  const emailLower = fromEmail.toLowerCase();

  // First, check if sender is an existing CRM contact
  const { data: existingContact } = await supabase
    .from('contacts')
    .select('*, company:companies(*)')
    .eq('email', emailLower)
    .single();

  // Also check if sender is an outreach prospect
  const { data: prospect } = await supabase
    .from('outreach_prospects')
    .select('*')
    .eq('email', emailLower)
    .single();

  if (!existingContact && !prospect) {
    console.log('Sender not found in contacts or prospects:', fromEmail);
    return new Response(
      JSON.stringify({ success: true, matched: false, reason: 'Sender not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }

  // Find most recent sent outreach email (check both contact and prospect)
  let email: any = null;

  if (existingContact) {
    const { data: contactEmail } = await supabase
      .from('outreach_emails')
      .select('*, campaign_contact:campaign_contacts(*)')
      .eq('contact_id', existingContact.id)
      .in('status', ['sent', 'delivered', 'opened'])
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();
    email = contactEmail;
  }

  if (!email && prospect) {
    const { data: prospectEmail } = await supabase
      .from('outreach_emails')
      .select('*, campaign_prospect:campaign_prospects(*), prospect:outreach_prospects(*)')
      .eq('prospect_id', prospect.id)
      .in('status', ['sent', 'delivered', 'opened'])
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();
    email = prospectEmail;
  }

  if (!email) {
    console.log('No recent outreach email found for:', fromEmail);
    return new Response(
      JSON.stringify({ success: true, matched: false, reason: 'No recent outreach' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }

  const isProspectBased = !!email.prospect_id;
  let contact = existingContact;
  let company = existingContact?.company;

  // Mark the email as replied
  await supabase
    .from('outreach_emails')
    .update({
      status: 'replied',
      replied_at: new Date().toISOString(),
    })
    .eq('id', email.id);

  if (isProspectBased) {
    // Convert prospect to CRM contact
    const conversionResult = await convertProspectToContact(supabase, prospect);
    contact = conversionResult.contact;
    company = conversionResult.company;

    // Update campaign prospect
    if (email.campaign_prospect_id) {
      await supabase
        .from('campaign_prospects')
        .update({ status: 'replied' })
        .eq('id', email.campaign_prospect_id);
    }
  } else {
    // Update campaign contact
    if (email.campaign_contact_id) {
      await supabase
        .from('campaign_contacts')
        .update({ status: 'replied' })
        .eq('id', email.campaign_contact_id);
    }
  }

  // Record the reply event with the actual reply content
  await supabase.from('email_events').insert({
    outreach_email_id: email.id,
    event_type: 'replied',
    event_data: {
      subject,
      body_preview: bodyText?.substring(0, 500),
      from: fromEmail,
      prospect_converted: isProspectBased,
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

  if (settings?.value === 'true' && contact) {
    opportunity = await createOpportunity(supabase, contact, company);
  }

  console.log('Processed inbound reply from:', fromEmail, isProspectBased ? '(prospect converted)' : '');

  return new Response(
    JSON.stringify({
      success: true,
      matched: true,
      email_id: email.id,
      contact_id: contact?.id,
      prospect_converted: isProspectBased,
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

// THE BRIDGE: Convert outreach prospect to CRM contact/company
async function convertProspectToContact(
  supabase: any,
  prospect: any
): Promise<{ contact: any; company: any }> {
  // Check if already converted
  if (prospect.converted_contact_id) {
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('*, company:companies(*)')
      .eq('id', prospect.converted_contact_id)
      .single();

    if (existingContact) {
      console.log('Prospect already converted to contact:', existingContact.id);
      return { contact: existingContact, company: existingContact.company };
    }
  }

  // Check if contact with this email already exists in CRM
  const { data: existingByEmail } = await supabase
    .from('contacts')
    .select('*, company:companies(*)')
    .eq('email', prospect.email.toLowerCase())
    .single();

  if (existingByEmail) {
    // Link prospect to existing contact
    await supabase
      .from('outreach_prospects')
      .update({
        status: 'converted',
        converted_contact_id: existingByEmail.id,
        converted_at: new Date().toISOString(),
      })
      .eq('id', prospect.id);

    console.log('Prospect linked to existing contact:', existingByEmail.id);
    return { contact: existingByEmail, company: existingByEmail.company };
  }

  // Create new company if we have company info
  let company: any = null;
  if (prospect.company_name) {
    // Check if company already exists
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('*')
      .ilike('name', prospect.company_name)
      .limit(1)
      .single();

    if (existingCompany) {
      company = existingCompany;
    } else {
      // Create new company
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: prospect.company_name,
          website: prospect.company_website,
          industry: prospect.company_industry,
          employee_count: prospect.company_employee_count,
          source: 'outreach_conversion',
        })
        .select()
        .single();

      if (companyError) {
        console.error('Failed to create company:', companyError);
      } else {
        company = newCompany;
        console.log('Created company:', newCompany.id, newCompany.name);
      }
    }
  }

  // Create contact
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .insert({
      email: prospect.email.toLowerCase(),
      first_name: prospect.first_name,
      last_name: prospect.last_name,
      title: prospect.title,
      linkedin_url: prospect.linkedin_url,
      company_id: company?.id,
      source: 'outreach_conversion',
    })
    .select()
    .single();

  if (contactError) {
    console.error('Failed to create contact:', contactError);
    throw new Error(`Failed to create contact: ${contactError.message}`);
  }

  // Update prospect with conversion info
  await supabase
    .from('outreach_prospects')
    .update({
      status: 'converted',
      converted_contact_id: contact.id,
      converted_at: new Date().toISOString(),
    })
    .eq('id', prospect.id);

  console.log('Converted prospect to contact:', contact.id, prospect.email);

  return { contact, company };
}
