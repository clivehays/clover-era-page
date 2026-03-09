import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const APOLLO_API_KEY = Deno.env.get('APOLLO_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CONCURRENCY = 5;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { emails } = await req.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      throw new Error('emails array is required');
    }

    if (!APOLLO_API_KEY) {
      throw new Error('APOLLO_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Step 1: Check for cached Apollo data in prospect_research
    const cachedResults: Record<string, any> = {};
    const uncachedEmails: string[] = [];

    // Look up prospects by email to find their IDs
    const { data: prospects } = await supabase
      .from('outreach_prospects')
      .select('id, email')
      .in('email', emails);

    const prospectIdByEmail: Record<string, string> = {};
    (prospects || []).forEach(p => {
      if (p.email) prospectIdByEmail[p.email.toLowerCase()] = p.id;
    });

    // Check prospect_research for cached apollo_person_data
    const prospectIds = Object.values(prospectIdByEmail);
    let cachedResearch: any[] = [];
    if (prospectIds.length > 0) {
      const { data } = await supabase
        .from('prospect_research')
        .select('prospect_id, apollo_person_data')
        .in('prospect_id', prospectIds)
        .not('apollo_person_data', 'is', null)
        .gt('expires_at', new Date().toISOString());
      cachedResearch = data || [];
    }

    // Build reverse map: prospect_id -> email
    const emailByProspectId: Record<string, string> = {};
    Object.entries(prospectIdByEmail).forEach(([email, pid]) => {
      emailByProspectId[pid] = email;
    });

    // Extract address from cached Apollo data
    for (const research of cachedResearch) {
      const email = emailByProspectId[research.prospect_id];
      if (!email) continue;

      const address = extractAddress(research.apollo_person_data);
      if (address) {
        cachedResults[email.toLowerCase()] = address;
      }
    }

    // Determine which emails still need Apollo lookup
    for (const email of emails) {
      if (!cachedResults[email.toLowerCase()]) {
        uncachedEmails.push(email);
      }
    }

    console.log(`Cache hit: ${Object.keys(cachedResults).length}, need Apollo: ${uncachedEmails.length}`);

    // Step 2: Call Apollo for uncached emails (with concurrency limit)
    const apolloResults: Record<string, any> = {};
    let enrichedCount = Object.keys(cachedResults).length;
    let notFoundCount = 0;

    for (let i = 0; i < uncachedEmails.length; i += CONCURRENCY) {
      const batch = uncachedEmails.slice(i, i + CONCURRENCY);
      const promises = batch.map(email => enrichFromApollo(email));
      const results = await Promise.all(promises);

      for (let j = 0; j < batch.length; j++) {
        const email = batch[j].toLowerCase();
        if (results[j]) {
          apolloResults[email] = results[j];
          enrichedCount++;
        } else {
          notFoundCount++;
        }
      }
    }

    // Merge cached + fresh results
    const allResults = { ...cachedResults, ...apolloResults };

    return new Response(JSON.stringify({
      success: true,
      results: allResults,
      enriched: enrichedCount,
      not_found: notFoundCount,
      from_cache: Object.keys(cachedResults).length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('enrich-addresses error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractAddress(apolloPersonData: any): any | null {
  if (!apolloPersonData) return null;

  const org = apolloPersonData.organization;
  if (!org) {
    // Fall back to person-level location if no org
    if (apolloPersonData.city || apolloPersonData.state || apolloPersonData.country) {
      return {
        address_line_1: '',
        city: apolloPersonData.city || '',
        state: apolloPersonData.state || '',
        postal_code: '',
        country: apolloPersonData.country || '',
        phone: '',
      };
    }
    return null;
  }

  return {
    address_line_1: org.street_address || '',
    city: org.city || '',
    state: org.state || '',
    postal_code: org.postal_code || '',
    country: org.country || '',
    phone: org.phone || org.primary_phone?.number || '',
  };
}

async function enrichFromApollo(email: string): Promise<any | null> {
  try {
    const response = await fetch('https://api.apollo.io/v1/people/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': APOLLO_API_KEY!,
      },
      body: JSON.stringify({
        email: email,
        reveal_personal_emails: false,
      }),
    });

    if (!response.ok) {
      console.error(`Apollo error for ${email}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return extractAddress(data.person);
  } catch (error) {
    console.error(`Apollo request failed for ${email}:`, error);
    return null;
  }
}
