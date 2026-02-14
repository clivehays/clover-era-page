// API Route: Book Waitlist Gift Email (Feb 8, 2026)
// Triggered by Vercel Cron: 0 14 8 2 *

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

function generateGiftEmailHtml(firstName) {
    return `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; background: #46AEB8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 14px; color: #6B7280; }
    </style>
</head>
<body>
    <p>Hi ${firstName},</p>

    <p>The book launches in 2 days. But I wanted to give you something now.</p>

    <p><strong>Free access to our Team Health Assessment</strong></p>

    <p>6 questions. 5 minutes. Uncomfortably accurate.</p>

    <p>It shows you what's really happening on your team - the patterns most managers miss until someone resigns.</p>

    <a href="https://cloverera.com/assessment/" class="button">Take the Assessment</a>

    <p>Think of it as a companion to the book. The assessment shows you where to look. The book explains what you're seeing.</p>

    <p>See you on February 11.</p>

    <p>Clive</p>

    <div class="footer">
        <p>Clive Hays<br>Co-Founder, Clover ERA<br><a href="https://cloverera.com">cloverera.com</a></p>
    </div>
</body>
</html>`;
}

function generateGiftEmailText(firstName) {
    return `Hi ${firstName},

The book launches in 2 days. But I wanted to give you something now.

Free access to our Team Health Assessment

6 questions. 5 minutes. Uncomfortably accurate.

It shows you what's really happening on your team - the patterns most managers miss until someone resigns.

Take it here: https://cloverera.com/assessment/

Think of it as a companion to the book. The assessment shows you where to look. The book explains what you're seeing.

See you on February 11.

Clive

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
        // Also allow manual trigger with admin key for testing
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

        // Fetch all waitlist subscribers who haven't received gift email
        const { data: subscribers, error: fetchError } = await supabase
            .from('book_waitlist')
            .select('id, email, first_name')
            .eq('book_slug', 'already-gone')
            .in('status', ['confirmed', 'pending'])
            .or('gift_email_sent.is.null,gift_email_sent.eq.false');

        if (fetchError) {
            console.error('Error fetching subscribers:', fetchError);
            return res.status(500).json({ error: 'Failed to fetch subscribers' });
        }

        console.log(`Found ${subscribers?.length || 0} subscribers to send gift email`);

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
                        subject: 'A gift before the book launches (2 days early)',
                        html: generateGiftEmailHtml(subscriber.first_name),
                        text: generateGiftEmailText(subscriber.first_name),
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
                    .update({ gift_email_sent: true, gift_email_sent_at: new Date().toISOString() })
                    .eq('id', subscriber.id);

                sent++;
                console.log(`Gift email sent to ${subscriber.email}`);
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
        console.error('Gift email batch error:', error);
        return res.status(500).json({ error: 'Failed to send emails', details: error.message });
    }
}
