// API Route: Book Waitlist Final Email (Feb 17, 2026)
// Triggered by Vercel Cron: 0 14 17 2 *

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

// Amazon link - UPDATE THIS when the book is listed
const AMAZON_LINK = 'https://www.amazon.com/dp/BOOK_ASIN_HERE';

function generateFinalEmailHtml(firstName) {
    return `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .gift-box { background: #F0FDF4; border: 1px solid #86EFAC; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .pricing { background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .pricing ul { margin: 10px 0; padding-left: 20px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 14px; color: #6B7280; }
    </style>
</head>
<body>
    <p>Hi ${firstName},</p>

    <p>If you've already ordered Already Gone, thank you so much. It means a lot.</p>

    <div class="gift-box">
        <p>As a token of appreciation, I wanted to give you something extra: <strong>free access to our Turnover Cost Calculator and Business Case Builder.</strong></p>

        <p>It's the tool I wish I'd had when I was making the case for retention investments. Plug in your numbers, see what turnover is actually costing you (not what finance tracks), and get a CFO-ready one-pager.</p>

        <p><a href="https://cloverera.com/business-case/">Use it here →</a></p>
    </div>

    <p>If you haven't ordered yet, just a heads up: the launch price ends tomorrow.</p>

    <div class="pricing">
        <p><strong>After February 18:</strong></p>
        <ul>
            <li>Kindle goes from $4.99 to $9.99</li>
            <li>Hardcover goes from $9.99 to $15.99</li>
        </ul>
    </div>

    <a href="${AMAZON_LINK}" class="button">Get the Book - 24 Hours Left</a>

    <p>Either way, thank you for being on this list.</p>

    <p>Clive</p>

    <div class="footer">
        <p>Clive Hays<br>Co-Founder, Clover ERA<br><a href="https://cloverera.com">cloverera.com</a></p>
    </div>
</body>
</html>`;
}

function generateFinalEmailText(firstName) {
    return `Hi ${firstName},

If you've already ordered Already Gone, thank you so much. It means a lot.

As a token of appreciation, I wanted to give you something extra: free access to our Turnover Cost Calculator and Business Case Builder.

It's the tool I wish I'd had when I was making the case for retention investments. Plug in your numbers, see what turnover is actually costing you (not what finance tracks), and get a CFO-ready one-pager.

Use it here: https://cloverera.com/business-case/

If you haven't ordered yet, just a heads up: the launch price ends tomorrow.

After February 18:
- Kindle goes from $4.99 to $9.99
- Hardcover goes from $9.99 to $15.99

Get the book (24 hours left): ${AMAZON_LINK}

Either way, thank you for being on this list.

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

        // Fetch all waitlist subscribers who haven't received final email
        const { data: subscribers, error: fetchError } = await supabase
            .from('book_waitlist')
            .select('id, email, first_name')
            .eq('book_slug', 'already-gone')
            .in('status', ['confirmed', 'pending'])
            .or('final_email_sent.is.null,final_email_sent.eq.false');

        if (fetchError) {
            console.error('Error fetching subscribers:', fetchError);
            return res.status(500).json({ error: 'Failed to fetch subscribers' });
        }

        console.log(`Found ${subscribers?.length || 0} subscribers to send final email`);

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
                        subject: '24 hours left - and a thank you gift',
                        html: generateFinalEmailHtml(subscriber.first_name),
                        text: generateFinalEmailText(subscriber.first_name),
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
                    .update({ final_email_sent: true, final_email_sent_at: new Date().toISOString() })
                    .eq('id', subscriber.id);

                sent++;
                console.log(`Final email sent to ${subscriber.email}`);
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
        console.error('Final email batch error:', error);
        return res.status(500).json({ error: 'Failed to send emails', details: error.message });
    }
}
