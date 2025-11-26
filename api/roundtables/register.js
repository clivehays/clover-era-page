// API Route: Register for a roundtable
// POST /api/roundtables/register

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Import email sending utilities
import { sendConfirmationEmail } from '../../utils/email';
import { createZoomMeeting } from '../../utils/zoom';

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
        const { roundtable_id, name, email, phone, company, role, is_waitlist } = req.body;

        // Validate required fields
        if (!roundtable_id || !name || !email || !phone || !company || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        // Get roundtable details
        const { data: roundtable, error: rtError } = await supabase
            .from('roundtables')
            .select('*')
            .eq('id', roundtable_id)
            .single();

        if (rtError || !roundtable) {
            return res.status(404).json({ error: 'Roundtable not found' });
        }

        // Check if registration is still open (2 hours before)
        const now = new Date();
        const sessionDate = new Date(roundtable.scheduled_at);
        const twoHoursBefore = new Date(sessionDate.getTime() - (2 * 60 * 60 * 1000));

        if (now >= twoHoursBefore) {
            return res.status(400).json({ error: 'Registration has closed for this session' });
        }

        // Check current registration count
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('id')
            .eq('roundtable_id', roundtable_id)
            .eq('is_waitlist', false)
            .in('status', ['confirmed', 'attended']);

        if (regError) {
            console.error('Error checking registrations:', regError);
            return res.status(500).json({ error: 'Failed to check registration status' });
        }

        const currentCount = registrations.length;
        const shouldBeWaitlist = is_waitlist || currentCount >= roundtable.max_participants;

        // Check for duplicate registration
        const { data: existingReg } = await supabase
            .from('registrations')
            .select('id')
            .eq('roundtable_id', roundtable_id)
            .eq('email', email.toLowerCase())
            .single();

        if (existingReg) {
            return res.status(400).json({ error: 'You are already registered for this session' });
        }

        // Create registration
        const { data: registration, error: insertError } = await supabase
            .from('registrations')
            .insert({
                roundtable_id,
                name,
                email: email.toLowerCase(),
                phone,
                company,
                role,
                is_waitlist: shouldBeWaitlist,
                status: 'confirmed'
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating registration:', insertError);
            return res.status(500).json({ error: 'Failed to create registration' });
        }

        // If not waitlist, ensure Zoom meeting exists
        if (!shouldBeWaitlist && !roundtable.zoom_meeting_id) {
            try {
                const zoomMeeting = await createZoomMeeting(roundtable);

                // Update roundtable with Zoom details
                await supabase
                    .from('roundtables')
                    .update({
                        zoom_meeting_id: zoomMeeting.id,
                        zoom_join_url: zoomMeeting.join_url,
                        zoom_host_url: zoomMeeting.start_url
                    })
                    .eq('id', roundtable_id);

                roundtable.zoom_join_url = zoomMeeting.join_url;
            } catch (zoomError) {
                console.error('Error creating Zoom meeting:', zoomError);
                // Continue even if Zoom fails - can be added manually later
            }
        }

        // Send confirmation email
        try {
            await sendConfirmationEmail({
                registration,
                roundtable,
                isWaitlist: shouldBeWaitlist
            });

            // Mark confirmation as sent
            await supabase
                .from('registrations')
                .update({ confirmation_sent: true })
                .eq('id', registration.id);

        } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
            // Don't fail the registration if email fails
        }

        return res.status(201).json({
            success: true,
            registration_id: registration.id,
            is_waitlist: shouldBeWaitlist,
            message: shouldBeWaitlist
                ? 'You have been added to the waitlist'
                : 'Registration successful'
        });

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
