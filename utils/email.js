// Email utility functions using SendGrid

import sgMail from '@sendgrid/mail';
import { createCalendarInvite } from './calendar';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = 'contact@cloverera.com';
const FROM_NAME = 'Clive Hays - Clover ERA';

/**
 * Send confirmation email with calendar invite
 */
export async function sendConfirmationEmail({ registration, roundtable, isWaitlist }) {
    const date = new Date(roundtable.scheduled_at);

    const subject = isWaitlist
        ? `Waitlist Confirmation: ${roundtable.topic}`
        : `You're Registered: ${roundtable.topic}`;

    let htmlContent, textContent;

    if (isWaitlist) {
        // Waitlist email
        htmlContent = generateWaitlistEmailHTML(registration, roundtable, date);
        textContent = generateWaitlistEmailText(registration, roundtable, date);

        const msg = {
            to: registration.email,
            from: {
                email: FROM_EMAIL,
                name: FROM_NAME
            },
            subject,
            text: textContent,
            html: htmlContent
        };

        await sgMail.send(msg);

    } else {
        // Confirmed registration email with calendar invite
        htmlContent = generateConfirmationEmailHTML(registration, roundtable, date);
        textContent = generateConfirmationEmailText(registration, roundtable, date);

        // Create calendar invite
        const calendarInvite = createCalendarInvite(roundtable, registration);

        const msg = {
            to: registration.email,
            from: {
                email: FROM_EMAIL,
                name: FROM_NAME
            },
            subject,
            text: textContent,
            html: htmlContent,
            attachments: [
                {
                    content: Buffer.from(calendarInvite).toString('base64'),
                    filename: 'manager-roundtable.ics',
                    type: 'text/calendar',
                    disposition: 'attachment'
                }
            ]
        };

        await sgMail.send(msg);
    }
}

/**
 * Send reminder email 24 hours before the session
 */
export async function sendReminderEmail({ registration, roundtable }) {
    const date = new Date(roundtable.scheduled_at);

    const subject = `Reminder: Manager Roundtable Tomorrow - ${roundtable.topic}`;
    const htmlContent = generateReminderEmailHTML(registration, roundtable, date);
    const textContent = generateReminderEmailText(registration, roundtable, date);

    const msg = {
        to: registration.email,
        from: {
            email: FROM_EMAIL,
            name: FROM_NAME
        },
        subject,
        text: textContent,
        html: htmlContent
    };

    await sgMail.send(msg);
}

/**
 * Send waitlist promotion email when a spot opens
 */
export async function sendWaitlistPromotionEmail({ registration, roundtable }) {
    const date = new Date(roundtable.scheduled_at);

    const subject = `A Spot Opened Up! ${roundtable.topic}`;
    const htmlContent = generatePromotionEmailHTML(registration, roundtable, date);
    const textContent = generatePromotionEmailText(registration, roundtable, date);

    // Create calendar invite
    const calendarInvite = createCalendarInvite(roundtable, registration);

    const msg = {
        to: registration.email,
        from: {
            email: FROM_EMAIL,
            name: FROM_NAME
        },
        subject,
        text: textContent,
        html: htmlContent,
        attachments: [
            {
                content: Buffer.from(calendarInvite).toString('base64'),
                filename: 'manager-roundtable.ics',
                type: 'text/calendar',
                disposition: 'attachment'
            }
        ]
    };

    await sgMail.send(msg);
}

// ===== HTML EMAIL TEMPLATES =====

function generateConfirmationEmailHTML(registration, roundtable, date) {
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #46AEB8; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #E5E7EB; }
        .session-box { background: #F8F9FA; border-left: 4px solid #46AEB8; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .button { background: #46AEB8; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
        .footer { background: #1F2937; color: rgba(255,255,255,0.7); padding: 20px; text-align: center; font-size: 14px; }
        ul { margin: 15px 0; padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">You're Registered!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Manager Roundtable Session Confirmed</p>
        </div>

        <div class="content">
            <p>Hi ${registration.name},</p>

            <p>Great news! Your spot is confirmed for our upcoming Manager Roundtable session.</p>

            <div class="session-box">
                <h2 style="color: #46AEB8; margin-top: 0;">${roundtable.topic}</h2>
                <p><strong>📅 Date:</strong> ${formattedDate}</p>
                <p><strong>🕐 Time:</strong> ${formattedTime}</p>
                <p><strong>⏱️ Duration:</strong> 30 minutes</p>
                <p><strong>👥 Format:</strong> Small peer group (max 6 managers)</p>
            </div>

            <h3>How to Join</h3>
            <p>We'll be meeting on Zoom. Here's your meeting link:</p>
            <a href="${roundtable.zoom_join_url || '#'}" class="button" style="color: white;">Join Zoom Meeting</a>

            <p style="font-size: 14px; color: #6B7280;">You can also join using the calendar invite attached to this email.</p>

            <h3>What to Prepare</h3>
            <ul>
                <li>Think about your biggest challenge related to ${getTopicContext(roundtable.topic)}</li>
                <li>Prepare any questions you'd like to discuss with fellow managers</li>
                <li>Join 2 minutes early to test your audio/video</li>
                <li>Come ready to share experiences and learn from peers</li>
            </ul>

            <h3>What to Expect</h3>
            <p>This is a peer discussion, not a sales pitch. We'll:</p>
            <ul>
                <li>Share real experiences and challenges</li>
                <li>Discuss neuroscience-backed insights on team management</li>
                <li>Walk away with at least one actionable tactic</li>
                <li>Build connections with fellow managers</li>
            </ul>

            <p><strong>Important:</strong> We'll send you a reminder 24 hours before the session.</p>

            <p>Looking forward to seeing you there!</p>

            <p style="margin-top: 30px;">Best regards,<br>
            <strong>Clive Hays</strong><br>
            Founder, Clover ERA<br>
            <a href="mailto:contact@cloverera.com" style="color: #46AEB8;">contact@cloverera.com</a> | <a href="tel:+12129184448" style="color: #46AEB8;">(212) 918-4448</a></p>
        </div>

        <div class="footer">
            <p>© 2025 Clover ERA | AI-Powered Employee Engagement Platform</p>
            <p><a href="https://cloverera.com" style="color: #46AEB8;">cloverera.com</a></p>
        </div>
    </div>
</body>
</html>
    `;
}

function generateWaitlistEmailHTML(registration, roundtable, date) {
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #F59E0B; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #E5E7EB; }
        .session-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .footer { background: #1F2937; color: rgba(255,255,255,0.7); padding: 20px; text-align: center; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">You're on the Waitlist</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">We'll notify you if a spot opens up</p>
        </div>

        <div class="content">
            <p>Hi ${registration.name},</p>

            <p>Thanks for your interest in our Manager Roundtable session! This session is currently full, but we've added you to the waitlist.</p>

            <div class="session-box">
                <h2 style="color: #D97706; margin-top: 0;">${roundtable.topic}</h2>
                <p><strong>📅 Date:</strong> ${formattedDate}</p>
                <p><strong>🕐 Time:</strong> ${formattedTime}</p>
            </div>

            <h3>What Happens Next?</h3>
            <p>If a spot opens up before the session:</p>
            <ul>
                <li>✅ You'll receive an immediate email notification</li>
                <li>✅ We'll include your Zoom meeting link</li>
                <li>✅ You'll have 2 hours to confirm your attendance</li>
            </ul>

            <h3>Other Options</h3>
            <p>We run these roundtables regularly on rotating topics. <a href="https://cloverera.com/manager-roundtable.html" style="color: #46AEB8;">View upcoming sessions</a> to register for a different date or topic.</p>

            <p style="margin-top: 30px;">We appreciate your interest and hope to see you soon!</p>

            <p style="margin-top: 30px;">Best regards,<br>
            <strong>Clive Hays</strong><br>
            Founder, Clover ERA<br>
            <a href="mailto:contact@cloverera.com" style="color: #46AEB8;">contact@cloverera.com</a></p>
        </div>

        <div class="footer">
            <p>© 2025 Clover ERA | AI-Powered Employee Engagement Platform</p>
            <p><a href="https://cloverera.com" style="color: #46AEB8;">cloverera.com</a></p>
        </div>
    </div>
</body>
</html>
    `;
}

function generateReminderEmailHTML(registration, roundtable, date) {
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0D7C88; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #E5E7EB; }
        .session-box { background: #F0FDFA; border-left: 4px solid #46AEB8; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .button { background: #46AEB8; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
        .footer { background: #1F2937; color: rgba(255,255,255,0.7); padding: 20px; text-align: center; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">⏰ Reminder: Tomorrow!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your Manager Roundtable is in 24 hours</p>
        </div>

        <div class="content">
            <p>Hi ${registration.name},</p>

            <p>Just a friendly reminder that your Manager Roundtable session is <strong>tomorrow</strong>!</p>

            <div class="session-box">
                <h2 style="color: #46AEB8; margin-top: 0;">${roundtable.topic}</h2>
                <p><strong>📅 When:</strong> Tomorrow, ${formattedDate}</p>
                <p><strong>🕐 Time:</strong> ${formattedTime}</p>
                <p><strong>⏱️ Duration:</strong> 30 minutes</p>
            </div>

            <a href="${roundtable.zoom_join_url || '#'}" class="button" style="color: white;">Join Zoom Meeting</a>

            <h3>Quick Preparation</h3>
            <ul>
                <li>Have your biggest ${getTopicContext(roundtable.topic)} challenge in mind</li>
                <li>Prepare 1-2 questions to discuss with the group</li>
                <li>Test your Zoom audio/video beforehand</li>
                <li>Join 2 minutes early to get settled</li>
            </ul>

            <p>See you tomorrow!</p>

            <p style="margin-top: 30px;">Best regards,<br>
            <strong>Clive Hays</strong><br>
            Clover ERA</p>
        </div>

        <div class="footer">
            <p>© 2025 Clover ERA</p>
        </div>
    </div>
</body>
</html>
    `;
}

function generatePromotionEmailHTML(registration, roundtable, date) {
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10B981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #E5E7EB; }
        .session-box { background: #D1FAE5; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .button { background: #10B981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
        .footer { background: #1F2937; color: rgba(255,255,255,0.7); padding: 20px; text-align: center; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🎉 Great News!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">A spot opened up for you!</p>
        </div>

        <div class="content">
            <p>Hi ${registration.name},</p>

            <p>Excellent news! A spot has opened up in the Manager Roundtable session you were waitlisted for, and it's yours!</p>

            <div class="session-box">
                <h2 style="color: #059669; margin-top: 0;">${roundtable.topic}</h2>
                <p><strong>📅 Date:</strong> ${formattedDate}</p>
                <p><strong>🕐 Time:</strong> ${formattedTime}</p>
                <p><strong>⏱️ Duration:</strong> 30 minutes</p>
            </div>

            <p><strong>Your spot is confirmed!</strong> No action needed - you're all set.</p>

            <a href="${roundtable.zoom_join_url || '#'}" class="button" style="color: white;">Join Zoom Meeting</a>

            <p style="font-size: 14px; color: #6B7280;">A calendar invite is attached to this email for your convenience.</p>

            <h3>What to Prepare</h3>
            <ul>
                <li>Think about your biggest challenge related to ${getTopicContext(roundtable.topic)}</li>
                <li>Prepare any questions you'd like to discuss</li>
                <li>Join 2 minutes early to test your setup</li>
            </ul>

            <p>We're excited to have you join us!</p>

            <p style="margin-top: 30px;">Best regards,<br>
            <strong>Clive Hays</strong><br>
            Founder, Clover ERA</p>
        </div>

        <div class="footer">
            <p>© 2025 Clover ERA</p>
        </div>
    </div>
</body>
</html>
    `;
}

// ===== TEXT EMAIL TEMPLATES (for plain text fallback) =====

function generateConfirmationEmailText(registration, roundtable, date) {
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
    });

    return `
You're Registered!
Manager Roundtable Session Confirmed

Hi ${registration.name},

Great news! Your spot is confirmed for our upcoming Manager Roundtable session.

SESSION DETAILS:
${roundtable.topic}

Date: ${formattedDate}
Time: ${formattedTime}
Duration: 30 minutes
Format: Small peer group (max 6 managers)

HOW TO JOIN:
Zoom Meeting Link: ${roundtable.zoom_join_url || 'Will be provided shortly'}

WHAT TO PREPARE:
- Think about your biggest challenge related to ${getTopicContext(roundtable.topic)}
- Prepare any questions you'd like to discuss with fellow managers
- Join 2 minutes early to test your audio/video
- Come ready to share experiences and learn from peers

We'll send you a reminder 24 hours before the session.

Looking forward to seeing you there!

Best regards,
Clive Hays
Founder, Clover ERA
contact@cloverera.com | (212) 918-4448

--
© 2025 Clover ERA | cloverera.com
    `.trim();
}

function generateWaitlistEmailText(registration, roundtable, date) {
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
    });

    return `
You're on the Waitlist
We'll notify you if a spot opens up

Hi ${registration.name},

Thanks for your interest in our Manager Roundtable session! This session is currently full, but we've added you to the waitlist.

SESSION DETAILS:
${roundtable.topic}
Date: ${formattedDate}
Time: ${formattedTime}

WHAT HAPPENS NEXT:
If a spot opens up before the session:
✓ You'll receive an immediate email notification
✓ We'll include your Zoom meeting link
✓ You'll have 2 hours to confirm your attendance

View upcoming sessions: https://cloverera.com/manager-roundtable.html

We appreciate your interest and hope to see you soon!

Best regards,
Clive Hays
Founder, Clover ERA
contact@cloverera.com

--
© 2025 Clover ERA | cloverera.com
    `.trim();
}

function generateReminderEmailText(registration, roundtable, date) {
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
    });

    return `
REMINDER: Tomorrow!
Your Manager Roundtable is in 24 hours

Hi ${registration.name},

Just a friendly reminder that your Manager Roundtable session is TOMORROW!

SESSION DETAILS:
${roundtable.topic}

When: Tomorrow, ${formattedDate}
Time: ${formattedTime}
Duration: 30 minutes

Zoom Meeting Link: ${roundtable.zoom_join_url || '#'}

QUICK PREPARATION:
- Have your biggest ${getTopicContext(roundtable.topic)} challenge in mind
- Prepare 1-2 questions to discuss with the group
- Test your Zoom audio/video beforehand
- Join 2 minutes early to get settled

See you tomorrow!

Best regards,
Clive Hays
Clover ERA
    `.trim();
}

function generatePromotionEmailText(registration, roundtable, date) {
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
    });

    return `
Great News!
A spot opened up for you!

Hi ${registration.name},

Excellent news! A spot has opened up in the Manager Roundtable session you were waitlisted for, and it's yours!

SESSION DETAILS:
${roundtable.topic}

Date: ${formattedDate}
Time: ${formattedTime}
Duration: 30 minutes

Your spot is confirmed! No action needed - you're all set.

Zoom Meeting Link: ${roundtable.zoom_join_url || '#'}

WHAT TO PREPARE:
- Think about your biggest challenge related to ${getTopicContext(roundtable.topic)}
- Prepare any questions you'd like to discuss
- Join 2 minutes early to test your setup

We're excited to have you join us!

Best regards,
Clive Hays
Founder, Clover ERA
    `.trim();
}

// ===== HELPER FUNCTIONS =====

function getTopicContext(topic) {
    const contexts = {
        'The 30-Day Warning System': 'spotting resignation warning signs',
        'The Workload Balance Equation': 'preventing team burnout',
        'Communication Breakdowns': 'communication issues',
        'From Stuck in the Middle to Strategic Leader': 'evolving as a strategic leader'
    };
    return contexts[topic] || 'team management';
}
