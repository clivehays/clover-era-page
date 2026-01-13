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

// Calculate zone based on score
function getZone(score) {
    if (score >= 20) return 'strength';
    if (score >= 15) return 'development';
    if (score >= 10) return 'priority';
    return 'critical';
}

// All required question IDs
const REQUIRED_QUESTIONS = [
    'C1', 'C2', 'C3', 'C4', 'C5',
    'L1', 'L2', 'L3', 'L4', 'L5',
    'O1', 'O2', 'O3', 'O4', 'O5',
    'V1', 'V2', 'V3', 'V4', 'V5',
    'E1', 'E2', 'E3', 'E4', 'E5',
    'R1', 'R2', 'R3', 'R4', 'R5'
];

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
        const { assessment_id } = req.body;

        if (!assessment_id) {
            return res.status(400).json({
                error: 'assessment_id is required'
            });
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(assessment_id)) {
            return res.status(400).json({
                error: 'Invalid assessment_id format'
            });
        }

        // Verify assessment exists and is in progress
        const { data: assessment, error: assessmentError } = await db
            .from('assessments')
            .select('id, status, participant_name, participant_email')
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

        // Get all responses for this assessment
        const { data: responses, error: responsesError } = await db
            .from('assessment_responses')
            .select('question_id, response')
            .eq('assessment_id', assessment_id);

        if (responsesError) {
            console.error('Error fetching responses:', responsesError);
            return res.status(500).json({
                error: 'Failed to fetch responses'
            });
        }

        // Convert to map for easy access
        const responsesMap = {};
        responses.forEach(r => {
            responsesMap[r.question_id] = r.response;
        });

        // Check if all 30 questions are answered
        const missingQuestions = REQUIRED_QUESTIONS.filter(q => !responsesMap[q]);
        if (missingQuestions.length > 0) {
            return res.status(400).json({
                error: 'Not all questions have been answered',
                missing: missingQuestions
            });
        }

        // Calculate scores for each element
        const communication = responsesMap['C1'] + responsesMap['C2'] + responsesMap['C3'] + responsesMap['C4'] + responsesMap['C5'];
        const learning = responsesMap['L1'] + responsesMap['L2'] + responsesMap['L3'] + responsesMap['L4'] + responsesMap['L5'];
        const opportunities = responsesMap['O1'] + responsesMap['O2'] + responsesMap['O3'] + responsesMap['O4'] + responsesMap['O5'];
        const vulnerability = responsesMap['V1'] + responsesMap['V2'] + responsesMap['V3'] + responsesMap['V4'] + responsesMap['V5'];
        const enablement = responsesMap['E1'] + responsesMap['E2'] + responsesMap['E3'] + responsesMap['E4'] + responsesMap['E5'];
        const reflection = responsesMap['R1'] + responsesMap['R2'] + responsesMap['R3'] + responsesMap['R4'] + responsesMap['R5'];

        const total = communication + learning + opportunities + vulnerability + enablement + reflection;

        // Insert scores
        const { error: scoresError } = await db
            .from('assessment_scores')
            .insert({
                assessment_id: assessment_id,
                communication: communication,
                learning: learning,
                opportunities: opportunities,
                vulnerability: vulnerability,
                enablement: enablement,
                reflection: reflection,
                total: total,
                communication_zone: getZone(communication),
                learning_zone: getZone(learning),
                opportunities_zone: getZone(opportunities),
                vulnerability_zone: getZone(vulnerability),
                enablement_zone: getZone(enablement),
                reflection_zone: getZone(reflection),
                calculated_at: new Date().toISOString()
            });

        if (scoresError) {
            console.error('Error saving scores:', scoresError);
            return res.status(500).json({
                error: 'Failed to save scores'
            });
        }

        // Update assessment status to completed
        const completedAt = new Date().toISOString();
        const { error: updateError } = await db
            .from('assessments')
            .update({
                status: 'completed',
                completed_at: completedAt,
                updated_at: completedAt
            })
            .eq('id', assessment_id);

        if (updateError) {
            console.error('Error updating assessment status:', updateError);
            return res.status(500).json({
                error: 'Failed to complete assessment'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Assessment completed successfully',
            scores: {
                communication: { score: communication, zone: getZone(communication) },
                learning: { score: learning, zone: getZone(learning) },
                opportunities: { score: opportunities, zone: getZone(opportunities) },
                vulnerability: { score: vulnerability, zone: getZone(vulnerability) },
                enablement: { score: enablement, zone: getZone(enablement) },
                reflection: { score: reflection, zone: getZone(reflection) },
                total: total
            }
        });

    } catch (error) {
        console.error('Submit API error:', error);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
}
