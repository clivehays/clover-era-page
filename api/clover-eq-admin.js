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
            let query = db
                .from('assessments')
                .select(`
                    id,
                    participant_name,
                    participant_email,
                    status,
                    started_at,
                    completed_at,
                    assessment_scores (
                        communication,
                        learning,
                        opportunities,
                        vulnerability,
                        enablement,
                        reflection,
                        total,
                        communication_zone,
                        learning_zone,
                        opportunities_zone,
                        vulnerability_zone,
                        enablement_zone,
                        reflection_zone
                    )
                `)
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

            // Transform data to flatten scores
            const transformed = assessments.map(a => ({
                id: a.id,
                participant_name: a.participant_name,
                participant_email: a.participant_email,
                status: a.status,
                started_at: a.started_at,
                completed_at: a.completed_at,
                scores: a.assessment_scores?.[0] || null
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

            // Convert responses to object
            const responsesMap = {};
            if (responses) {
                responses.forEach(r => {
                    responsesMap[r.question_id] = r.response;
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
                responses: responsesMap
            };

            return res.status(200).json(exportData);
        }

        return res.status(400).json({ error: 'Invalid action' });

    } catch (error) {
        console.error('Admin API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
