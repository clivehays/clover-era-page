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
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_KEY}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = getSupabase();
    const { action, id, status } = req.query;

    try {
        // List all assessments
        if (action === 'list' || !action) {
            // Fetch assessments
            let query = db
                .from('assessments')
                .select('id, participant_name, participant_email, status, started_at, completed_at')
                .order('started_at', { ascending: false });

            // Filter by status if provided
            if (status && (status === 'in_progress' || status === 'completed')) {
                query = query.eq('status', status);
            }

            const { data: assessments, error } = await query;

            if (error) {
                console.error('Error fetching assessments:', error);
                return res.status(500).json({ error: 'Failed to fetch assessments' });
            }

            // Fetch all scores separately
            const { data: allScores, error: scoresError } = await db
                .from('assessment_scores')
                .select('assessment_id, communication, learning, opportunities, vulnerability, enablement, reflection, total, communication_zone, learning_zone, opportunities_zone, vulnerability_zone, enablement_zone, reflection_zone');

            if (scoresError) {
                console.error('Error fetching scores:', scoresError);
            }

            // Create a map of scores by assessment_id
            const scoresMap = {};
            if (allScores) {
                allScores.forEach(s => {
                    scoresMap[s.assessment_id] = {
                        communication: s.communication,
                        learning: s.learning,
                        opportunities: s.opportunities,
                        vulnerability: s.vulnerability,
                        enablement: s.enablement,
                        reflection: s.reflection,
                        total: s.total,
                        communication_zone: s.communication_zone,
                        learning_zone: s.learning_zone,
                        opportunities_zone: s.opportunities_zone,
                        vulnerability_zone: s.vulnerability_zone,
                        enablement_zone: s.enablement_zone,
                        reflection_zone: s.reflection_zone
                    };
                });
            }

            // Transform data to include scores
            const transformed = assessments.map(a => ({
                id: a.id,
                participant_name: a.participant_name,
                participant_email: a.participant_email,
                status: a.status,
                started_at: a.started_at,
                completed_at: a.completed_at,
                scores: scoresMap[a.id] || null
            }));

            return res.status(200).json({
                count: transformed.length,
                assessments: transformed
            });
        }

        // Export single assessment as JSON (for Claude report generation)
        if (action === 'export' && id) {
            // Validate UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(id)) {
                return res.status(400).json({ error: 'Invalid assessment ID format' });
            }

            // Get assessment
            const { data: assessment, error: assessmentError } = await db
                .from('assessments')
                .select('id, participant_name, participant_email, status, completed_at')
                .eq('id', id)
                .single();

            if (assessmentError || !assessment) {
                return res.status(404).json({ error: 'Assessment not found' });
            }

            // Get scores
            const { data: scores, error: scoresError } = await db
                .from('assessment_scores')
                .select('*')
                .eq('assessment_id', id)
                .single();

            // Get responses
            const { data: responses, error: responsesError } = await db
                .from('assessment_responses')
                .select('question_id, response')
                .eq('assessment_id', id);

            if (responsesError) {
                console.error('Error fetching responses:', responsesError);
            }

            // Get notes
            const { data: notes, error: notesError } = await db
                .from('assessment_notes')
                .select('section_id, note_text')
                .eq('assessment_id', id);

            if (notesError) {
                console.error('Error fetching notes:', notesError);
            }

            // Convert responses to object
            const responsesMap = {};
            if (responses) {
                responses.forEach(r => {
                    responsesMap[r.question_id] = r.response;
                });
            }

            // Convert notes to object
            const notesMap = {};
            if (notes) {
                notes.forEach(n => {
                    notesMap[n.section_id] = n.note_text;
                });
            }

            // Build export format optimized for Claude
            const exportData = {
                participant: {
                    name: assessment.participant_name,
                    email: assessment.participant_email,
                    completed_at: assessment.completed_at
                },
                scores: scores ? {
                    communication: scores.communication,
                    communication_zone: scores.communication_zone,
                    learning: scores.learning,
                    learning_zone: scores.learning_zone,
                    opportunities: scores.opportunities,
                    opportunities_zone: scores.opportunities_zone,
                    vulnerability: scores.vulnerability,
                    vulnerability_zone: scores.vulnerability_zone,
                    enablement: scores.enablement,
                    enablement_zone: scores.enablement_zone,
                    reflection: scores.reflection,
                    reflection_zone: scores.reflection_zone,
                    total: scores.total
                } : null,
                responses: responsesMap,
                notes: notesMap
            };

            return res.status(200).json(exportData);
        }

        // Get detailed view of a single assessment
        if (action === 'detail' && id) {
            // Validate UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(id)) {
                return res.status(400).json({ error: 'Invalid assessment ID format' });
            }

            // Get assessment
            const { data: assessment, error: assessmentError } = await db
                .from('assessments')
                .select('id, participant_name, participant_email, status, started_at, completed_at')
                .eq('id', id)
                .single();

            if (assessmentError || !assessment) {
                return res.status(404).json({ error: 'Assessment not found' });
            }

            // Get scores separately
            const { data: scores } = await db
                .from('assessment_scores')
                .select('communication, learning, opportunities, vulnerability, enablement, reflection, total, communication_zone, learning_zone, opportunities_zone, vulnerability_zone, enablement_zone, reflection_zone')
                .eq('assessment_id', id)
                .single();

            // Get responses
            const { data: responses } = await db
                .from('assessment_responses')
                .select('question_id, response')
                .eq('assessment_id', id);

            // Get notes
            const { data: notes } = await db
                .from('assessment_notes')
                .select('section_id, note_text')
                .eq('assessment_id', id);

            // Convert to maps
            const responsesMap = {};
            if (responses) {
                responses.forEach(r => {
                    responsesMap[r.question_id] = r.response;
                });
            }

            const notesMap = {};
            if (notes) {
                notes.forEach(n => {
                    notesMap[n.section_id] = n.note_text;
                });
            }

            return res.status(200).json({
                assessment: {
                    ...assessment,
                    scores: scores || null
                },
                responses: responsesMap,
                notes: notesMap
            });
        }

        // Recalculate scores for a completed assessment missing scores
        if (action === 'recalculate' && id) {
            // Validate UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(id)) {
                return res.status(400).json({ error: 'Invalid assessment ID format' });
            }

            // Get assessment
            const { data: assessment, error: assessmentError } = await db
                .from('assessments')
                .select('id, status')
                .eq('id', id)
                .single();

            if (assessmentError || !assessment) {
                return res.status(404).json({ error: 'Assessment not found' });
            }

            if (assessment.status !== 'completed') {
                return res.status(400).json({ error: 'Assessment is not completed' });
            }

            // Check if scores already exist
            const { data: existingScores } = await db
                .from('assessment_scores')
                .select('id')
                .eq('assessment_id', id)
                .single();

            if (existingScores) {
                return res.status(400).json({ error: 'Scores already exist for this assessment' });
            }

            // Get all responses
            const { data: responses, error: responsesError } = await db
                .from('assessment_responses')
                .select('question_id, response')
                .eq('assessment_id', id);

            if (responsesError || !responses) {
                return res.status(500).json({ error: 'Failed to fetch responses' });
            }

            // Convert to map
            const responsesMap = {};
            responses.forEach(r => {
                responsesMap[r.question_id] = r.response;
            });

            // Check if all 30 questions are answered
            const requiredQuestions = [
                'C1', 'C2', 'C3', 'C4', 'C5',
                'L1', 'L2', 'L3', 'L4', 'L5',
                'O1', 'O2', 'O3', 'O4', 'O5',
                'V1', 'V2', 'V3', 'V4', 'V5',
                'E1', 'E2', 'E3', 'E4', 'E5',
                'R1', 'R2', 'R3', 'R4', 'R5'
            ];

            const missingQuestions = requiredQuestions.filter(q => !responsesMap[q]);
            if (missingQuestions.length > 0) {
                return res.status(400).json({
                    error: 'Assessment has missing responses',
                    missing: missingQuestions
                });
            }

            // Calculate scores
            const getZone = (score) => {
                if (score >= 20) return 'strength';
                if (score >= 15) return 'development';
                if (score >= 10) return 'priority';
                return 'critical';
            };

            const communication = responsesMap['C1'] + responsesMap['C2'] + responsesMap['C3'] + responsesMap['C4'] + responsesMap['C5'];
            const learning = responsesMap['L1'] + responsesMap['L2'] + responsesMap['L3'] + responsesMap['L4'] + responsesMap['L5'];
            const opportunities = responsesMap['O1'] + responsesMap['O2'] + responsesMap['O3'] + responsesMap['O4'] + responsesMap['O5'];
            const vulnerability = responsesMap['V1'] + responsesMap['V2'] + responsesMap['V3'] + responsesMap['V4'] + responsesMap['V5'];
            const enablement = responsesMap['E1'] + responsesMap['E2'] + responsesMap['E3'] + responsesMap['E4'] + responsesMap['E5'];
            const reflection = responsesMap['R1'] + responsesMap['R2'] + responsesMap['R3'] + responsesMap['R4'] + responsesMap['R5'];
            const total = communication + learning + opportunities + vulnerability + enablement + reflection;

            // Insert scores
            const { error: insertError } = await db
                .from('assessment_scores')
                .insert({
                    assessment_id: id,
                    communication,
                    learning,
                    opportunities,
                    vulnerability,
                    enablement,
                    reflection,
                    total,
                    communication_zone: getZone(communication),
                    learning_zone: getZone(learning),
                    opportunities_zone: getZone(opportunities),
                    vulnerability_zone: getZone(vulnerability),
                    enablement_zone: getZone(enablement),
                    reflection_zone: getZone(reflection),
                    calculated_at: new Date().toISOString()
                });

            if (insertError) {
                console.error('Error inserting scores:', insertError);
                return res.status(500).json({ error: 'Failed to save scores' });
            }

            return res.status(200).json({
                success: true,
                message: 'Scores recalculated successfully',
                scores: {
                    communication: { score: communication, zone: getZone(communication) },
                    learning: { score: learning, zone: getZone(learning) },
                    opportunities: { score: opportunities, zone: getZone(opportunities) },
                    vulnerability: { score: vulnerability, zone: getZone(vulnerability) },
                    enablement: { score: enablement, zone: getZone(enablement) },
                    reflection: { score: reflection, zone: getZone(reflection) },
                    total
                }
            });
        }

        return res.status(400).json({ error: 'Invalid action' });

    } catch (error) {
        console.error('Admin API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
