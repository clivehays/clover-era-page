// API Route: Outreach Reply Detection
// Polls Microsoft 365 inbox for replies from outreach prospects
// Triggered by Vercel Cron every 10 minutes

import { createClient } from '@supabase/supabase-js';

// Lazy initialization
let supabase = null;
function getSupabase() {
    if (!supabase) {
        supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );
    }
    return supabase;
}

// Get Microsoft Graph access token
async function getGraphAccessToken() {
    const tokenUrl = `https://login.microsoftonline.com/${process.env.MS_GRAPH_TENANT_ID}/oauth2/v2.0/token`;

    const params = new URLSearchParams({
        client_id: process.env.MS_GRAPH_CLIENT_ID,
        client_secret: process.env.MS_GRAPH_CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
    });

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get access token: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
}

// Get recent emails from inbox
async function getRecentEmails(accessToken, minutesAgo = 15) {
    const userEmail = process.env.MS_GRAPH_USER_EMAIL;
    const receivedAfter = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();

    const url = `https://graph.microsoft.com/v1.0/users/${userEmail}/mailFolders/inbox/messages?$filter=receivedDateTime ge ${receivedAfter}&$select=id,subject,from,receivedDateTime,bodyPreview&$orderby=receivedDateTime desc&$top=50`;

    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get emails: ${error}`);
    }

    const data = await response.json();
    return data.value || [];
}

// Find matching prospect by email
async function findProspectByEmail(email) {
    const db = getSupabase();

    // Look for active prospects (in campaigns, not already replied/converted)
    const { data: prospect, error } = await db
        .from('outreach_prospects')
        .select(`
            id,
            email,
            first_name,
            last_name,
            title,
            linkedin_url,
            company_name,
            company_website,
            company_industry,
            company_employee_count,
            status
        `)
        .eq('email', email.toLowerCase())
        .in('status', ['active', 'completed', 'ready', 'pending'])
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error finding prospect:', error);
    }

    return prospect;
}

// Create company in CRM
async function createCompany(prospect) {
    const db = getSupabase();

    // Check if company already exists
    const { data: existingCompany } = await db
        .from('companies')
        .select('id')
        .eq('name', prospect.company_name)
        .single();

    if (existingCompany) {
        return existingCompany.id;
    }

    // Create new company
    const { data: newCompany, error } = await db
        .from('companies')
        .insert({
            name: prospect.company_name,
            website: prospect.company_website,
            industry: prospect.company_industry,
            employee_count: prospect.company_employee_count,
            source: 'outreach_reply',
            created_at: new Date().toISOString()
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating company:', error);
        throw error;
    }

    return newCompany.id;
}

// Create contact in CRM
async function createContact(prospect, companyId) {
    const db = getSupabase();

    // Check if contact already exists
    const { data: existingContact } = await db
        .from('contacts')
        .select('id')
        .eq('email', prospect.email)
        .single();

    if (existingContact) {
        return existingContact.id;
    }

    // Create new contact
    const { data: newContact, error } = await db
        .from('contacts')
        .insert({
            company_id: companyId,
            first_name: prospect.first_name,
            last_name: prospect.last_name,
            email: prospect.email,
            title: prospect.title,
            linkedin_url: prospect.linkedin_url,
            source: 'outreach_reply',
            created_at: new Date().toISOString()
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating contact:', error);
        throw error;
    }

    return newContact.id;
}

// Create opportunity in CRM
async function createOpportunity(prospect, companyId, contactId, emailSubject) {
    const db = getSupabase();

    const { data: opportunity, error } = await db
        .from('opportunities')
        .insert({
            company_id: companyId,
            contact_id: contactId,
            name: `${prospect.company_name} - Outreach Reply`,
            stage: 'discovery',
            source: 'outreach_reply',
            value: 96000, // Default enterprise value
            notes: `Auto-created from outreach reply.\nEmail subject: ${emailSubject}`,
            created_at: new Date().toISOString()
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating opportunity:', error);
        throw error;
    }

    return opportunity.id;
}

// Update prospect status to replied
async function updateProspectStatus(prospectId, contactId) {
    const db = getSupabase();

    const { error } = await db
        .from('outreach_prospects')
        .update({
            status: 'converted',
            converted_contact_id: contactId,
            converted_at: new Date().toISOString()
        })
        .eq('id', prospectId);

    if (error) {
        console.error('Error updating prospect status:', error);
        throw error;
    }

    // Also update campaign_prospects status
    await db
        .from('campaign_prospects')
        .update({ status: 'replied' })
        .eq('prospect_id', prospectId);
}

// Log processed email to avoid duplicates
async function logProcessedEmail(emailId, prospectId, result) {
    const db = getSupabase();

    await db
        .from('processed_reply_emails')
        .insert({
            email_id: emailId,
            prospect_id: prospectId,
            result: result,
            processed_at: new Date().toISOString()
        });
}

// Check if email was already processed
async function isEmailProcessed(emailId) {
    const db = getSupabase();

    const { data } = await db
        .from('processed_reply_emails')
        .select('id')
        .eq('email_id', emailId)
        .single();

    return !!data;
}

export default async function handler(req, res) {
    // Only allow GET (for cron) or POST (for manual trigger)
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify cron secret for security (optional)
    const cronSecret = req.headers['x-vercel-cron-secret'];
    const isManualTrigger = req.query.manual === 'true';

    console.log('Reply detection started at:', new Date().toISOString());

    try {
        // Get Microsoft Graph access token
        const accessToken = await getGraphAccessToken();
        console.log('Got Graph API access token');

        // Get recent emails (last 15 minutes, or longer for manual runs)
        const minutesAgo = isManualTrigger ? 60 : 15;
        const emails = await getRecentEmails(accessToken, minutesAgo);
        console.log(`Found ${emails.length} emails in last ${minutesAgo} minutes`);

        const results = {
            processed: 0,
            matched: 0,
            converted: 0,
            skipped: 0,
            errors: []
        };

        for (const email of emails) {
            const senderEmail = email.from?.emailAddress?.address?.toLowerCase();
            if (!senderEmail) {
                results.skipped++;
                continue;
            }

            // Skip if already processed
            if (await isEmailProcessed(email.id)) {
                results.skipped++;
                continue;
            }

            results.processed++;

            // Find matching prospect
            const prospect = await findProspectByEmail(senderEmail);
            if (!prospect) {
                await logProcessedEmail(email.id, null, 'no_match');
                continue;
            }

            results.matched++;
            console.log(`Matched reply from: ${senderEmail} (${prospect.company_name})`);

            try {
                // Create company, contact, opportunity
                const companyId = await createCompany(prospect);
                const contactId = await createContact(prospect, companyId);
                const opportunityId = await createOpportunity(prospect, companyId, contactId, email.subject);

                // Update prospect status
                await updateProspectStatus(prospect.id, contactId);

                // Log successful processing
                await logProcessedEmail(email.id, prospect.id, 'converted');

                results.converted++;
                console.log(`Created opportunity ${opportunityId} for ${prospect.company_name}`);

            } catch (conversionError) {
                console.error(`Error converting prospect ${prospect.email}:`, conversionError);
                results.errors.push({
                    email: senderEmail,
                    error: conversionError.message
                });
                await logProcessedEmail(email.id, prospect.id, 'error');
            }
        }

        console.log('Reply detection completed:', results);

        return res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            results
        });

    } catch (error) {
        console.error('Reply detection error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
