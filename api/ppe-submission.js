// API Route: PPE Instrument submission capture
// POST /api/ppe-submission
// Stores the full picture (industry + financials + four exposure groups + derived states)
// into ppe_submissions for analysis. No email captured by spec. Service key bypasses RLS.

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

function num(v) {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function int(v) {
    if (v === null || v === undefined || v === '') return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
}

function str(v, max) {
    if (v === null || v === undefined) return null;
    const s = String(v);
    return max && s.length > max ? s.slice(0, max) : s;
}

function arr(v) {
    if (!Array.isArray(v)) return [];
    return v.filter(item => typeof item === 'string').slice(0, 32);
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const body = req.body || {};

        const row = {
            industry:       str(body.industry, 64),
            industry_other: str(body.industry_other, 80),

            revenue:           num(body.revenue),
            profit:            num(body.profit),
            denominator_value: num(body.denominator_value),
            denominator_type:  str(body.denominator_type, 32),
            denominator_label: str(body.denominator_label, 80),
            ppe:               num(body.ppe),

            q11_confidence:        int(body.q11_confidence),
            q12_stale_pct:         int(body.q12_stale_pct),
            q21_pressures:         arr(body.q21_pressures),
            q22_pricing_pressure:  int(body.q22_pricing_pressure),
            q31_levers_pulled:     arr(body.q31_levers_pulled),
            q32_runway:            int(body.q32_runway),
            q41_visibility:        str(body.q41_visibility, 16),
            q42_confidence:        int(body.q42_confidence),
            q43_cost_estimate:     str(body.q43_cost_estimate, 300),

            human_state:           str(body.human_state, 16),
            consumed_lever_count:  int(body.consumed_lever_count),

            user_agent: str(req.headers['user-agent'], 500),
            referrer:   str(req.headers['referer'] || req.headers['referrer'], 500)
        };

        // Reject obviously empty payloads to keep noise out of the table.
        if (row.revenue === null && row.profit === null && row.denominator_value === null) {
            return res.status(400).json({ error: 'Missing required financial fields' });
        }

        const db = getSupabase();
        const { error } = await db.from('ppe_submissions').insert(row);

        if (error) {
            console.error('PPE submission insert error:', error);
            return res.status(500).json({ error: 'Failed to save submission' });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('PPE submission handler error:', err.message || err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
