// API Route: Calculator Turnover Cost Report Email
// POST /api/calculator-report
// Sends a turnover cost report via Resend and saves lead to dm_contacts

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

async function getOwnerUserId(supabase) {
    if (process.env.DM_TRACKER_USER_ID) {
        return process.env.DM_TRACKER_USER_ID;
    }
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error || !data?.users?.length) {
        console.error('Could not find DM Tracker owner:', error);
        return null;
    }
    return data.users[0].id;
}

function formatDollars(num) {
    return '$' + Math.round(num).toLocaleString('en-US');
}

function generateReportHtml(data) {
    const { email, employees, avgSalary, turnoverRate, totalCost, trackedCost, gapCost, departures, costPerDeparture, bdReplace, bdProductivity, bdKnowledge, bdDisruption, bdRipple } = data;

    return `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; max-width: 600px; margin: 0 auto; padding: 20px; }
        h1 { color: #1F2937; font-size: 24px; margin-bottom: 8px; }
        h2 { color: #1F2937; font-size: 18px; margin-top: 32px; margin-bottom: 12px; }
        .subtitle { color: #6B7280; font-size: 14px; margin-bottom: 24px; }
        .headline-box { background: #FEF2F2; border-left: 4px solid #DC2626; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
        .headline-box .tracked { font-size: 16px; color: #6B7280; }
        .headline-box .real { font-size: 28px; font-weight: 700; color: #DC2626; margin: 8px 0; }
        .headline-box .gap { font-size: 14px; color: #991B1B; }
        .inputs { background: #F9FAFB; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 14px; color: #6B7280; }
        .inputs span { color: #1F2937; font-weight: 600; }
        .breakdown { margin: 20px 0; }
        .breakdown-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 14px; }
        .breakdown-row:last-child { border-bottom: none; }
        .breakdown-label { color: #4B5563; }
        .breakdown-pct { color: #9CA3AF; font-size: 12px; }
        .breakdown-value { font-weight: 600; color: #1F2937; }
        .context { background: #F0FDF4; border-left: 4px solid #46AEB8; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0; font-size: 14px; }
        .cta-box { background: #1F2937; color: white; padding: 24px; border-radius: 8px; margin: 32px 0; text-align: center; }
        .cta-box p { color: rgba(255,255,255,0.8); font-size: 14px; margin-bottom: 16px; }
        .cta-button { display: inline-block; background: #46AEB8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 13px; color: #9CA3AF; }
    </style>
</head>
<body>
    <h1>Your Turnover Cost Report</h1>
    <p class="subtitle">Generated for ${email}</p>

    <div class="inputs">
        <span>${employees.toLocaleString()}</span> employees &middot;
        <span>${formatDollars(avgSalary)}</span> avg salary &middot;
        <span>${turnoverRate}%</span> turnover rate &middot;
        <span>${departures}</span> departures/year
    </div>

    <div class="headline-box">
        <div class="tracked">You're probably tracking: ${formatDollars(trackedCost)}</div>
        <div class="real">The real number: ${formatDollars(totalCost)}</div>
        <div class="gap">Hidden cost gap: ${formatDollars(gapCost)}</div>
    </div>

    <h2>Where the money goes</h2>
    <p style="font-size: 14px; color: #6B7280; margin-bottom: 4px;">Based on ${departures} departures at ${formatDollars(costPerDeparture)} each</p>

    <div class="breakdown">
        <div class="breakdown-row">
            <span><span class="breakdown-label">Replacement costs</span> <span class="breakdown-pct">(30%)</span></span>
            <span class="breakdown-value">${formatDollars(bdReplace)}</span>
        </div>
        <div class="breakdown-row">
            <span><span class="breakdown-label">Productivity loss</span> <span class="breakdown-pct">(25%)</span></span>
            <span class="breakdown-value">${formatDollars(bdProductivity)}</span>
        </div>
        <div class="breakdown-row">
            <span><span class="breakdown-label">Knowledge drain</span> <span class="breakdown-pct">(20%)</span></span>
            <span class="breakdown-value">${formatDollars(bdKnowledge)}</span>
        </div>
        <div class="breakdown-row">
            <span><span class="breakdown-label">Team disruption</span> <span class="breakdown-pct">(15%)</span></span>
            <span class="breakdown-value">${formatDollars(bdDisruption)}</span>
        </div>
        <div class="breakdown-row">
            <span><span class="breakdown-label">Ripple effect</span> <span class="breakdown-pct">(10%)</span></span>
            <span class="breakdown-value">${formatDollars(bdRipple)}</span>
        </div>
    </div>

    <div class="context">
        <strong>What this means:</strong> Most companies track direct replacement costs only, which is roughly 25% of the real impact. The remaining 75% is invisible: lost productivity during vacancy, institutional knowledge that walks out the door, disruption to the team left behind, and the ripple effect when remaining employees reconsider their own position.
    </div>

    <div class="context" style="background: #FFF7ED; border-color: #E07A5F;">
        <strong>The 4x rule:</strong> For every dollar you're tracking in turnover costs, three more are hiding in places your finance team doesn't measure. At ${formatDollars(gapCost)} in hidden costs, that's ${formatDollars(Math.round(gapCost / 12))}/month you're losing without seeing it.
    </div>

    <div class="cta-box">
        <p>These are estimates. Your actual situation has variables a calculator can't capture.</p>
        <a href="https://cloverera.com/talk/" class="cta-button">Schedule Your Free Turnover Analysis</a>
    </div>

    <div class="footer">
        <p>Clover ERA | <a href="https://cloverera.com" style="color: #46AEB8;">cloverera.com</a></p>
        <p>You received this because you requested a turnover cost report.</p>
    </div>
</body>
</html>`;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { email, employees, avgSalary, turnoverRate, totalCost, trackedCost, gapCost, departures, costPerDeparture, bdReplace, bdProductivity, bdKnowledge, bdDisruption, bdRipple } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        const cleanEmail = email.toLowerCase().trim();
        const RESEND_API_KEY = process.env.RESEND_API_KEY;

        if (!RESEND_API_KEY) {
            return res.status(500).json({ error: 'Email service not configured' });
        }

        // Send email via Resend
        const html = generateReportHtml({
            email: cleanEmail,
            employees: employees || 250,
            avgSalary: avgSalary || 75000,
            turnoverRate: turnoverRate || 15,
            totalCost: totalCost || 0,
            trackedCost: trackedCost || 0,
            gapCost: gapCost || 0,
            departures: departures || 0,
            costPerDeparture: costPerDeparture || 0,
            bdReplace: bdReplace || 0,
            bdProductivity: bdProductivity || 0,
            bdKnowledge: bdKnowledge || 0,
            bdDisruption: bdDisruption || 0,
            bdRipple: bdRipple || 0
        });

        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Clive Hays <clive.hays@cloverera.com>',
                to: cleanEmail,
                subject: `Your Turnover Cost Report: ${formatDollars(totalCost || 0)} per year`,
                html: html
            })
        });

        const emailResult = await emailResponse.json();

        if (!emailResponse.ok) {
            console.error('Resend error:', emailResult);
            return res.status(500).json({ error: 'Failed to send email', detail: emailResult });
        }

        console.log('Calculator report sent to:', cleanEmail, 'Resend ID:', emailResult.id);

        // Save lead to dm_contacts
        try {
            const db = getSupabase();
            const ownerId = await getOwnerUserId(db);
            if (ownerId) {
                const now = new Date().toISOString();
                const today = now.split('T')[0];

                const noteText = `CALCULATOR REPORT\nEmployees: ${employees}\nAvg Salary: ${formatDollars(avgSalary || 75000)}\nTurnover Rate: ${turnoverRate}%\nTotal Cost: ${formatDollars(totalCost || 0)}\nHidden Gap: ${formatDollars(gapCost || 0)}\nEmail: ${cleanEmail}`;

                const { data: existing } = await db
                    .from('dm_contacts')
                    .select('id, notes, activity_log')
                    .eq('user_id', ownerId)
                    .ilike('notes', `%${cleanEmail}%`)
                    .maybeSingle();

                if (existing) {
                    const updatedLog = existing.activity_log || [];
                    updatedLog.push({ date: now, text: `Requested Calculator Report - Total Cost: ${formatDollars(totalCost || 0)}` });
                    await db.from('dm_contacts').update({
                        notes: existing.notes + '\n\n---\n' + noteText,
                        activity_log: updatedLog,
                        updated_at: now
                    }).eq('id', existing.id);
                } else {
                    await db.from('dm_contacts').insert({
                        user_id: ownerId,
                        first_name: cleanEmail.split('@')[0],
                        last_name: null,
                        company: null,
                        source: 'post-comment',
                        stage: 'new',
                        source_post: 'Calculator Report',
                        their_message: `Turnover cost: ${formatDollars(totalCost || 0)} (${employees} employees)`,
                        next_action: 'Follow up on calculator report',
                        due_date: today,
                        notes: noteText,
                        activity_log: [{ date: now, text: `Requested Calculator Report - Total Cost: ${formatDollars(totalCost || 0)}` }],
                        last_contact_date: now,
                        created_at: now,
                        updated_at: now
                    });
                }
            }
        } catch (dbError) {
            console.error('DM contact save error (non-fatal):', dbError.message);
        }

        return res.status(200).json({ success: true, message: 'Report sent' });

    } catch (error) {
        console.error('Calculator report error:', error.message || error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
