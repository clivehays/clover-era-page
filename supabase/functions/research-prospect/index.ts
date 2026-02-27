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

// =============================================
// END INLINED SHARED CODE
// =============================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const APOLLO_API_KEY = Deno.env.get('APOLLO_API_KEY');
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
    // Support both contact-based and prospect-based research
    const {
      contact_id,
      campaign_contact_id,
      prospect_id,
      campaign_prospect_id
    } = await req.json();

    if (!contact_id && !campaign_contact_id && !prospect_id && !campaign_prospect_id) {
      throw new Error('One of contact_id, campaign_contact_id, prospect_id, or campaign_prospect_id is required');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Determine if this is prospect-based or contact-based
    const isProspectBased = !!(prospect_id || campaign_prospect_id);

    // Variables to hold the target data
    let targetId: string;
    let targetEmail: string;
    let targetFirstName: string;
    let targetLastName: string;
    let targetTitle: string;
    let targetLinkedinUrl: string | null;
    let companyName: string;
    let companyWebsite: string | null;
    let companyIndustry: string;
    let companyEmployeeCount: number;
    let companyId: string | null = null;

    if (isProspectBased) {
      // PROSPECT-BASED RESEARCH
      let prospectIdToUse = prospect_id;

      // If campaign_prospect_id provided, get the prospect_id from it
      if (campaign_prospect_id && !prospect_id) {
        const { data: cp, error: cpError } = await supabase
          .from('campaign_prospects')
          .select('prospect_id')
          .eq('id', campaign_prospect_id)
          .single();

        if (cpError || !cp) {
          throw new Error(`Campaign prospect not found: ${cpError?.message}`);
        }
        prospectIdToUse = cp.prospect_id;
      }

      // Update campaign_prospect status to researching
      if (campaign_prospect_id) {
        await supabase
          .from('campaign_prospects')
          .update({ status: 'researching' })
          .eq('id', campaign_prospect_id);
      }

      // Get prospect data (denormalized - company info is inline)
      const { data: prospect, error: prospectError } = await supabase
        .from('outreach_prospects')
        .select('*')
        .eq('id', prospectIdToUse)
        .single();

      if (prospectError || !prospect) {
        throw new Error(`Prospect not found: ${prospectError?.message}`);
      }

      console.log('Researching prospect:', prospect.first_name, prospect.last_name);

      // Set variables from prospect data (denormalized)
      targetId = prospect.id;
      targetEmail = prospect.email;
      targetFirstName = prospect.first_name || '';
      targetLastName = prospect.last_name || '';
      targetTitle = prospect.title || 'Executive';
      targetLinkedinUrl = prospect.linkedin_url;
      companyName = prospect.company_name || 'Unknown Company';
      companyWebsite = prospect.company_website;
      companyIndustry = prospect.company_industry || 'Unknown';
      companyEmployeeCount = prospect.company_employee_count || 100;

      // Check for existing research by prospect_id
      const { data: existingResearch } = await supabase
        .from('prospect_research')
        .select('*')
        .eq('prospect_id', prospectIdToUse)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (existingResearch) {
        console.log('Using cached research for prospect');
        // NOTE: Don't set status to 'ready' here - generate-emails will do that after creating emails
        return new Response(
          JSON.stringify({ success: true, research: existingResearch, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

    } else {
      // CONTACT-BASED RESEARCH (legacy support)
      let contactIdToUse = contact_id;

      if (campaign_contact_id && !contact_id) {
        const { data: cc, error: ccError } = await supabase
          .from('campaign_contacts')
          .select('contact_id')
          .eq('id', campaign_contact_id)
          .single();

        if (ccError || !cc) {
          throw new Error(`Campaign contact not found: ${ccError?.message}`);
        }
        contactIdToUse = cc.contact_id;
      }

      if (campaign_contact_id) {
        await supabase
          .from('campaign_contacts')
          .update({ status: 'researching' })
          .eq('id', campaign_contact_id);
      }

      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select(`*, company:companies(*)`)
        .eq('id', contactIdToUse)
        .single();

      if (contactError || !contact) {
        throw new Error(`Contact not found: ${contactError?.message}`);
      }

      console.log('Researching contact:', contact.first_name, contact.last_name);

      targetId = contact.id;
      targetEmail = contact.email;
      targetFirstName = contact.first_name || '';
      targetLastName = contact.last_name || '';
      targetTitle = contact.title || 'Executive';
      targetLinkedinUrl = contact.linkedin_url;
      companyName = contact.company?.name || 'Unknown Company';
      companyWebsite = contact.company?.website;
      companyIndustry = contact.company?.industry || 'Unknown';
      companyEmployeeCount = contact.company?.employee_count || 100;
      companyId = contact.company_id;

      // Check for existing research by contact_id
      const { data: existingResearch } = await supabase
        .from('prospect_research')
        .select('*')
        .eq('contact_id', contactIdToUse)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (existingResearch) {
        console.log('Using cached research for contact');
        // NOTE: Don't set status to 'ready' here - generate-emails will do that after creating emails
        return new Response(
          JSON.stringify({ success: true, research: existingResearch, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    // Step 1: Apollo Enrichment
    let apolloPersonData: any = null;
    let apolloCompanyData: any = null;
    let emailVerified = false;

    if (APOLLO_API_KEY) {
      try {
        // Person enrichment
        if (targetEmail) {
          const personResponse = await fetch('https://api.apollo.io/v1/people/match', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'X-Api-Key': APOLLO_API_KEY,
            },
            body: JSON.stringify({
              email: targetEmail,
              reveal_personal_emails: false,
            }),
          });

          if (personResponse.ok) {
            const personData = await personResponse.json();
            apolloPersonData = personData.person || null;
            emailVerified = personData.person?.email_status === 'verified';
            console.log('Apollo person enrichment success');
          }
        }

        // Company enrichment
        if (companyWebsite || companyName) {
          const domain = companyWebsite?.replace(/^https?:\/\//, '').replace(/\/$/, '');
          if (domain) {
            const orgResponse = await fetch(`https://api.apollo.io/v1/organizations/enrich?domain=${domain}`, {
              method: 'GET',
              headers: {
                'Cache-Control': 'no-cache',
                'X-Api-Key': APOLLO_API_KEY,
              },
            });

            if (orgResponse.ok) {
              const orgData = await orgResponse.json();
              apolloCompanyData = orgData.organization || null;
              console.log('Apollo company enrichment success');
            }
          }
        }
      } catch (apolloError) {
        console.error('Apollo enrichment error:', apolloError);
      }
    }

    // Step 2: Use enriched data or fallback to provided data
    const employeeCount = apolloCompanyData?.estimated_num_employees
      || apolloPersonData?.organization?.estimated_num_employees
      || companyEmployeeCount;

    const industry = apolloCompanyData?.industry
      || apolloPersonData?.organization?.industry
      || companyIndustry;

    const title = apolloPersonData?.title || targetTitle;
    const linkedinUrl = apolloPersonData?.linkedin_url || targetLinkedinUrl;

    // Step 2b: Update prospect with Apollo data (for prospects, update inline fields)
    if (isProspectBased && (apolloCompanyData || apolloPersonData?.organization)) {
      const prospectUpdates: Record<string, any> = {};

      if (apolloCompanyData?.estimated_num_employees) {
        prospectUpdates.company_employee_count = apolloCompanyData.estimated_num_employees;
      } else if (apolloPersonData?.organization?.estimated_num_employees) {
        prospectUpdates.company_employee_count = apolloPersonData.organization.estimated_num_employees;
      }

      if (apolloCompanyData?.industry) {
        prospectUpdates.company_industry = apolloCompanyData.industry;
      } else if (apolloPersonData?.organization?.industry) {
        prospectUpdates.company_industry = apolloPersonData.organization.industry;
      }

      if (Object.keys(prospectUpdates).length > 0) {
        await supabase
          .from('outreach_prospects')
          .update(prospectUpdates)
          .eq('id', targetId);
        console.log('Updated prospect with Apollo data:', prospectUpdates);
      }
    }

    // Step 2c: Update companies table with Apollo data (for contacts only)
    if (!isProspectBased && companyId && (apolloCompanyData || apolloPersonData?.organization)) {
      const companyUpdates: Record<string, any> = {};

      if (apolloCompanyData?.estimated_num_employees) {
        companyUpdates.employee_count = apolloCompanyData.estimated_num_employees;
      } else if (apolloPersonData?.organization?.estimated_num_employees) {
        companyUpdates.employee_count = apolloPersonData.organization.estimated_num_employees;
      }

      if (apolloCompanyData?.industry) {
        companyUpdates.industry = apolloCompanyData.industry;
      } else if (apolloPersonData?.organization?.industry) {
        companyUpdates.industry = apolloPersonData.organization.industry;
      }

      if (Object.keys(companyUpdates).length > 0) {
        await supabase
          .from('companies')
          .update(companyUpdates)
          .eq('id', companyId);
        console.log('Updated company with Apollo data:', companyUpdates);
      }
    }

    // Step 3: PRE-CALCULATE turnover estimates
    const avgSalary = getIndustrySalary(industry);
    const turnoverEstimateLow = Math.round(employeeCount * 0.12 * avgSalary * 1.0);
    const turnoverEstimateHigh = Math.round(employeeCount * 0.18 * avgSalary * 1.5);
    const turnoverEstimateMid = Math.round((turnoverEstimateLow + turnoverEstimateHigh) / 2);

    let researchSummary = '';
    let growthSignals: string[] = [];
    let personalizationAngle = '';

    const companySizeContext = getCompanySizeContext(employeeCount);

    if (ANTHROPIC_API_KEY) {
      try {
        const researchPrompt = `You are researching a prospect for Clover ERA.

${CLOVER_ERA_CONTEXT}

${companySizeContext}

---

PROSPECT TO RESEARCH:
- Name: ${targetFirstName} ${targetLastName}
- Title: ${title}
- Company: ${companyName}
- Industry: ${industry}
- Employee Count: ${employeeCount.toLocaleString()}
- Website: ${companyWebsite || 'N/A'}
- LinkedIn: ${linkedinUrl || 'N/A'}
${apolloPersonData ? `\nAPOLLO PERSON DATA:\n${JSON.stringify(apolloPersonData, null, 2)}` : ''}
${apolloCompanyData ? `\nAPOLLO COMPANY DATA:\n${JSON.stringify(apolloCompanyData, null, 2)}` : ''}

PRE-CALCULATED TURNOVER COST (these are correct - use them exactly):
- Low estimate: $${turnoverEstimateLow.toLocaleString()}
- High estimate: $${turnoverEstimateHigh.toLocaleString()}
- Mid-point: $${turnoverEstimateMid.toLocaleString()} (use this in personalization)

---

YOUR TASKS:

1. RESEARCH SUMMARY (2-3 sentences):
   Write a brief summary of what you know about this person/company. Focus on anything relevant to employee retention, growth challenges, or management.

2. GROWTH SIGNALS (array of strings):
   List any signals from the data: hiring activity, funding, expansion, new offices, acquisitions, leadership changes.

3. PERSONALIZATION ANGLE (1-2 sentences):
   Write an opening hook for a cold email that:
   - References something SPECIFIC about their company (not generic)
   - Connects to the turnover cost of $${formatMillions(turnoverEstimateMid)}
   - Does NOT use banned phrases: "curious", "I'd love to", "either way"
   - Sounds like an observation, not a pitch

Respond in JSON format:
{
  "research_summary": "string",
  "growth_signals": ["string", "string"],
  "personalization_angle": "string"
}`;

        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [{ role: 'user', content: researchPrompt }],
          }),
        });

        if (claudeResponse.ok) {
          const claudeData = await claudeResponse.json();
          const responseText = claudeData.content[0]?.text || '';
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const aiResearch = JSON.parse(jsonMatch[0]);
            researchSummary = aiResearch.research_summary || '';
            growthSignals = aiResearch.growth_signals || [];
            personalizationAngle = aiResearch.personalization_angle || '';
          }
          console.log('Claude research complete');
        }
      } catch (claudeError) {
        console.error('Claude research error:', claudeError);
        personalizationAngle = `At ${employeeCount} employees, even 12% turnover means a $${formatMillions(turnoverEstimateLow)}+ hole that won't show up on any dashboard.`;
      }
    } else {
      personalizationAngle = `At ${employeeCount} employees in ${industry}, turnover costs are likely 4x what you're tracking.`;
    }

    // Step 4: Save research to database
    const researchData: Record<string, any> = {
      apollo_person_data: apolloPersonData,
      apollo_company_data: apolloCompanyData,
      email_verified: emailVerified,
      research_summary: researchSummary,
      growth_signals: growthSignals,
      turnover_estimate_low: turnoverEstimateLow,
      turnover_estimate_high: turnoverEstimateHigh,
      personalization_angle: personalizationAngle,
      researched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    if (isProspectBased) {
      researchData.prospect_id = targetId;
    } else {
      researchData.contact_id = targetId;
      researchData.company_id = companyId;
    }

    const { data: research, error: researchError } = await supabase
      .from('prospect_research')
      .upsert(researchData, {
        onConflict: isProspectBased ? 'prospect_id' : 'contact_id',
      })
      .select()
      .single();

    if (researchError) {
      throw new Error(`Failed to save research: ${researchError.message}`);
    }

    // NOTE: Status stays at 'researching' until generate-emails sets it to 'ready'
    // This ensures 'ready' status only happens after emails are actually generated

    console.log('Research saved successfully');

    return new Response(
      JSON.stringify({
        success: true,
        research,
        cached: false,
        apollo_enriched: !!(apolloPersonData || apolloCompanyData),
        ai_researched: !!ANTHROPIC_API_KEY,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Research error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function getIndustrySalary(industry: string): number {
  const lowered = (industry || '').toLowerCase();

  if (lowered.includes('tech') || lowered.includes('software') || lowered.includes('computer') ||
      lowered.includes('information') || lowered.includes('saas')) {
    return 95000;
  }
  if (lowered.includes('financ') || lowered.includes('bank') || lowered.includes('insurance') ||
      lowered.includes('invest')) {
    return 95000;
  }
  if (lowered.includes('health') || lowered.includes('medical') || lowered.includes('pharma') ||
      lowered.includes('biotech')) {
    return 75000;
  }
  if (lowered.includes('manufactur') || lowered.includes('industrial') || lowered.includes('automotive') ||
      lowered.includes('aerospace')) {
    return 65000;
  }
  if (lowered.includes('retail') || lowered.includes('hospitality') || lowered.includes('restaurant') ||
      lowered.includes('food')) {
    return 45000;
  }
  return 70000;
}

function formatMillions(amount: number): string {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + 'M';
  }
  if (amount >= 1000) {
    return Math.round(amount / 1000) + 'K';
  }
  return String(amount);
}
