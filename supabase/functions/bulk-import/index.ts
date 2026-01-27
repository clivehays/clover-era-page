import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This edge function handles bulk import of prospects for outreach
// Writes to outreach_prospects table (NOT contacts/companies)

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { contacts, skipExisting, updateExisting, batchName } = await req.json();

    if (!contacts || !Array.isArray(contacts)) {
      throw new Error('contacts array is required');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Create import batch identifier
    const importBatch = batchName || `Import ${new Date().toISOString().split('T')[0]}`;
    const importedAt = new Date().toISOString();

    let prospectsCreated = 0;
    let prospectsUpdated = 0;
    let skipped = 0;

    // Get existing emails from outreach_prospects (NOT contacts)
    const { data: existingProspects } = await supabase
      .from('outreach_prospects')
      .select('email');

    const existingEmails = new Set(
      (existingProspects || [])
        .map(p => p.email?.toLowerCase())
        .filter(Boolean)
    );

    // Process each contact from the CSV
    for (const contact of contacts) {
      // Skip invalid emails
      if (!contact.email || !contact.email.includes('@')) {
        skipped++;
        continue;
      }

      const emailLower = contact.email.toLowerCase();
      const isExisting = existingEmails.has(emailLower);

      if (isExisting && skipExisting && !updateExisting) {
        skipped++;
        continue;
      }

      // Build prospect data (denormalized - company info stored inline)
      const prospectData: Record<string, any> = {
        email: emailLower,
        import_batch: importBatch,
        imported_at: importedAt,
        status: 'imported',
      };

      // Add contact fields
      if (contact.firstName) prospectData.first_name = contact.firstName;
      if (contact.lastName) prospectData.last_name = contact.lastName;
      if (contact.title) prospectData.title = contact.title;
      if (contact.linkedinUrl) prospectData.linkedin_url = contact.linkedinUrl;

      // Add company fields (denormalized - no FK)
      if (contact.companyName) prospectData.company_name = contact.companyName;
      if (contact.website) prospectData.company_website = contact.website;
      if (contact.industry) prospectData.company_industry = contact.industry;
      if (contact.employees) prospectData.company_employee_count = parseInt(contact.employees) || null;

      if (isExisting && updateExisting) {
        // Update existing prospect
        const { error } = await supabase
          .from('outreach_prospects')
          .update(prospectData)
          .eq('email', emailLower);

        if (error) {
          console.error('Prospect update error:', error);
          skipped++;
        } else {
          prospectsUpdated++;
        }
      } else if (!isExisting) {
        // Insert new prospect
        const { error } = await supabase
          .from('outreach_prospects')
          .insert(prospectData);

        if (error) {
          console.error('Prospect insert error:', error);
          skipped++;
        } else {
          prospectsCreated++;
          existingEmails.add(emailLower);
        }
      } else {
        skipped++;
      }
    }

    console.log(`Import complete: ${prospectsCreated} prospects created, ${prospectsUpdated} updated, ${skipped} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        prospectsCreated,
        prospectsUpdated,
        skipped,
        importBatch,
        // Legacy field names for backward compatibility with UI
        companiesCreated: 0,
        contactsCreated: prospectsCreated,
        contactsUpdated: prospectsUpdated,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Bulk import error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
