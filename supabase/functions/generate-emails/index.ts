import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Generate emails for each template
    const generatedEmails = [];

    for (const template of templates) {
      const email = await generatePersonalizedEmail(template, context);
      generatedEmails.push({
        campaign_contact_id,
        contact_id: contact.id,
        sequence_id: seqId,
        position: template.position,
        subject: email.subject,
        body: email.body,
        personalization_notes: email.notes,
        status: 'draft',
      });
    }

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

async function generatePersonalizedEmail(
  template: any,
  context: any
): Promise<{ subject: string; body: string; notes: string }> {

  // First, do simple variable replacement
  let subject = replaceVariables(template.subject_template, context);
  let body = replaceVariables(template.body_template, context);

  // If no AI key, return template with basic replacement
  if (!ANTHROPIC_API_KEY) {
    return {
      subject,
      body,
      notes: 'Generated without AI personalization',
    };
  }

  // Use AI to improve personalization
  const prompt = `You are writing a cold email for Clive Hays at Clover ERA, a manager enablement platform that helps companies understand and reduce hidden turnover costs.

CONTEXT:
- Recipient: ${context.first_name} ${context.last_name}
- Title: ${context.title}
- Company: ${context.company_name}
- Employee Count: ${context.employee_count}
- Industry: ${context.industry}
- Research: ${context.research_summary || 'No research available'}
- Personalization Angle: ${context.personalization_angle || 'Focus on hidden turnover costs'}
- Estimated Annual Turnover Cost: $${context.turnover_estimate_low?.toLocaleString()} - $${context.turnover_estimate_high?.toLocaleString()}

CRITICAL - TURNOVER COST MATH:
The turnover estimates above are calculated using: employees × turnover_rate (12-18%) × avg_salary × replacement_multiplier (1.0-1.5x).
For a company with ${context.employee_count} employees, annual turnover costs should be in the HUNDREDS OF THOUSANDS or MILLIONS of dollars.
Example: 100 employees at 15% turnover with $70K avg salary = 15 people × $70K × 1.2 replacement cost = $1.26M annually.
If you mention a specific dollar amount, USE THE ESTIMATES PROVIDED. Do not invent smaller numbers.

TEMPLATE TO PERSONALIZE:
Subject: ${subject}

Body:
${body}

RULES:
1. Keep the email SHORT. 4-6 sentences max in the body.
2. The subject should be lowercase, no punctuation, conversational
3. Use the research/personalization angle to make the opening hook specific to them
4. Replace any remaining {{variables}} with appropriate content
5. Keep Clive's voice: direct, peer-to-peer, no fluff, no corporate speak
6. Do NOT add links, CTAs, or meeting requests unless already in template
7. The personalization hook should be 1 sentence that shows you know something about them
8. When citing turnover costs, USE the provided estimates - they are calculated correctly and should be large (hundreds of thousands to millions for companies with 50+ employees)

Respond in JSON format:
{
  "subject": "personalized subject line",
  "body": "personalized email body",
  "notes": "brief explanation of personalization choices"
}`;

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
        max_tokens: 1024,
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

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        subject: result.subject || subject,
        body: result.body || body,
        notes: result.notes || 'AI personalized',
      };
    }
  } catch (error) {
    console.error('AI personalization failed:', error);
  }

  // Fallback to template replacement
  return {
    subject,
    body,
    notes: 'Template-based (AI unavailable)',
  };
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
