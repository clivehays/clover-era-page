// API Route: Test Book Waitlist Emails
// Send all 4 scheduled emails to a test address for preview
// Usage: /api/book-waitlist-test-emails?email=test@example.com&key=ADMIN_KEY

export default async function handler(req, res) {
    // Require admin key
    if (req.query.key !== process.env.ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized - add ?key=ADMIN_KEY' });
    }

    const testEmail = req.query.email;
    const firstName = req.query.name || 'Clive';

    if (!testEmail) {
        return res.status(400).json({ error: 'Missing email parameter' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
        return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
    }

    const PDF_URL = 'https://cloverera.com/public/downloads/12-early-warning-signals.pdf';
    const KINDLE_LINK = 'https://www.amazon.com/dp/KINDLE_ASIN_HERE';
    const HARDCOVER_LINK = 'https://www.amazon.com/dp/HARDCOVER_ASIN_HERE';
    const AMAZON_LINK = 'https://www.amazon.com/dp/BOOK_ASIN_HERE';

    const emails = [
        {
            name: 'Welcome Email',
            subject: '[TEST] Your 12 Early Warning Signals PDF is here',
            html: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 14px; color: #6B7280; }
    </style>
</head>
<body>
    <p>Hi ${firstName},</p>

    <p>Thanks for joining the Already Gone waitlist.</p>

    <p>As promised, here's your free PDF: <strong>12 Early Warning Signals Your Employee Is About to Leave</strong></p>

    <a href="${PDF_URL}" class="button">Download PDF</a>

    <p>This is the checklist I wish every manager had. The signals are there. Most people just don't know what to look for.</p>

    <p>The book launches January 28. You'll be the first to know when it goes live.</p>

    <p>Talk soon,</p>

    <p>Clive</p>

    <p><em>P.S. - Waitlist members get launch week pricing: Kindle $4.99 (then $9.99), Hardcover $9.99 (then $15.99). Price goes up February 4.</em></p>

    <div class="footer">
        <p>Clive Hays<br>Co-Founder, Clover ERA<br><a href="https://cloverera.com">cloverera.com</a></p>
    </div>
</body>
</html>`
        },
        {
            name: 'Gift Email (Jan 26)',
            subject: '[TEST] A gift before the book launches (2 days early)',
            html: `<!DOCTYPE html>
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

    <a href="https://cloverera.com/team-health/" class="button">Take the Assessment</a>

    <p>Think of it as a companion to the book. The assessment shows you where to look. The book explains what you're seeing.</p>

    <p>See you on January 28.</p>

    <p>Clive</p>

    <div class="footer">
        <p>Clive Hays<br>Co-Founder, Clover ERA<br><a href="https://cloverera.com">cloverera.com</a></p>
    </div>
</body>
</html>`
        },
        {
            name: 'Launch Email (Jan 28)',
            subject: '[TEST] Already Gone is live - your early access link',
            html: `<!DOCTYPE html>
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
        <p><strong>Your waitlist pricing (ends February 4):</strong></p>
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
</html>`
        },
        {
            name: 'Reminder Email (Jan 31)',
            subject: '[TEST] Launch pricing ends in 4 days',
            html: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .pricing { background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .pricing ul { margin: 10px 0; padding-left: 20px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 14px; color: #6B7280; }
    </style>
</head>
<body>
    <p>Hi ${firstName},</p>

    <p>Quick note.</p>

    <p>If you've already ordered Already Gone - thank you so much. It means a lot.</p>

    <p>If not, just a reminder: the launch price ends on February 4.</p>

    <div class="pricing">
        <p>After that:</p>
        <ul>
            <li>Kindle goes from $4.99 to $9.99</li>
            <li>Hardcover goes from $9.99 to $15.99</li>
        </ul>
    </div>

    <a href="${AMAZON_LINK}" class="button">Get the Book</a>

    <p>Either way, thanks for being here.</p>

    <p>Clive</p>

    <div class="footer">
        <p>Clive Hays<br>Co-Founder, Clover ERA<br><a href="https://cloverera.com">cloverera.com</a></p>
    </div>
</body>
</html>`
        },
        {
            name: 'Final Email (Feb 3)',
            subject: '[TEST] 24 hours left - and a thank you gift',
            html: `<!DOCTYPE html>
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
        <p><strong>After February 4:</strong></p>
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
</html>`
        }
    ];

    const results = [];

    for (const email of emails) {
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'Clive Hays <clive.hays@cloverera.com>',
                    to: testEmail,
                    subject: email.subject,
                    html: email.html,
                    reply_to: 'clive.hays@cloverera.com'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                results.push({ name: email.name, success: false, error: errorText });
            } else {
                const data = await response.json();
                results.push({ name: email.name, success: true, id: data.id });
            }
        } catch (error) {
            results.push({ name: email.name, success: false, error: error.message });
        }
    }

    return res.status(200).json({
        message: `Sent ${results.filter(r => r.success).length} of ${emails.length} test emails to ${testEmail}`,
        results
    });
}
