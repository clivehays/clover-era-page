// API Route: Get upcoming roundtables
// GET /api/roundtables/upcoming

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get upcoming roundtables with registration counts
        const { data: roundtables, error } = await supabase
            .from('upcoming_roundtables')
            .select('*')
            .limit(8)
            .order('scheduled_at', { ascending: true });

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch roundtables' });
        }

        return res.status(200).json(roundtables || []);

    } catch (error) {
        console.error('Error fetching roundtables:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
