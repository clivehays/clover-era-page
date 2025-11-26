// Calendar invite (.ics file) generator

/**
 * Create an iCalendar (.ics) file for the roundtable session
 */
export function createCalendarInvite(roundtable, registration) {
    const startDate = new Date(roundtable.scheduled_at);
    const endDate = new Date(startDate.getTime() + (roundtable.duration_minutes || 30) * 60000);

    // Format dates for iCal (YYYYMMDDTHHMMSSZ)
    const formatDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const start = formatDate(startDate);
    const end = formatDate(endDate);
    const created = formatDate(new Date());

    // Create unique ID for the event
    const eventId = `roundtable-${roundtable.id}@cloverera.com`;

    // Escape special characters in text
    const escapeText = (text) => {
        if (!text) return '';
        return text
            .replace(/\\/g, '\\\\')
            .replace(/;/g, '\\;')
            .replace(/,/g, '\\,')
            .replace(/\n/g, '\\n');
    };

    const description = `Manager Roundtable: ${roundtable.topic}

Join this exclusive peer discussion with fellow managers to discuss real challenges and proven strategies.

What to Prepare:
- Think about your biggest challenge related to this topic
- Prepare 1-2 questions to discuss with the group
- Join 2 minutes early to test your audio/video

Zoom Meeting Link: ${roundtable.zoom_join_url || 'Link will be provided'}

Questions? Contact us at contact@cloverera.com or (212) 918-4448`;

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Clover ERA//Manager Roundtable//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:REQUEST',
        'BEGIN:VEVENT',
        `UID:${eventId}`,
        `DTSTAMP:${created}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${escapeText('Manager Roundtable: ' + roundtable.topic)}`,
        `DESCRIPTION:${escapeText(description)}`,
        `LOCATION:${escapeText(roundtable.zoom_join_url || 'Zoom (link will be provided)')}`,
        `ORGANIZER;CN=Clive Hays:mailto:contact@cloverera.com`,
        `ATTENDEE;CN=${escapeText(registration.name)};RSVP=TRUE:mailto:${registration.email}`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'BEGIN:VALARM',
        'TRIGGER:-PT24H',
        'ACTION:DISPLAY',
        'DESCRIPTION:Reminder: Manager Roundtable tomorrow',
        'END:VALARM',
        'BEGIN:VALARM',
        'TRIGGER:-PT1H',
        'ACTION:DISPLAY',
        'DESCRIPTION:Reminder: Manager Roundtable in 1 hour',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
}

/**
 * Format date for display
 */
export function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

/**
 * Format time for display
 */
export function formatTime(date) {
    return new Date(date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
    });
}

/**
 * Check if a date is within 24 hours
 */
export function isWithin24Hours(date) {
    const now = new Date();
    const targetDate = new Date(date);
    const diff = targetDate.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);
    return hours > 0 && hours <= 24;
}

/**
 * Check if registration should be closed (2 hours before)
 */
export function isRegistrationClosed(scheduledDate) {
    const now = new Date();
    const sessionDate = new Date(scheduledDate);
    const twoHoursBefore = new Date(sessionDate.getTime() - (2 * 60 * 60 * 1000));
    return now >= twoHoursBefore;
}
