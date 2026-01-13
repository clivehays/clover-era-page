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

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const db = getSupabase();

    try {
        const { assessment_id, section_id, note_text } = req.body;

        // Validate required fields
        if (!assessment_id || !section_id) {
            return res.status(400).json({
                error: 'assessment_id and section_id are required'
            });
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(assessment_id)) {
            return res.status(400).json({
                error: 'Invalid assessment_id format'
            });
        }

        // Validate section_id
        const validSections = ['communication', 'learning', 'opportunities', 'vulnerability', 'enablement', 'reflection'];
        if (!validSections.includes(section_id)) {
            return res.status(400).json({
                error: 'Invalid section_id'
            });
        }

        // Verify assessment exists and is in progress
        const { data: assessment, error: assessmentError } = await db
            .from('assessments')
            .select('id, status')
            .eq('id', assessment_id)
            .single();

        if (assessmentError || !assessment) {
            return res.status(404).json({
                error: 'Assessment not found'
            });
        }

        if (assessment.status === 'completed') {
            return res.status(400).json({
                error: 'Assessment is already completed'
            });
        }

        // Upsert the note (insert or update if exists)
        const { data: savedNote, error: upsertError } = await db
            .from('assessment_notes')
            .upsert({
                assessment_id: assessment_id,
                section_id: section_id,
                note_text: note_text || '',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'assessment_id,section_id'
            })
            .select('id, section_id, note_text')
            .single();

        if (upsertError) {
            console.error('Error saving note:', upsertError);
            return res.status(500).json({
                error: 'Failed to save note'
            });
        }

        return res.status(200).json({
            success: true,
            section_id: savedNote.section_id,
            note_text: savedNote.note_text
        });

    } catch (error) {
        console.error('Notes API error:', error);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
}
