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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const db = getSupabase();

    try {
        // POST - Create new assessment
        if (req.method === 'POST') {
            // Accept both naming conventions
            const name = req.body.name || req.body.participant_name;
            const email = req.body.email || req.body.participant_email;

            if (!name || !email) {
                return res.status(400).json({
                    error: 'Name and email are required'
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    error: 'Invalid email format'
                });
            }

            // Check for existing in-progress assessment for this email (within last 24 hours)
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            const { data: existingAssessment } = await db
                .from('assessments')
                .select('id, participant_name, status, started_at')
                .eq('participant_email', email.toLowerCase().trim())
                .eq('status', 'in_progress')
                .gte('started_at', twentyFourHoursAgo)
                .order('started_at', { ascending: false })
                .limit(1)
                .single();

            if (existingAssessment) {
                // Return existing assessment ID so they can continue
                return res.status(200).json({
                    id: existingAssessment.id,
                    name: existingAssessment.participant_name,
                    status: existingAssessment.status,
                    message: 'Continuing existing assessment'
                });
            }

            // Create new assessment
            const { data: newAssessment, error: insertError } = await db
                .from('assessments')
                .insert({
                    participant_name: name.trim(),
                    participant_email: email.toLowerCase().trim(),
                    status: 'in_progress',
                    started_at: new Date().toISOString()
                })
                .select('id, participant_name, participant_email, status')
                .single();

            if (insertError) {
                console.error('Error creating assessment:', insertError);
                return res.status(500).json({
                    error: 'Failed to create assessment'
                });
            }

            return res.status(201).json({
                id: newAssessment.id,
                name: newAssessment.participant_name,
                email: newAssessment.participant_email,
                status: newAssessment.status,
                message: 'Assessment created'
            });
        }

        // GET - Retrieve assessment by ID
        if (req.method === 'GET') {
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({
                    error: 'Assessment ID is required'
                });
            }

            // Validate UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(id)) {
                return res.status(400).json({
                    error: 'Invalid assessment ID format'
                });
            }

            // Get assessment
            const { data: assessment, error: assessmentError } = await db
                .from('assessments')
                .select('id, participant_name, participant_email, status, started_at, completed_at')
                .eq('id', id)
                .single();

            if (assessmentError || !assessment) {
                return res.status(404).json({
                    error: 'Assessment not found'
                });
            }

            // Get responses for this assessment
            const { data: responses, error: responsesError } = await db
                .from('assessment_responses')
                .select('question_id, response')
                .eq('assessment_id', id);

            if (responsesError) {
                console.error('Error fetching responses:', responsesError);
            }

            // Get notes for this assessment
            const { data: notes, error: notesError } = await db
                .from('assessment_notes')
                .select('section_id, note_text')
                .eq('assessment_id', id);

            if (notesError) {
                console.error('Error fetching notes:', notesError);
            }

            return res.status(200).json({
                assessment: {
                    id: assessment.id,
                    participant_name: assessment.participant_name,
                    participant_email: assessment.participant_email,
                    status: assessment.status,
                    started_at: assessment.started_at,
                    completed_at: assessment.completed_at
                },
                responses: responses || [],
                notes: notes || []
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Assessment API error:', error);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
}
