import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This edge function handles bulk import of contacts/companies
// It bypasses PostgREST and uses the service role for direct database access

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

    let companiesCreated = 0;
    let contactsCreated = 0;
    let contactsUpdated = 0;
    let skipped = 0;

    // Get existing emails
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('email');

    const existingEmails = new Set(
      (existingContacts || [])
        .map(c => c.email?.toLowerCase())
        .filter(Boolean)
    );

    // Get existing companies
    const { data: existingCompanies } = await supabase
      .from('companies')
      .select('id, name');

    const companyMap = new Map<string, string>();
    (existingCompanies || []).forEach(c => {
      if (c.name) companyMap.set(c.name.toLowerCase(), c.id);
    });

    // Group contacts by company
    const byCompany = new Map<string, any[]>();
    for (const contact of contacts) {
      if (!contact.email || !contact.email.includes('@')) {
        skipped++;
        continue;
      }

      const companyKey = contact.companyName?.toLowerCase() || '_no_company_';
      if (!byCompany.has(companyKey)) {
        byCompany.set(companyKey, []);
      }
      byCompany.get(companyKey)!.push(contact);
    }

    // Process each company group
    for (const [companyKey, companyContacts] of byCompany) {
      let companyId = companyMap.get(companyKey);

      // Create company if needed
      if (!companyId && companyKey !== '_no_company_' && companyContacts[0].companyName) {
        const companyData: Record<string, any> = {
          name: companyContacts[0].companyName,
        };

        // Add optional fields if present
        if (companyContacts[0].website) companyData.website = companyContacts[0].website;
        if (companyContacts[0].industry) companyData.industry = companyContacts[0].industry;
        if (companyContacts[0].employees) companyData.employee_count = companyContacts[0].employees;

        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert(companyData)
          .select('id')
          .single();

        if (companyError) {
          console.error('Company insert error:', companyError);
        } else if (newCompany) {
          companyId = newCompany.id;
          companyMap.set(companyKey, companyId);
          companiesCreated++;
        }
      }

      // Import contacts
      for (const contact of companyContacts) {
        const emailLower = contact.email.toLowerCase();
        const isExisting = existingEmails.has(emailLower);

        if (isExisting && skipExisting && !updateExisting) {
          skipped++;
          continue;
        }

        const contactData: Record<string, any> = {
          email: emailLower,
          import_batch: importBatch,
          imported_at: importedAt,
        };

        // Add optional fields
        if (contact.firstName) contactData.first_name = contact.firstName;
        if (contact.lastName) contactData.last_name = contact.lastName;
        if (contact.title) contactData.title = contact.title;
        if (contact.linkedinUrl) contactData.linkedin_url = contact.linkedinUrl;
        if (companyId) contactData.company_id = companyId;

        if (isExisting && updateExisting) {
          // Update existing contact
          const { error } = await supabase
            .from('contacts')
            .update(contactData)
            .eq('email', emailLower);

          if (error) {
            console.error('Contact update error:', error);
            skipped++;
          } else {
            contactsUpdated++;
          }
        } else if (!isExisting) {
          // Insert new contact
          const { error } = await supabase
            .from('contacts')
            .insert(contactData);

          if (error) {
            console.error('Contact insert error:', error);
            skipped++;
          } else {
            contactsCreated++;
            existingEmails.add(emailLower);
          }
        } else {
          skipped++;
        }
      }
    }

    console.log(`Import complete: ${companiesCreated} companies, ${contactsCreated} contacts created, ${contactsUpdated} updated, ${skipped} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        companiesCreated,
        contactsCreated,
        contactsUpdated,
        skipped,
        importBatch,
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
