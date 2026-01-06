// API Route: Book Waitlist Registration
// POST /api/book-waitlist

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Get PDF attachment as base64
function getPdfAttachment() {
    try {
        // PDF should be in /public/downloads/12-early-warning-signals.pdf
        const pdfPath = join(process.cwd(), 'public', 'downloads', '12-early-warning-signals.pdf');
        const pdfBuffer = readFileSync(pdfPath);
        return pdfBuffer.toString('base64');
    } catch (error) {
        console.error('Error reading PDF attachment:', error);
        return null;
    }
}

// Send confirmation email via Resend with PDF attachment
async function sendConfirmationEmail(firstName, email) {
    if (!RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not configured, skipping email');
        return false;
    }

    try {
        // Build email payload
        const emailPayload = {
            from: 'Clive Hays <contact@cloverera.com>',
            to: email,
            subject: 'Your 12 Early Warning Signals PDF',
            text: `Hi ${firstName},

Thanks for joining the Already Gone waitlist.

Attached is the PDF I promised: 12 Early Warning Signals Your Employee Is About to Leave.

Takes about 3 minutes to read. You'll probably recognise a few of these from your own team.

The full book launches January 28. You'll hear from me a few days before with early access - you'll be able to read it before it hits Amazon.

Until then, if any of those 12 signals hit close to home and you want to talk through what you're seeing, just reply to this email.

Clive

--
Clive Hays
Co-Founder, Clover ERA
cloverera.com
`,
            reply_to: 'contact@cloverera.com',
        };

        // Try to attach PDF if available
        const pdfBase64 = getPdfAttachment();
        if (pdfBase64) {
            emailPayload.attachments = [
                {
                    filename: '12-early-warning-signals.pdf',
                    content: pdfBase64,
                }
            ];
        } else {
            console.warn('PDF attachment not found, sending email without attachment');
        }

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload),
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
                ? "You're on the list. Check your inbox - the 12 Early Warning Signals PDF is on its way."
                : "You're on the list!"
        });

    } catch (error) {
        console.error('Waitlist signup error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
