import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CLOVER_ERA_CONTEXT, EMAIL_RULES, getCompanySizeContext } from '../_shared/brand-context.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Support both contact-based and prospect-based email generation
    const { campaign_contact_id, campaign_prospect_id, sequence_id } = await req.json();

    if (!campaign_contact_id && !campaign_prospect_id) {
      throw new Error('campaign_contact_id or campaign_prospect_id is required');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const isProspectBased = !!campaign_prospect_id;

    // Variables to hold the target data
    let targetId: string;
    let targetFirstName: string;
    let targetLastName: string;
    let targetTitle: string;
    let targetEmail: string;
    let companyName: string;
    let companyEmployeeCount: number;
    let companyIndustry: string;
    let campaignSequenceId: string | null;
    let research: any;

    if (isProspectBased) {
      // PROSPECT-BASED EMAIL GENERATION
      const { data: campaignProspect, error: cpError } = await supabase
        .from('campaign_prospects')
        .select(`
          *,
          prospect:outreach_prospects(*),
          campaign:outreach_campaigns(*)
        `)
        .eq('id', campaign_prospect_id)
        .single();

      if (cpError || !campaignProspect) {
        throw new Error(`Campaign prospect not found: ${cpError?.message}`);
      }

      const prospect = campaignProspect.prospect;

      targetId = prospect.id;
      targetFirstName = prospect.first_name || '';
      targetLastName = prospect.last_name || '';
      targetTitle = prospect.title || 'Executive';
      targetEmail = prospect.email;
      companyName = prospect.company_name || 'your company';
      companyEmployeeCount = prospect.company_employee_count || 100;
      companyIndustry = prospect.company_industry || 'your industry';
      campaignSequenceId = campaignProspect.campaign?.sequence_id;

      // Get research by prospect_id
      const { data: prospectResearch } = await supabase
        .from('prospect_research')
        .select('*')
        .eq('prospect_id', targetId)
        .single();

      if (!prospectResearch) {
        throw new Error('Research not found. Run research-prospect first.');
      }
      research = prospectResearch;

      console.log('Generating emails for prospect:', targetFirstName, targetLastName);

    } else {
      // CONTACT-BASED EMAIL GENERATION (legacy)
      const { data: campaignContact, error: ccError } = await supabase
        .from('campaign_contacts')
        .select(`
          *,
          contact:contacts(*,
            company:companies(*)
          ),
          campaign:outreach_campaigns(*)
        `)
        .eq('id', campaign_contact_id)
        .single();

      if (ccError || !campaignContact) {
        throw new Error(`Campaign contact not found: ${ccError?.message}`);
      }

      const contact = campaignContact.contact;
      const company = contact?.company;

      targetId = contact.id;
      targetFirstName = contact.first_name || '';
      targetLastName = contact.last_name || '';
      targetTitle = contact.title || 'Executive';
      targetEmail = contact.email;
      companyName = company?.name || 'your company';
      companyEmployeeCount = company?.employee_count || 100;
      companyIndustry = company?.industry || 'your industry';
      campaignSequenceId = campaignContact.campaign?.sequence_id;

      // Get research by contact_id
      const { data: contactResearch } = await supabase
        .from('prospect_research')
        .select('*')
        .eq('contact_id', targetId)
        .single();

      if (!contactResearch) {
        throw new Error('Research not found. Run research-prospect first.');
      }
      research = contactResearch;

      console.log('Generating emails for contact:', targetFirstName, targetLastName);
    }

    // Get sequence ID (from parameter, campaign, or default)
    let seqId = sequence_id || campaignSequenceId;

    if (!seqId) {
      const { data: defaultSeq } = await supabase
        .from('outreach_sequences')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single();

      seqId = defaultSeq?.id;
    }

    if (!seqId) {
      throw new Error('No sequence found');
    }

    // Get sequence templates
    const { data: templates, error: templatesError } = await supabase
      .from('sequence_templates')
      .select('*')
      .eq('sequence_id', seqId)
      .order('position', { ascending: true });

    if (templatesError || !templates || templates.length === 0) {
      throw new Error(`No templates found for sequence: ${templatesError?.message}`);
    }

    // Prepare context for AI
    const context = {
      first_name: targetFirstName,
      last_name: targetLastName,
      full_name: `${targetFirstName} ${targetLastName}`,
      title: targetTitle,
      email: targetEmail,
      company_name: companyName,
      employee_count: companyEmployeeCount,
      industry: companyIndustry,
      research_summary: research.research_summary,
      growth_signals: research.growth_signals || [],
      personalization_angle: research.personalization_angle,
      turnover_estimate_low: research.turnover_estimate_low,
      turnover_estimate_high: research.turnover_estimate_high,
    };

    // Generate ALL emails in one call for narrative continuity
    const generatedEmailContents = await generateEmailSequence(templates, context);

    // Build email records with appropriate IDs
    // Email 1 = draft (for approval), Emails 2 & 3 = pending_followup (wait for Email 1 to be sent)
    const generatedEmails = generatedEmailContents.map((email, index) => {
      const position = templates[index].position;
      const emailRecord: Record<string, any> = {
        sequence_id: seqId,
        position: position,
        subject: email.subject,
        body: email.body,
        personalization_notes: email.notes,
        // Email 1 is ready for approval, follow-ups wait for Email 1 to be sent
        status: position === 1 ? 'draft' : 'pending_followup',
      };

      if (isProspectBased) {
        emailRecord.campaign_prospect_id = campaign_prospect_id;
        emailRecord.prospect_id = targetId;
      } else {
        emailRecord.campaign_contact_id = campaign_contact_id;
        emailRecord.contact_id = targetId;
      }

      return emailRecord;
    });

    // Delete any existing draft/pending emails for this campaign target (when regenerating)
    if (isProspectBased) {
      await supabase
        .from('outreach_emails')
        .delete()
        .eq('campaign_prospect_id', campaign_prospect_id)
        .in('status', ['draft', 'pending_followup']);
    } else {
      await supabase
        .from('outreach_emails')
        .delete()
        .eq('campaign_contact_id', campaign_contact_id)
        .in('status', ['draft', 'pending_followup']);
    }

    // Insert new emails
    const { data: savedEmails, error: saveError } = await supabase
      .from('outreach_emails')
      .insert(generatedEmails)
      .select();

    if (saveError) {
      throw new Error(`Failed to save emails: ${saveError.message}`);
    }

    // Update campaign target status
    if (isProspectBased) {
      await supabase
        .from('campaign_prospects')
        .update({ status: 'ready' })
        .eq('id', campaign_prospect_id);
    } else {
      await supabase
        .from('campaign_contacts')
        .update({ status: 'ready' })
        .eq('id', campaign_contact_id);
    }

    console.log('Generated', savedEmails.length, 'emails');

    return new Response(
      JSON.stringify({
        success: true,
        emails: savedEmails,
        count: savedEmails.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Email generation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function generateEmailSequence(
  templates: any[],
  context: any
): Promise<Array<{ subject: string; body: string; notes: string }>> {

  // If no AI key, return templates with basic replacement
  if (!ANTHROPIC_API_KEY) {
    return templates.map(template => ({
      subject: replaceVariables(template.subject_template, context),
      body: replaceVariables(template.body_template, context),
      notes: 'Generated without AI personalization',
    }));
  }

  // Get company size context
  const companySizeContext = getCompanySizeContext(context.employee_count);

  // Calculate turnover figures
  const turnoverMid = Math.round((context.turnover_estimate_low + context.turnover_estimate_high) / 2);
  const turnoverFormatted = formatCurrency(turnoverMid);

  // Create a DIFFERENT example figure for the "similar company" story (70-85% of their actual)
  const exampleTurnover = Math.round(turnoverMid * (0.7 + Math.random() * 0.15));
  const exampleFormatted = formatCurrency(exampleTurnover);

  // Build template descriptions for the prompt
  const templateDescriptions = templates.map((t, i) => `
EMAIL ${i + 1} (Position ${t.position}):
Subject Template: ${t.subject_template}
Body Template:
${t.body_template}
`).join('\n---\n');

  // System message with strict rules
  const systemMessage = `You are Clive Hays, founder of Clover ERA. You write cold outreach emails directly TO prospects.

CRITICAL RECIPIENT RULE:
You are writing TO ${context.first_name}. Use "you" and "your" when referring to them.
- CORRECT: "At ${context.company_name}, your team of ${context.employee_count.toLocaleString()} employees..."
- WRONG: "${context.first_name} just joined..." (this is third person - DO NOT DO THIS)
- WRONG: "He/She probably knows..." (this is third person - DO NOT DO THIS)

CRITICAL NUMBER RULES:
- ${context.company_name} employee count: ${context.employee_count.toLocaleString()}
- ${context.company_name} turnover cost: $${turnoverFormatted}
- Example company turnover (Email 2 only): $${exampleFormatted}
NEVER invent other numbers.

ADVISORY PRINCIPLES (apply these):
- Pattern interrupt, not pitch (Josh Braun)
- Make the reader feel understood before asking anything (Chris Voss)
- Specificity = credibility (Alex Hormozi)
- One clear idea per email, no feature dumps (Russell Brunson)`;

  const prompt = `Write 3 cold emails for this prospect:

PROSPECT: ${context.first_name} ${context.last_name}, ${context.title} at ${context.company_name}
EMPLOYEE COUNT: ${context.employee_count.toLocaleString()} (use this exact number)
TURNOVER COST: $${turnoverFormatted} (use in Email 1 and 3)
EXAMPLE COMPANY COST: $${exampleFormatted} (use ONLY in Email 2)
INDUSTRY: ${context.industry}

RESEARCH: ${context.research_summary || 'No specific research available.'}
ANGLE: ${context.personalization_angle || 'Focus on the gap between what they track and actual turnover cost.'}

${companySizeContext}

${CLOVER_ERA_CONTEXT}

${EMAIL_RULES}

TEMPLATES:
${templateDescriptions}

EMAIL STRUCTURE:
- Email 1: Use ${context.company_name}'s $${turnoverFormatted} and ${context.employee_count.toLocaleString()} employees
- Email 2: Story about a DIFFERENT company using $${exampleFormatted} - do NOT mention ${context.company_name}'s numbers
- Email 3: Return to ${context.company_name}'s $${turnoverFormatted}

BANNED: "curious", "I'd love to", "either way", "happy to help", "Not pitching"
Sign off: Just "Clive"

JSON response:
[{"subject": "...", "body": "...", "notes": "..."},{"subject": "...", "body": "...", "notes": "..."},{"subject": "...", "body": "...", "notes": "..."}]`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemMessage,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.content[0]?.text || '';

    // Parse JSON array from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const results = JSON.parse(jsonMatch[0]);
      if (Array.isArray(results) && results.length === templates.length) {
        return results.map((r: any) => ({
          subject: r.subject || '',
          body: r.body || '',
          notes: r.notes || 'AI personalized',
        }));
      }
    }
  } catch (error) {
    console.error('AI sequence generation failed:', error);
  }

  // Fallback to template replacement
  return templates.map(template => ({
    subject: replaceVariables(template.subject_template, context),
    body: replaceVariables(template.body_template, context),
    notes: 'Template-based (AI unavailable)',
  }));
}

function replaceVariables(text: string, context: any): string {
  const replacements: Record<string, string> = {
    '{{first_name}}': context.first_name,
    '{{last_name}}': context.last_name,
    '{{full_name}}': context.full_name,
    '{{title}}': context.title,
    '{{company_name}}': context.company_name,
    '{{employee_count}}': String(context.employee_count),
    '{{industry}}': context.industry,
    '{{personalization_hook}}': context.personalization_angle || '',
    '{{turnover_rate}}': '15',
    '{{turnover_cost}}': formatCurrency(context.turnover_estimate_low),
    '{{similar_role}}': getSimilarRole(context.title),
    '{{similar_company_type}}': `${context.industry} company`,
    '{{example_rate}}': '12',
    '{{example_cost}}': formatCurrency(Math.round(context.turnover_estimate_low * 0.8)),
    '{{example_reaction}}': "They weren't tracking that.",
    '{{context_specific}}': context.growth_signals?.length
      ? ` especially with ${context.growth_signals[0]}`
      : '',
  };

  let result = text;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  }

  return result;
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${Math.round(amount / 1000)}K`;
  }
  return String(amount);
}

function getSimilarRole(title: string): string {
  const lowered = title.toLowerCase();
  if (lowered.includes('ceo') || lowered.includes('chief executive')) return 'CEO';
  if (lowered.includes('cfo') || lowered.includes('chief financial')) return 'CFO';
  if (lowered.includes('coo') || lowered.includes('chief operating')) return 'COO';
  if (lowered.includes('president')) return 'President';
  if (lowered.includes('vp') || lowered.includes('vice president')) return 'VP';
  return 'executive';
}
