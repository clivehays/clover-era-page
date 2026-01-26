import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { contact_id, campaign_contact_id } = await req.json();

    if (!contact_id && !campaign_contact_id) {
      throw new Error('contact_id or campaign_contact_id is required');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get contact and company data
    let contactId = contact_id;
    let campaignContactId = campaign_contact_id;

    // If campaign_contact_id provided, get the contact_id from it
    if (campaign_contact_id && !contact_id) {
      const { data: cc, error: ccError } = await supabase
        .from('campaign_contacts')
        .select('contact_id')
        .eq('id', campaign_contact_id)
        .single();

      if (ccError || !cc) {
        throw new Error(`Campaign contact not found: ${ccError?.message}`);
      }
      contactId = cc.contact_id;
    }

    // Update campaign_contact status to researching
    if (campaignContactId) {
      await supabase
        .from('campaign_contacts')
        .update({ status: 'researching' })
        .eq('id', campaignContactId);
    }

    // Get contact with company
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      throw new Error(`Contact not found: ${contactError?.message}`);
    }

    console.log('Researching contact:', contact.first_name, contact.last_name);

    // Check if we have recent research (not expired)
    const { data: existingResearch } = await supabase
      .from('prospect_research')
      .select('*')
      .eq('contact_id', contactId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingResearch) {
      console.log('Using cached research');

      // Update campaign_contact status to ready if applicable
      if (campaignContactId) {
        await supabase
          .from('campaign_contacts')
          .update({ status: 'ready' })
          .eq('id', campaignContactId);
      }

      return new Response(
        JSON.stringify({ success: true, research: existingResearch, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Step 1: Apollo Enrichment
    let apolloPersonData = null;
    let apolloCompanyData = null;
    let emailVerified = false;

    if (APOLLO_API_KEY) {
      try {
        // Person enrichment
        if (contact.email) {
          const personResponse = await fetch('https://api.apollo.io/v1/people/match', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'X-Api-Key': APOLLO_API_KEY,
            },
            body: JSON.stringify({
              email: contact.email,
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
        if (contact.company?.website || contact.company?.name) {
          const companyResponse = await fetch('https://api.apollo.io/v1/organizations/enrich', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'X-Api-Key': APOLLO_API_KEY,
            },
          });

          // Alternative: use domain-based lookup
          const domain = contact.company?.website?.replace(/^https?:\/\//, '').replace(/\/$/, '');
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
        // Continue without Apollo data
      }
    }

    // Step 2: Prepare data for AI research
    const employeeCount = apolloCompanyData?.estimated_num_employees
      || apolloPersonData?.organization?.estimated_num_employees
      || contact.company?.employee_count
      || 100;

    const companyName = contact.company?.name || 'Unknown Company';
    const industry = apolloCompanyData?.industry
      || apolloPersonData?.organization?.industry
      || contact.company?.industry
      || 'Unknown';

    const title = apolloPersonData?.title || contact.title || 'Executive';
    const linkedinUrl = apolloPersonData?.linkedin_url || contact.linkedin_url;

    // Step 3: PRE-CALCULATE turnover estimates (don't let AI do math)
    const avgSalary = getIndustrySalary(industry);
    const turnoverEstimateLow = Math.round(employeeCount * 0.12 * avgSalary * 1.0);
    const turnoverEstimateHigh = Math.round(employeeCount * 0.18 * avgSalary * 1.5);
    const turnoverEstimateMid = Math.round((turnoverEstimateLow + turnoverEstimateHigh) / 2);

    let researchSummary = '';
    let growthSignals: string[] = [];
    let personalizationAngle = '';

    if (ANTHROPIC_API_KEY) {
      try {
        const researchPrompt = `You are researching a prospect for Clover ERA, a manager enablement platform that helps companies reduce hidden turnover costs.

PROSPECT INFORMATION:
- Name: ${contact.first_name} ${contact.last_name}
- Title: ${title}
- Company: ${companyName}
- Industry: ${industry}
- Employee Count: ${employeeCount}
- Website: ${contact.company?.website || 'N/A'}
- LinkedIn: ${linkedinUrl || 'N/A'}
${apolloPersonData ? `- Apollo Data: ${JSON.stringify(apolloPersonData, null, 2)}` : ''}
${apolloCompanyData ? `- Company Data: ${JSON.stringify(apolloCompanyData, null, 2)}` : ''}

PRE-CALCULATED TURNOVER COST (use these exact numbers):
- Low estimate: $${turnoverEstimateLow.toLocaleString()}
- High estimate: $${turnoverEstimateHigh.toLocaleString()}
- Mid-point: $${turnoverEstimateMid.toLocaleString()}

These are the CORRECT annual turnover costs for a ${employeeCount}-employee company. DO NOT recalculate or change these numbers.

TASKS:
1. Write a 2-3 sentence research summary about this person and company, focusing on anything relevant to employee retention, growth, management challenges.

2. Identify growth signals from the available data (e.g., hiring, funding, expansion, recent press). Return as JSON array of strings.

3. Write a compelling personalization angle for cold email (1-2 sentences). Reference the turnover cost ($${formatMillions(turnoverEstimateMid)}) and connect it to something specific about them/their company.

Respond in JSON format:
{
  "research_summary": "string",
  "growth_signals": ["string"],
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
            messages: [
              {
                role: 'user',
                content: researchPrompt,
              },
            ],
          }),
        });

        if (claudeResponse.ok) {
          const claudeData = await claudeResponse.json();
          const responseText = claudeData.content[0]?.text || '';

          // Parse JSON from response
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
        // Fallback personalization (turnover numbers already calculated above)
        personalizationAngle = `At ${employeeCount} employees, even 12% turnover means a $${formatMillions(turnoverEstimateLow)}+ hole that won't show up on any dashboard.`;
      }
    } else {
      // Fallback without AI (turnover numbers already calculated above)
      personalizationAngle = `At ${employeeCount} employees in ${industry}, turnover costs are likely 4x what you're tracking.`;
    }

    // Step 4: Save research to database
    const { data: research, error: researchError } = await supabase
      .from('prospect_research')
      .upsert({
        contact_id: contactId,
        company_id: contact.company_id,
        apollo_person_data: apolloPersonData,
        apollo_company_data: apolloCompanyData,
        email_verified: emailVerified,
        research_summary: researchSummary,
        growth_signals: growthSignals,
        turnover_estimate_low: turnoverEstimateLow,
        turnover_estimate_high: turnoverEstimateHigh,
        personalization_angle: personalizationAngle,
        researched_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      }, {
        onConflict: 'contact_id',
      })
      .select()
      .single();

    if (researchError) {
      throw new Error(`Failed to save research: ${researchError.message}`);
    }

    // Update campaign_contact status to ready
    if (campaignContactId) {
      await supabase
        .from('campaign_contacts')
        .update({ status: 'ready' })
        .eq('id', campaignContactId);
    }

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

// Helper function to get average salary by industry
function getIndustrySalary(industry: string): number {
  const lowered = (industry || '').toLowerCase();

  // Tech/Software
  if (lowered.includes('tech') || lowered.includes('software') || lowered.includes('computer') ||
      lowered.includes('information') || lowered.includes('saas')) {
    return 95000;
  }

  // Finance/Banking
  if (lowered.includes('financ') || lowered.includes('bank') || lowered.includes('insurance') ||
      lowered.includes('invest')) {
    return 95000;
  }

  // Healthcare
  if (lowered.includes('health') || lowered.includes('medical') || lowered.includes('pharma') ||
      lowered.includes('biotech')) {
    return 75000;
  }

  // Manufacturing/Industrial
  if (lowered.includes('manufactur') || lowered.includes('industrial') || lowered.includes('automotive') ||
      lowered.includes('aerospace')) {
    return 65000;
  }

  // Retail/Hospitality (lower wages but high turnover)
  if (lowered.includes('retail') || lowered.includes('hospitality') || lowered.includes('restaurant') ||
      lowered.includes('food')) {
    return 45000;
  }

  // Default for unknown industries
  return 70000;
}

// Helper function to format large numbers
function formatMillions(amount: number): string {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + 'M';
  }
  if (amount >= 1000) {
    return Math.round(amount / 1000) + 'K';
  }
  return String(amount);
}
