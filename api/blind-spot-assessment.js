// API Route: Blind Spot Assessment Results
// POST /api/blind-spot-assessment
// Saves assessment data and creates a DM Tracker contact for follow-up

import { createClient } from '@supabase/supabase-js';

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

// Score band labels
function getVerdict(score) {
    if (score <= 20) return 'Critical Blind Spots';
    if (score <= 30) return 'Significant Gaps';
    if (score <= 40) return 'Some Visibility, Some Gaps';
    if (score <= 50) return 'Good Awareness, Watch the Edges';
    return 'Strong Visibility';
}

// Get the DM Tracker owner user_id (first auth user, or env var override)
async function getOwnerUserId(supabase) {
    // Check for explicit env var first
    if (process.env.DM_TRACKER_USER_ID) {
        return process.env.DM_TRACKER_USER_ID;
    }

    // Fall back to first user in auth.users
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error || !data?.users?.length) {
        console.error('Could not find DM Tracker owner:', error);
        return null;
    }
    return data.users[0].id;
}

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const {
            name,
            email,
            company,
            teamSize,
            responses,
            total_score,
            section_scores,
            verdict,
            completed_at
        } = req.body;

        // Validate
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        const cleanEmail = email.toLowerCase().trim();
        const cleanName = name.trim();

        // Split name into first/last
        const nameParts = cleanName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

        const supabase = getSupabase();
        const now = new Date().toISOString();
        const today = now.split('T')[0];

        // Get DM Tracker owner
        const ownerId = await getOwnerUserId(supabase);
        if (!ownerId) {
            console.error('No DM Tracker owner found');
            return res.status(500).json({ error: 'Configuration error' });
        }

        // Build score summary for notes
        const scoreVerdict = verdict || getVerdict(total_score);
        let noteText = `BLIND SPOT ASSESSMENT - Score: ${total_score}/60 (${scoreVerdict})`;

        if (section_scores) {
            noteText += '\n\nCLOVER Breakdown:';
            const labels = { C: 'Communication', L: 'Learning', O: 'Opportunity', V: 'Vulnerability', E: 'Enablement', R: 'Reflection' };
            for (const [letter, score] of Object.entries(section_scores)) {
                noteText += `\n  ${letter} - ${labels[letter]}: ${score}/10`;
            }
        }

        if (company) noteText += `\n\nCompany: ${company}`;
        if (teamSize) noteText += `\nTeam Size: ${teamSize}`;

        // Check for existing dm_contact with same email
        const { data: existing } = await supabase
            .from('dm_contacts')
            .select('id, notes, activity_log')
            .eq('user_id', ownerId)
            .ilike('notes', `%${cleanEmail}%`)
            .maybeSingle();

        if (existing) {
            // Update existing contact with new assessment data
            const updatedLog = existing.activity_log || [];
            updatedLog.push({ date: now, text: `Completed Blind Spot Assessment - Score: ${total_score}/60 (${scoreVerdict})` });

            const updatedNotes = existing.notes
                ? existing.notes + '\n\n---\n' + noteText
                : noteText;

            await supabase
                .from('dm_contacts')
                .update({
                    notes: updatedNotes,
                    activity_log: updatedLog,
                    updated_at: now
                })
                .eq('id', existing.id);

            console.log('Updated existing DM contact:', existing.id);
        } else {
            // Create new DM Tracker contact
            noteText += `\nEmail: ${cleanEmail}`;

            const { data: newContact, error: insertError } = await supabase
                .from('dm_contacts')
                .insert({
                    user_id: ownerId,
                    first_name: firstName,
                    last_name: lastName,
                    company: company || null,
                    title: null,
                    linkedin_url: null,
                    source: 'assessment',
                    stage: 'new',
                    source_post: 'Blind Spot Assessment',
                    their_message: `Scored ${total_score}/60 - ${scoreVerdict}`,
                    next_action: 'Follow up on assessment results',
                    due_date: today,
                    team_size: teamSize ? parseInt(teamSize) : null,
                    notes: noteText,
                    activity_log: [{ date: now, text: `Completed Blind Spot Assessment - Score: ${total_score}/60 (${scoreVerdict})` }],
                    last_contact_date: now,
                    created_at: now,
                    updated_at: now
                })
                .select('id')
                .single();

            if (insertError) {
                console.error('Error creating DM contact:', insertError);
                return res.status(500).json({ error: 'Failed to save assessment' });
            }

            console.log('Created DM contact:', newContact.id, 'for', cleanEmail);
        }

        return res.status(201).json({
            success: true,
            message: 'Assessment saved'
        });

    } catch (error) {
        console.error('Assessment API error:', error.message || error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
