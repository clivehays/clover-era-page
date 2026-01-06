// API Route: Book Waitlist Registration
// POST /api/book-waitlist

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Send confirmation email via Resend
async function sendConfirmationEmail(firstName, email) {
    if (!RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not configured, skipping email');
        return false;
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Clive Hays <clive.hays@cloverera.com>',
                to: email,
                subject: "You're on the Already Gone waitlist",
                text: `${firstName} -

You're on the list for "Already Gone: Why Your Best People Leave Before You See It Coming."

The book launches January 28, 2026.

As a waitlist member, you'll get:
- Early access to read the book before it hits Amazon
- The Signals Checklist: 20 warning signs most managers miss
- Launch day notification

Thanks for your interest. More soon.

Clive & Neil Hays

---
Clover ERA | cloverera.com
`,
                reply_to: 'clive.hays@cloverera.com',
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Resend API error:', errorText);
            return false;
        }

        const result = await response.json();
        console.log('Confirmation email sent:', result.id);
        return true;
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        return false;
    }
}

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            firstName,
            email,
            bookSlug = 'already-gone',
            source = 'website',
            utmSource,
            utmMedium,
            utmCampaign
        } = req.body;

        // Validate required fields
        if (!firstName || !email) {
            return res.status(400).json({ error: 'First name and email are required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        // Sanitize inputs
        const cleanEmail = email.toLowerCase().trim();
        const cleanFirstName = firstName.trim().substring(0, 100);

        // Get IP and user agent for tracking
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] ||
                          req.headers['x-real-ip'] ||
                          req.connection?.remoteAddress ||
                          null;
        const userAgent = req.headers['user-agent'] || null;

        // Check for existing signup
        const { data: existing } = await supabase
            .from('book_waitlist')
            .select('id, status')
            .eq('email', cleanEmail)
            .eq('book_slug', bookSlug)
            .single();

        if (existing) {
            // Already signed up
            if (existing.status === 'unsubscribed') {
                // Re-subscribe them
                await supabase
                    .from('book_waitlist')
                    .update({ status: 'pending' })
                    .eq('id', existing.id);

                return res.status(200).json({
                    success: true,
                    message: 'Welcome back! You have been re-added to the waitlist.'
                });
            }

            return res.status(200).json({
                success: true,
                message: "You're already on the list!"
            });
        }

        // Insert new signup
        const { data: signup, error: insertError } = await supabase
            .from('book_waitlist')
            .insert({
                email: cleanEmail,
                first_name: cleanFirstName,
                book_slug: bookSlug,
                source: source,
                utm_source: utmSource || null,
                utm_medium: utmMedium || null,
                utm_campaign: utmCampaign || null,
                ip_address: ipAddress,
                user_agent: userAgent,
                status: 'pending'
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating waitlist signup:', insertError);
            return res.status(500).json({ error: 'Failed to join waitlist' });
        }

        // Send confirmation email (don't fail if email fails)
        const emailSent = await sendConfirmationEmail(cleanFirstName, cleanEmail);

        // Update status to confirmed if email sent
        if (emailSent) {
            await supabase
                .from('book_waitlist')
                .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
                .eq('id', signup.id);
        }

        return res.status(201).json({
            success: true,
            message: emailSent
                ? "You're on the list. Check your inbox for confirmation."
                : "You're on the list!"
        });

    } catch (error) {
        console.error('Waitlist signup error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
