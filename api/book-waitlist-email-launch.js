// API Route: Book Waitlist Launch Email (Feb 11, 2026)
// Triggered by Vercel Cron: 0 13 11 2 *

import { createClient } from '@supabase/supabase-js';

// Lazy initialization
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

// Amazon links - UPDATE THESE when the book is listed
const KINDLE_LINK = 'https://www.amazon.com/dp/KINDLE_ASIN_HERE';
const HARDCOVER_LINK = 'https://www.amazon.com/dp/HARDCOVER_ASIN_HERE';

function generateLaunchEmailHtml(firstName) {
    return `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 10px 10px 0; }
        .button-secondary { background: #1F2937; }
        .pricing { background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .pricing ul { margin: 10px 0; padding-left: 20px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 14px; color: #6B7280; }
    </style>
</head>
<body>
    <p>Hi ${firstName},</p>

    <p>It's here.</p>

    <p><strong>Already Gone: Why Your Best People Leave Before You See It Coming</strong></p>

    <p>78 short entries. No fluff. No corporate frameworks. Just the patterns behind unexpected resignations.</p>

    <div class="pricing">
        <p><strong>Your waitlist pricing (ends February 18):</strong></p>
        <ul>
            <li>Kindle: $4.99 (then $9.99)</li>
            <li>Hardcover: $9.99 (then $15.99)</li>
        </ul>
    </div>

    <p>
        <a href="${KINDLE_LINK}" class="button">Buy Kindle - $4.99</a>
        <a href="${HARDCOVER_LINK}" class="button button-secondary">Buy Hardcover - $9.99</a>
    </p>

    <p>This book started as notes I kept after watching the same story repeat across dozens of companies. Someone leaves. Everyone's shocked. But the signs were there for months.</p>

    <p>I wrote it so you can see what I've seen - before it costs you someone you can't afford to lose.</p>

    <p>Thank you for being on this waitlist from the beginning.</p>

    <p>Clive</p>

    <p><em>P.S. - If you read it and find it useful, a review on Amazon helps more than you know.</em></p>

    <div class="footer">
        <p>Clive Hays<br>Co-Founder, Clover ERA<br><a href="https://cloverera.com">cloverera.com</a></p>
    </div>
</body>
</html>`;
}

function generateLaunchEmailText(firstName) {
    return `Hi ${firstName},

It's here.

Already Gone: Why Your Best People Leave Before You See It Coming

78 short entries. No fluff. No corporate frameworks. Just the patterns behind unexpected resignations.

Your waitlist pricing (ends February 18):
- Kindle: $4.99 (then $9.99)
- Hardcover: $9.99 (then $15.99)

Buy Kindle: ${KINDLE_LINK}
Buy Hardcover: ${HARDCOVER_LINK}

This book started as notes I kept after watching the same story repeat across dozens of companies. Someone leaves. Everyone's shocked. But the signs were there for months.

I wrote it so you can see what I've seen - before it costs you someone you can't afford to lose.

Thank you for being on this waitlist from the beginning.

Clive

P.S. - If you read it and find it useful, a review on Amazon helps more than you know.

--
Clive Hays
Co-Founder, Clover ERA
cloverera.com
`;
}

export default async function handler(req, res) {
    // Verify cron authorization
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        if (req.query.key !== process.env.ADMIN_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }

    try {
        const supabase = getSupabase();
        const RESEND_API_KEY = process.env.RESEND_API_KEY;

        if (!RESEND_API_KEY) {
            return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
        }

        // Fetch all waitlist subscribers who haven't received launch email
        const { data: subscribers, error: fetchError } = await supabase
            .from('book_waitlist')
            .select('id, email, first_name')
            .eq('book_slug', 'already-gone')
            .in('status', ['confirmed', 'pending'])
            .or('launch_email_sent.is.null,launch_email_sent.eq.false');

        if (fetchError) {
            console.error('Error fetching subscribers:', fetchError);
            return res.status(500).json({ error: 'Failed to fetch subscribers' });
        }

        console.log(`Found ${subscribers?.length || 0} subscribers to send launch email`);

        let sent = 0;
        let failed = 0;
        const errors = [];

        // Helper to add delay between sends (avoid rate limit: 2 req/sec)
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        for (const subscriber of subscribers || []) {
            try {
                // Rate limit: wait 600ms between sends
                if (sent > 0 || failed > 0) {
                    await delay(600);
                }

                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'Clive Hays <clive.hays@cloverera.com>',
                        to: subscriber.email,
                        subject: 'Already Gone is live - your early access link',
                        html: generateLaunchEmailHtml(subscriber.first_name),
                        text: generateLaunchEmailText(subscriber.first_name),
                        reply_to: 'clive.hays@cloverera.com'
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Resend API error: ${response.status} - ${errorText}`);
                }

                // Mark as sent
                await supabase
                    .from('book_waitlist')
                    .update({ launch_email_sent: true, launch_email_sent_at: new Date().toISOString() })
                    .eq('id', subscriber.id);

                sent++;
                console.log(`Launch email sent to ${subscriber.email}`);
            } catch (error) {
                console.error(`Failed to send to ${subscriber.email}:`, error.message);
                errors.push({ email: subscriber.email, error: error.message });
                failed++;
            }
        }

        return res.status(200).json({
            success: true,
            sent,
            failed,
            total: subscribers?.length || 0,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Launch email batch error:', error);
        return res.status(500).json({ error: 'Failed to send emails', details: error.message });
    }
}
