// API Route: Get specific roundtable by ID
// GET /api/roundtables/[id]

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

    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'Roundtable ID is required' });
    }

    try {
        // Get roundtable with registration count
        const { data: roundtable, error } = await supabase
            .from('upcoming_roundtables')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Roundtable not found' });
            }
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch roundtable' });
        }

        return res.status(200).json(roundtable);

    } catch (error) {
        console.error('Error fetching roundtable:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
