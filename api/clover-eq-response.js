import { createClient } from '@supabase/supabase-js';

let supabase = null;

function getSupabase() {
    if (!supabase) {
        supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
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
        const { assessment_id, question_id, response } = req.body;

        // Validate required fields
        if (!assessment_id || !question_id || response === undefined) {
            return res.status(400).json({
                error: 'assessment_id, question_id, and response are required'
            });
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(assessment_id)) {
            return res.status(400).json({
                error: 'Invalid assessment_id format'
            });
        }

        // Validate question_id format (C1-C5, L1-L5, O1-O5, V1-V5, E1-E5, R1-R5)
        const questionIdRegex = /^[CLOVER][1-5]$/;
        if (!questionIdRegex.test(question_id)) {
            return res.status(400).json({
                error: 'Invalid question_id format'
            });
        }

        // Validate response value (1-5)
        const responseValue = parseInt(response, 10);
        if (isNaN(responseValue) || responseValue < 1 || responseValue > 5) {
            return res.status(400).json({
                error: 'Response must be between 1 and 5'
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

        // Upsert the response (insert or update if exists)
        const { data: savedResponse, error: upsertError } = await db
            .from('assessment_responses')
            .upsert({
                assessment_id: assessment_id,
                question_id: question_id,
                response: responseValue,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'assessment_id,question_id'
            })
            .select('id, question_id, response')
            .single();

        if (upsertError) {
            console.error('Error saving response:', upsertError);
            return res.status(500).json({
                error: 'Failed to save response'
            });
        }

        // Update assessment's updated_at timestamp
        await db
            .from('assessments')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', assessment_id);

        return res.status(200).json({
            success: true,
            question_id: savedResponse.question_id,
            response: savedResponse.response
        });

    } catch (error) {
        console.error('Response API error:', error);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
}
