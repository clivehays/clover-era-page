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
    const { campaign_contact_id, sequence_id } = await req.json();

    if (!campaign_contact_id) {
      throw new Error('campaign_contact_id is required');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get campaign contact with related data
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

    // Get sequence ID (from parameter, campaign, or default)
    let seqId = sequence_id || campaignContact.campaign?.sequence_id;

    if (!seqId) {
      // Get default sequence
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

    // Get prospect research
    const { data: research } = await supabase
      .from('prospect_research')
      .select('*')
      .eq('contact_id', contact.id)
      .single();

    if (!research) {
      throw new Error('Research not found. Run research-prospect first.');
    }

    console.log('Generating emails for:', contact.first_name, contact.last_name);

    // Prepare context for AI
    const context = {
      first_name: contact.first_name,
      last_name: contact.last_name,
      full_name: `${contact.first_name} ${contact.last_name}`,
      title: contact.title || 'Executive',
      email: contact.email,
      company_name: company?.name || 'your company',
      employee_count: company?.employee_count || 100,
      industry: company?.industry || 'your industry',
      research_summary: research.research_summary,
      growth_signals: research.growth_signals || [],
      personalization_angle: research.personalization_angle,
      turnover_estimate_low: research.turnover_estimate_low,
      turnover_estimate_high: research.turnover_estimate_high,
    };

    // Generate ALL emails in one call for narrative continuity
    const generatedEmailContents = await generateEmailSequence(templates, context);

    const generatedEmails = generatedEmailContents.map((email, index) => ({
      campaign_contact_id,
      contact_id: contact.id,
      sequence_id: seqId,
      position: templates[index].position,
      subject: email.subject,
      body: email.body,
      personalization_notes: email.notes,
      status: 'draft',
    }));

    // Delete any existing draft emails for this campaign contact
    await supabase
      .from('outreach_emails')
      .delete()
      .eq('campaign_contact_id', campaign_contact_id)
      .eq('status', 'draft');

    // Insert new emails
    const { data: savedEmails, error: saveError } = await supabase
      .from('outreach_emails')
      .insert(generatedEmails)
      .select();

    if (saveError) {
      throw new Error(`Failed to save emails: ${saveError.message}`);
    }

    // Update campaign contact status
    await supabase
      .from('campaign_contacts')
      .update({ status: 'ready' })
      .eq('id', campaign_contact_id);

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

  const prompt = `You are writing a 3-email cold outreach sequence as Clive Hays, founder of Clover ERA.

${CLOVER_ERA_CONTEXT}

${EMAIL_RULES}

${companySizeContext}

---

TARGET PROSPECT:
- Name: ${context.first_name} ${context.last_name}
- Title: ${context.title}
- Company: ${context.company_name}
- Employee Count: ${context.employee_count.toLocaleString()}
- Industry: ${context.industry}

KEY FIGURES TO USE:
- ${context.company_name}'s ACTUAL turnover cost: $${turnoverFormatted} (use this in Email 1 and Email 3)
- Example/comparison company turnover: $${exampleFormatted} (use this ONLY in Email 2's "similar company" story)

RESEARCH ON THIS PROSPECT:
${context.research_summary || 'No specific research available.'}

PERSONALIZATION ANGLE:
${context.personalization_angle || 'Focus on the gap between what they track and actual turnover cost.'}

---

TEMPLATES TO PERSONALIZE:
${templateDescriptions}

---

CRITICAL NARRATIVE CONTINUITY RULES:

1. EMAIL 1: Introduce ${context.company_name}'s own turnover cost ($${turnoverFormatted}). This is THEIR number.

2. EMAIL 2: Tell a story about a DIFFERENT company you spoke with. Use $${exampleFormatted} as that OTHER company's number. Do NOT use ${context.company_name}'s $${turnoverFormatted} here. The point is social proof from a similar situation.

3. EMAIL 3: Return to ${context.company_name}'s specific number ($${turnoverFormatted}). Final ask.

The reader must NEVER be confused about whose number is whose. Email 2's example is explicitly about ANOTHER company, not ${context.company_name}.

VOICE RULES:
- NEVER use: "curious", "I'd love to", "either way", "happy to help", "I'd be happy to"
- Short sentences. Direct peer tone.
- Sign off with just "Clive"

Respond with a JSON array of 3 emails:
[
  {"subject": "...", "body": "...", "notes": "..."},
  {"subject": "...", "body": "...", "notes": "..."},
  {"subject": "...", "body": "...", "notes": "..."}
]`;

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
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
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
