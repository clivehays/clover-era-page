import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =============================================
// INLINED FROM _shared/brand-context.ts
// (Self-contained - no shared imports needed)
// =============================================

const CLOVER_ERA_CONTEXT = `
ABOUT CLOVER ERA:
Clover ERA is a manager enablement platform that helps companies prevent employee turnover by making hidden turnover costs visible. We are NOT HR software. We target CEOs, CFOs, and COOs at companies with 100-1000+ employees.

CORE MESSAGE:
"Turnover costs 4x what you're tracking"
- Companies track turnover RATE (a percentage)
- The real problem is turnover COST (dollars)
- Most companies underestimate by 4x or more
- Hidden costs include: recruiting, onboarding, ramp time, lost deals, institutional knowledge loss, team disruption

FOUNDER - CLIVE HAYS:
- Co-Founder of Clover ERA
- Co-authored "The Trillion Dollar Problem"
- 20+ years Fortune 500 transformation experience
- Based in Scotland
- Position: "The Turnover Prevention Guy"

PRICING:
- Enterprise: $96K/year
- Department: $48K/year
- Pilot: $24K/90 days

VOICE CHARACTERISTICS:
- Direct peer tone, NOT consultant speak
- Short sentences, conversational
- Specific numbers, not vague claims
- Contrarian but evidence-based
- Make the SYSTEM the villain, never individuals

WRITING RULES:
1. First name only in greeting (e.g., "Dan -")
2. Short paragraphs (1-3 sentences max)
3. No em dashes
4. No starting sentences with "And" or "Because"
5. Sign off with just "Clive"
6. No links in cold emails
7. No aggressive CTAs

BANNED WORDS AND PHRASES - NEVER USE:
- "curious" / "I'm curious"
- "I'd love to" / "I'd be happy to"
- "happy to help"
- "either way"
- "that said"
- "seamless" / "robust" / "game-changing"
- "white-glove"
- "Book a demo" / "Start free trial"
- "employee engagement" (use: turnover prevention)
- "HR software" (use: manager enablement)
- "Let's chat" / "Let's connect"
- "leverage" / "synergy" / "best-in-class"
- "Not pitching" / "Not a pitch"

USE INSTEAD:
- "Worth a look, or should I close the loop?" (closing)
- "The math might be interesting." (soft CTA)
- "If this isn't on your radar, I'll drop it." (easy out)
- "Does that number land, or feel off?" (soft question)

QUOTABLE LINES (use sparingly):
- "You can't be alarmed by a number you've never seen."
- "The system doesn't flow information upward. It flows excuses."
- "One resignation is an exit. Three in six weeks is a verdict."

EMAIL TONE:
- Pattern interrupt, not sales pitch
- Peer-to-peer, not vendor-to-prospect
- Observation, not opinion
- Specific to their company, not generic
`.trim();

const EMAIL_RULES = `
EMAIL STRUCTURE RULES:
1. Opening: One specific observation about THEIR company (not generic)
2. Middle: The turnover cost reality (use exact numbers provided)
3. Close: Easy out, no pressure

LENGTH: 4-6 sentences total. Shorter is better.

SUBJECT LINE:
- Lowercase, no punctuation
- Company name + simple topic
- Example: "acme corp - turnover math"

DO NOT:
- Add links
- Add meeting requests unless in template
- Use exclamation points
- Make promises
- Sound salesy
- Recalculate or change the turnover numbers provided
`.trim();

const SELF_SERVE_CONTEXT = `
SELF-SERVE FUNNEL CONTEXT:
Target: Team managers who commented on Clive's LinkedIn posts.
Goal: Get them to take the free assessment, then start a 14-day trial.
Tone: Peer manager, not vendor. Reference their specific comment.
Product: Clover ERA self-serve at $8/manager/month.
Assessment URL: https://cloverera.com/assessment
Trial URL: https://cloverera.com/trial
Book: "Already Gone: 78 Ways to Miss Someone Leaving" by Clive & Neil Hays.

WRITING RULES FOR SELF-SERVE:
- Short, conversational, peer-to-peer
- No corporate speak, no em dashes
- Reference their specific LinkedIn comment
- The trap question is the conversion moment
- Total email body: 100-120 words max
- No "I'd love to," "curious," "happy to help," "reaching out," "just wanted to"
`.trim();

const CALENDAR_LINK = 'https://calendly.com/clive-hays-cloverera/20-mins-with-clive-clover-era-clone';

function getCompanySizeContext(employeeCount: number): string {
  if (employeeCount >= 5000) {
    return `COMPANY SIZE CONTEXT: Enterprise (${employeeCount.toLocaleString()} employees)
- At this scale, even 1% turnover variance = massive dollar impact
- Focus on: visibility gap, what finance isn't seeing
- Turnover costs are in the tens of millions annually
- Reference: "At your scale, even small improvements in retention have 8-figure impact"`;
  }

  if (employeeCount >= 1000) {
    return `COMPANY SIZE CONTEXT: Large company (${employeeCount.toLocaleString()} employees)
- Turnover costs likely $5M-15M+ annually
- Focus on: the gap between what they track and actual cost
- Reference: "Companies your size typically underestimate turnover cost by 3-4x"`;
  }

  if (employeeCount >= 500) {
    return `COMPANY SIZE CONTEXT: Mid-market (${employeeCount.toLocaleString()} employees)
- Turnover costs likely $2M-5M annually
- Focus on: growth scaling challenges, keeping key people
- Reference: "At ${employeeCount} employees, turnover cost is probably your largest untracked expense"`;
  }

  if (employeeCount >= 200) {
    return `COMPANY SIZE CONTEXT: Growth stage (${employeeCount.toLocaleString()} employees)
- Turnover costs likely $800K-2M annually
- Focus on: scaling pains, manager capability gap
- Reference: "Growth creates turnover risk. The question is whether you're measuring it."`;
  }

  if (employeeCount >= 100) {
    return `COMPANY SIZE CONTEXT: Scaling company (${employeeCount.toLocaleString()} employees)
- Turnover costs likely $400K-1M annually
- Focus on: every departure hurts more at this size
- Reference: "At ${employeeCount} employees, one wrong departure can cost you a quarter's growth."`;
  }

  return `COMPANY SIZE CONTEXT: Smaller company (${employeeCount} employees)
- Turnover costs significant relative to revenue
- Focus on: key person risk, institutional knowledge
- Reference: "In a company your size, losing the wrong person can set you back months."`;
}

function calculateTurnoverFields(employeeCount: number, avgSalary: number) {
  const annualTurnoverCost = employeeCount * 0.12 * avgSalary * 4;
  const dailyCost = Math.round(annualTurnoverCost / 365);
  const costPerDeparture = avgSalary * 4;
  const calculatedDepartures = Math.round(employeeCount * 0.12);
  const sixty7DayNumber = Math.round(employeeCount * 0.12 / 5.5);
  const sixty7DayTotal = sixty7DayNumber * costPerDeparture;

  return {
    annual_turnover_cost: annualTurnoverCost,
    daily_cost: dailyCost,
    cost_per_departure: costPerDeparture,
    calculated_departures: calculatedDepartures,
    sixty7_day_number: sixty7DayNumber,
    sixty7_day_total: sixty7DayTotal,
  };
}

function formatDollar(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return amount.toLocaleString('en-US');
  }
  return String(amount);
}

function getCurrencySymbol(country: string): string {
  const c = (country || '').toLowerCase().trim();
  const gbpCountries = ['united kingdom', 'uk', 'england', 'scotland', 'wales', 'northern ireland', 'ireland'];
  const eurCountries = ['germany', 'france', 'spain', 'italy', 'netherlands', 'belgium', 'austria', 'portugal', 'finland', 'greece'];
  if (gbpCountries.some(gc => c.includes(gc))) return '\u00A3'; // £
  if (eurCountries.some(ec => c.includes(ec))) return '\u20AC'; // €
  return '$';
}

// =============================================
// END INLINED SHARED CODE
// =============================================

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
    let estimatedAvgSalary: number;
    let postNumber: string;
    let postTopic: string;
    let commentText: string;
    let country: string;

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
      estimatedAvgSalary = prospect.estimated_avg_salary || 85000;
      postNumber = prospect.post_number || '';
      postTopic = prospect.post_topic || '';
      commentText = prospect.comment_text || '';
      country = prospect.country || '';

      // Get research by prospect_id (optional for self-serve sequence)
      const { data: prospectResearch } = await supabase
        .from('prospect_research')
        .select('*')
        .eq('prospect_id', targetId)
        .single();

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
      estimatedAvgSalary = 85000;
      postNumber = '';
      postTopic = '';
      commentText = '';
      country = '';

      // Get research by contact_id
      const { data: contactResearch } = await supabase
        .from('prospect_research')
        .select('*')
        .eq('contact_id', targetId)
        .single();

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

    // Get sequence with type
    const { data: sequence, error: seqError } = await supabase
      .from('outreach_sequences')
      .select('*')
      .eq('id', seqId)
      .single();

    if (seqError || !sequence) {
      throw new Error(`Sequence not found: ${seqError?.message}`);
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

    // Prepare context
    const context = {
      first_name: targetFirstName,
      last_name: targetLastName,
      full_name: `${targetFirstName} ${targetLastName}`,
      title: targetTitle,
      email: targetEmail,
      company_name: companyName,
      employee_count: companyEmployeeCount,
      industry: companyIndustry,
      estimated_avg_salary: estimatedAvgSalary,
      research_summary: research?.research_summary || '',
      growth_signals: research?.growth_signals || [],
      personalization_angle: research?.personalization_angle || '',
      turnover_estimate_low: research?.turnover_estimate_low || 0,
      turnover_estimate_high: research?.turnover_estimate_high || 0,
      post_number: postNumber,
      post_topic: postTopic,
      comment_text: commentText,
      country: country,
    };

    // Route to appropriate generator based on sequence type
    let generatedEmailContents: Array<{ subject: string; body: string; notes: string }>;

    if (sequence.sequence_type === 'self_serve') {
      generatedEmailContents = await generateSelfServeSequence(templates, context);
    } else if (sequence.sequence_type === 'operational' && sequence.name.includes('Operational Buyer')) {
      generatedEmailContents = await generateOperationalSequence(templates, context);
    } else {
      // Legacy or other sequences - use existing generation logic
      if (!research) {
        throw new Error('Research not found. Run research-prospect first.');
      }
      generatedEmailContents = await generateLegacySequence(templates, context);
    }

    // Build email records with appropriate IDs
    // Email 1 = draft (for approval), subsequent emails = pending_followup
    const generatedEmails = generatedEmailContents.map((email, index) => {
      const position = templates[index].position;
      const emailRecord: Record<string, any> = {
        sequence_id: seqId,
        position: position,
        subject: email.subject,
        body: email.body,
        personalization_notes: email.notes,
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

    console.log('Generated', savedEmails.length, 'emails for sequence:', sequence.name);

    return new Response(
      JSON.stringify({
        success: true,
        emails: savedEmails,
        count: savedEmails.length,
        sequence_type: sequence.sequence_type,
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

// =============================================
// SEQUENCE 1: OPERATIONAL BUYER
// =============================================
// Calculates turnover fields, calls Claude for custom_company_reference only,
// then merges all templates with calculated + generated values.

async function generateOperationalSequence(
  templates: any[],
  context: any
): Promise<Array<{ subject: string; body: string; notes: string }>> {

  // Calculate turnover fields
  const turnover = calculateTurnoverFields(context.employee_count, context.estimated_avg_salary);
  const currencySymbol = getCurrencySymbol(context.country);
  const pdfFilename = `${context.company_name.replace(/[^a-zA-Z0-9]/g, '-')}-Turnover-Intelligence-Report.pdf`;

  // Build replacement map
  const replacements: Record<string, string> = {
    '{{first_name}}': context.first_name,
    '{{last_name}}': context.last_name,
    '{{full_name}}': context.full_name,
    '{{title}}': context.title,
    '{{company_name}}': context.company_name,
    '{{employee_count}}': context.employee_count.toLocaleString(),
    '{{industry}}': context.industry,
    '{{currency_symbol}}': currencySymbol,
    '{{estimated_avg_salary_formatted}}': formatDollar(context.estimated_avg_salary),
    '{{annual_turnover_cost_formatted}}': formatDollar(turnover.annual_turnover_cost),
    '{{daily_cost_formatted}}': formatDollar(turnover.daily_cost),
    '{{cost_per_departure_formatted}}': formatDollar(turnover.cost_per_departure),
    '{{calculated_departures}}': String(turnover.calculated_departures),
    '{{67_day_number}}': String(turnover.sixty7_day_number),
    '{{67_day_total_formatted}}': formatDollar(turnover.sixty7_day_total),
    '{{calendar_link}}': CALENDAR_LINK,
    '{{custom_company_reference}}': '', // Will be filled by Claude
  };

  // Generate custom_company_reference via Claude
  if (ANTHROPIC_API_KEY) {
    const customRef = await generateCustomCompanyReference(context);
    replacements['{{custom_company_reference}}'] = customRef;
  }

  // Merge all templates
  return templates.map((template, idx) => {
    const subject = replaceAllVariables(template.subject_template, replacements);
    const body = replaceAllVariables(template.body_template, replacements);

    // For Email 1: store attachment info in personalization_notes for send function
    const notesObj: Record<string, any> = {
      turnover: `${currencySymbol}${formatDollar(turnover.annual_turnover_cost)}/yr`,
      daily_cost: `${currencySymbol}${formatDollar(turnover.daily_cost)}/day`,
      sixty7_day: `${turnover.sixty7_day_number} people`,
    };
    if (idx === 0) {
      notesObj.attachment_name = pdfFilename;
      // PDF will be attached manually via the UI before sending
    }

    return {
      subject,
      body,
      notes: JSON.stringify(notesObj),
    };
  });
}

async function generateCustomCompanyReference(context: any): Promise<string> {
  const prompt = `Generate a 1-2 sentence custom_company_reference for ${context.company_name} in ${context.industry || 'their industry'}.

CONTEXT:
- Title: ${context.title}
- Employee count: ${context.employee_count}
- Research: ${context.research_summary || 'No specific research available.'}
- Angle: ${context.personalization_angle || 'Focus on turnover cost visibility gap.'}

Use public information (PE-backed, funding, expansion, industry challenge) to explain why turnover cost matters for them right now. 25-40 words maximum.

RULES:
- Must be specific to THIS company, not generic
- No em dashes
- No fluff
- Examples:
  "As a Blackstone portfolio company, you're reporting operational efficiency metrics quarterly. This is a line item that's invisible right now."
  "You just raised $40M Series B. If 15% of your engineering team walks in the next 12 months, that dilutes faster than you're planning for."

OUTPUT: Just the 1-2 sentence text, nothing else.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error('Claude API error for custom_company_reference:', response.status);
      return '';
    }

    const data = await response.json();
    const text = data.content[0]?.text?.trim() || '';
    return text;
  } catch (error) {
    console.error('Failed to generate custom_company_reference:', error);
    return '';
  }
}

// =============================================
// SEQUENCE 2: SELF-SERVE (LinkedIn Commenter)
// =============================================
// Calls Claude to generate 5 components for Email 1,
// then builds Email 2 from template with trap_question from Email 1.

async function generateSelfServeSequence(
  templates: any[],
  context: any
): Promise<Array<{ subject: string; body: string; notes: string }>> {

  // Validate we have LinkedIn data
  if (!context.comment_text) {
    throw new Error('LinkedIn comment_text is required for self-serve sequence. Add comment data to prospect.');
  }

  // Generate 5 components via Claude
  const components = await generateLinkedInComponents(context);

  const results: Array<{ subject: string; body: string; notes: string }> = [];

  // Email 1: Paranoia Trigger - merge Claude components into template
  const email1Template = templates.find((t: any) => t.position === 1);
  if (email1Template) {
    const email1Replacements: Record<string, string> = {
      '{{first_name}}': context.first_name,
      '{{subject_line}}': components.subject_line,
      '{{opening_hook}}': components.opening_hook,
      '{{mirror_statement}}': components.mirror_statement,
      '{{trap_question}}': components.trap_question,
      '{{closing_question}}': components.closing_question,
    };

    results.push({
      subject: replaceAllVariables(email1Template.subject_template, email1Replacements),
      body: replaceAllVariables(email1Template.body_template, email1Replacements),
      notes: JSON.stringify({
        trap_question: components.trap_question,
        post_number: context.post_number,
        post_topic: context.post_topic,
      }),
    });
  }

  // Email 2: Book Preview - use trap_question from Email 1
  const email2Template = templates.find((t: any) => t.position === 2);
  if (email2Template) {
    const email2Replacements: Record<string, string> = {
      '{{first_name}}': context.first_name,
      '{{trap_question}}': components.trap_question,
    };

    results.push({
      subject: replaceAllVariables(email2Template.subject_template, email2Replacements),
      body: replaceAllVariables(email2Template.body_template, email2Replacements),
      notes: JSON.stringify({
        trap_question: components.trap_question,
        attachment: 'already-gone-preview.pdf',
      }),
    });
  }

  return results;
}

async function generateLinkedInComponents(context: any): Promise<{
  subject_line: string;
  opening_hook: string;
  mirror_statement: string;
  trap_question: string;
  closing_question: string;
}> {

  const defaultComponents = {
    subject_line: `your comment on the ${context.post_topic || 'post'}`,
    opening_hook: `Your comment on my post about ${context.post_topic || 'management'} stood out.`,
    mirror_statement: "That's the exact pattern most managers miss. The quiet ones aren't fine. They've just stopped asking for things.",
    trap_question: "Who on your team stopped asking for things in the last 90 days?",
    closing_question: "Did that person end up staying?",
  };

  if (!ANTHROPIC_API_KEY) {
    return defaultComponents;
  }

  const prompt = `You are writing an email on behalf of Clive Hays, Co-Founder of Clover ERA, to a manager or team lead who commented on one of his LinkedIn posts.

CONTACT DATA:
- First name: ${context.first_name}
- Title: ${context.title}
- Company: ${context.company_name}

POST DATA:
- Post number: ${context.post_number || 'recent post'}
- Post topic: ${context.post_topic || 'management'}
- Their comment: ${context.comment_text}

YOUR TASK:
Generate 5 components:

1. SUBJECT LINE (6-10 words):
   - Reference their comment or post topic naturally
   - No clickbait, no caps
   - Make it feel like continuation of conversation
   - Examples: "the engineer who had to pause" / "your comment on the 1:1 post" / "the thing you do that most managers don't"

2. OPENING HOOK (15-25 words):
   - Start with "Your comment on my post about [topic]..."
   - Reference ONE specific thing they said (use their exact words if possible)
   - Make it feel personal, like Clive noticed something THEY specifically said
   - Must give them context to remember what they commented

3. MIRROR STATEMENT (1-2 sentences, 20-35 words):
   - Prove you understood what they're actually dealing with
   - Use language that reflects their experience
   - Validate their insight or approach
   - Connect to pattern Clive sees

4. TRAP QUESTION (1 sentence, 10-18 words):
   - Force them to picture ONE specific person on their team RIGHT NOW
   - Must make them mentally scan their roster
   - Examples based on comment context:
     * If about someone getting quiet: "Who on your team has gotten 'easier' in the last 60 days?"
     * If about career conversations: "Who on your team would have to pause if you asked them that question today?"
     * If about someone who stopped pushing back: "Who on your team used to challenge decisions... and now just says 'sounds good'?"
     * If about recognition: "Who on your team stopped asking for feedback in the last 90 days?"
   - The question must feel dangerous. Like it might surface something they've been avoiding

5. CLOSING QUESTION (1 sentence, 8-15 words):
   - Easy question related to their comment they can answer in one sentence
   - Should invite them to finish their story or share outcome
   - Examples: "Did that engineer end up staying once the conversations started?" / "How long did it take before they resigned?"

RULES:
- Total email body after components inserted: 100-120 words max
- No "I'd love to," "curious," "happy to help," "reaching out," "just wanted to"
- No em dashes
- Short sentences. Conversational. Peer to peer.
- The trap question is the conversion moment. Make it impossible to ignore.

${SELF_SERVE_CONTEXT}

OUTPUT FORMAT (JSON only, no other text):
{"subject_line": "...", "opening_hook": "...", "mirror_statement": "...", "trap_question": "...", "closing_question": "..."}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error('Claude API error for LinkedIn components:', response.status);
      return defaultComponents;
    }

    const data = await response.json();
    const responseText = data.content[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        subject_line: parsed.subject_line || defaultComponents.subject_line,
        opening_hook: parsed.opening_hook || defaultComponents.opening_hook,
        mirror_statement: parsed.mirror_statement || defaultComponents.mirror_statement,
        trap_question: parsed.trap_question || defaultComponents.trap_question,
        closing_question: parsed.closing_question || defaultComponents.closing_question,
      };
    }
  } catch (error) {
    console.error('Failed to generate LinkedIn components:', error);
  }

  return defaultComponents;
}

// =============================================
// LEGACY SEQUENCE GENERATOR
// =============================================
// Original generation logic - generates all emails in one Claude call.
// Used for the "CEO Cold Outreach - Turnover Cost" sequence and any
// other sequences that don't have a specific type handler.

async function generateLegacySequence(
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
        'x-api-key': ANTHROPIC_API_KEY!,
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

// =============================================
// UTILITY FUNCTIONS
// =============================================

function replaceAllVariables(text: string, replacements: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  return result;
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

  return replaceAllVariables(text, replacements);
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
