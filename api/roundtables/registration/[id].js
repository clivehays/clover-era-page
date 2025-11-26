// API Route: Get registration details by ID
// GET /api/roundtables/registration/[id]

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
        return res.status(400).json({ error: 'Registration ID is required' });
    }

    try {
        // Get registration with roundtable details
        const { data: registration, error: regError } = await supabase
            .from('registrations')
            .select(`
                *,
                roundtable:roundtables(*)
            `)
            .eq('id', id)
            .single();

        if (regError) {
            if (regError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Registration not found' });
            }
            console.error('Supabase error:', regError);
            return res.status(500).json({ error: 'Failed to fetch registration' });
        }

        // Don't expose sensitive data
        const safeData = {
            id: registration.id,
            name: registration.name,
            email: registration.email,
            company: registration.company,
            role: registration.role,
            is_waitlist: registration.is_waitlist,
            status: registration.status,
            registered_at: registration.registered_at,
            roundtable: {
                id: registration.roundtable.id,
                topic: registration.roundtable.topic,
                description: registration.roundtable.description,
                scheduled_at: registration.roundtable.scheduled_at,
                duration_minutes: registration.roundtable.duration_minutes
            }
        };

        return res.status(200).json(safeData);

    } catch (error) {
        console.error('Error fetching registration:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
