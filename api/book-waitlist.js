// API Route: Book Waitlist Registration
// POST /api/book-waitlist

import { createClient } from '@supabase/supabase-js';

// Lazy initialization to avoid issues with env vars at module load
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

// PDF URL for the 12 Early Warning Signals document
const PDF_URL = 'https://cloverera.com/public/downloads/12-early-warning-signals.pdf';

// Fetch PDF and convert to base64
async function fetchPdfAsBase64() {
    try {
        console.log('Fetching PDF from:', PDF_URL);
        const response = await fetch(PDF_URL);

        if (!response.ok) {
            console.error('Failed to fetch PDF:', response.status);
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        console.log('PDF fetched successfully, size:', buffer.length, 'bytes');
        return base64;
    } catch (error) {
        console.error('Error fetching PDF:', error.message);
        return null;
    }
}

// Send confirmation email via Resend
async function sendConfirmationEmail(firstName, email) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    console.log('=== EMAIL SEND ATTEMPT ===');
    console.log('Recipient:', email);
    console.log('First name:', firstName);
    console.log('RESEND_API_KEY exists:', !!RESEND_API_KEY);

    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY not configured - env var is missing');
        return { sent: false, error: 'RESEND_API_KEY not configured' };
    }

    try {
        // Fetch PDF for attachment
        const pdfBase64 = await fetchPdfAsBase64();

        // Build email payload
        // Note: Using clive.hays@cloverera.com as it's verified with Resend
        const emailPayload = {
            from: 'Clive Hays <clive.hays@cloverera.com>',
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
            reply_to: 'clive.hays@cloverera.com',
        };

        // Add PDF attachment if available
        if (pdfBase64) {
            emailPayload.attachments = [
                {
                    filename: '12-Early-Warning-Signals.pdf',
                    content: pdfBase64,
                }
            ];
            console.log('PDF attachment added');
        } else {
            console.log('Sending email without PDF attachment');
        }

        console.log('Calling Resend API...');

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload),
        });

        console.log('Resend API response status:', response.status);

        const responseText = await response.text();
        console.log('Resend API response body:', responseText);

        if (!response.ok) {
            console.error('Resend API error - status:', response.status);
            return { sent: false, error: `Resend API error: ${response.status} - ${responseText}` };
        }

        const result = JSON.parse(responseText);
        console.log('Email sent successfully, ID:', result.id);
        return { sent: true, emailId: result.id, hasAttachment: !!pdfBase64 };
    } catch (error) {
        console.error('Exception in sendConfirmationEmail:', error.message);
        console.error('Stack:', error.stack);
        return { sent: false, error: error.message };
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

        const supabase = getSupabase();

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
        console.log('About to send confirmation email...');
        const emailResult = await sendConfirmationEmail(cleanFirstName, cleanEmail);
        console.log('Email result:', JSON.stringify(emailResult));

        // Update status to confirmed if email sent
        if (emailResult.sent) {
            await supabase
                .from('book_waitlist')
                .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
                .eq('id', signup.id);
        }

        return res.status(201).json({
            success: true,
            message: emailResult.sent
                ? "You're on the list. Check your inbox - the 12 Early Warning Signals PDF is on its way."
                : "You're on the list!",
            // Include debug info temporarily
            _debug: {
                emailSent: emailResult.sent,
                emailError: emailResult.error || null,
                emailId: emailResult.emailId || null
            }
        });

    } catch (error) {
        console.error('Waitlist signup error:', error.message || error);
        console.error('Full error:', JSON.stringify(error, null, 2));
        return res.status(500).json({ error: 'Internal server error' });
    }
}
