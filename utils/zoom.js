// Zoom API integration for creating meetings

/**
 * Create a Zoom meeting for a roundtable session
 */
export async function createZoomMeeting(roundtable) {
    const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
    const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
    const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;

    if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
        throw new Error('Zoom API credentials not configured');
    }

    try {
        // Get Zoom OAuth token (Server-to-Server OAuth)
        const tokenResponse = await fetch('https://zoom.us/oauth/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`
        });

        if (!tokenResponse.ok) {
            throw new Error('Failed to get Zoom access token');
        }

        const { access_token } = await tokenResponse.json();

        // Create meeting
        const startDate = new Date(roundtable.scheduled_at);

        const meetingData = {
            topic: `Manager Roundtable: ${roundtable.topic}`,
            type: 2, // Scheduled meeting
            start_time: startDate.toISOString(),
            duration: roundtable.duration_minutes || 30,
            timezone: 'America/New_York',
            agenda: `Manager Roundtable session on ${roundtable.topic}. A peer discussion for managers to share insights and strategies.`,
            settings: {
                host_video: true,
                participant_video: true,
                join_before_host: false,
                mute_upon_entry: true,
                waiting_room: true,
                audio: 'both',
                auto_recording: 'none',
                approval_type: 0, // Automatically approve
                meeting_authentication: false,
                enable_waiting_room: true
            }
        };

        const createResponse = await fetch('https://api.zoom.us/v2/users/me/meetings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(meetingData)
        });

        if (!createResponse.ok) {
            const error = await createResponse.json();
            console.error('Zoom API error:', error);
            throw new Error('Failed to create Zoom meeting');
        }

        const meeting = await createResponse.json();

        return {
            id: meeting.id.toString(),
            join_url: meeting.join_url,
            start_url: meeting.start_url,
            password: meeting.password
        };

    } catch (error) {
        console.error('Error creating Zoom meeting:', error);
        throw error;
    }
}

/**
 * Update a Zoom meeting
 */
export async function updateZoomMeeting(zoomMeetingId, updates) {
    const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
    const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
    const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;

    if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
        throw new Error('Zoom API credentials not configured');
    }

    try {
        // Get access token
        const tokenResponse = await fetch('https://zoom.us/oauth/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`
        });

        if (!tokenResponse.ok) {
            throw new Error('Failed to get Zoom access token');
        }

        const { access_token } = await tokenResponse.json();

        // Update meeting
        const updateResponse = await fetch(`https://api.zoom.us/v2/meetings/${zoomMeetingId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });

        if (!updateResponse.ok) {
            throw new Error('Failed to update Zoom meeting');
        }

        return true;

    } catch (error) {
        console.error('Error updating Zoom meeting:', error);
        throw error;
    }
}

/**
 * Delete a Zoom meeting
 */
export async function deleteZoomMeeting(zoomMeetingId) {
    const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
    const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
    const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;

    if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
        throw new Error('Zoom API credentials not configured');
    }

    try {
        // Get access token
        const tokenResponse = await fetch('https://zoom.us/oauth/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`
        });

        if (!tokenResponse.ok) {
            throw new Error('Failed to get Zoom access token');
        }

        const { access_token } = await tokenResponse.json();

        // Delete meeting
        const deleteResponse = await fetch(`https://api.zoom.us/v2/meetings/${zoomMeetingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        if (!deleteResponse.ok && deleteResponse.status !== 204) {
            throw new Error('Failed to delete Zoom meeting');
        }

        return true;

    } catch (error) {
        console.error('Error deleting Zoom meeting:', error);
        throw error;
    }
}
