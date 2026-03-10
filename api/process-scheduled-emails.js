// API Route: Process Scheduled Outreach Emails
// Sends follow-up emails (Email 2, 3) that have reached their scheduled_at time
// Triggered by Vercel Cron every hour

export default async function handler(req, res) {
    try {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_KEY;

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            return res.status(500).json({ error: 'Missing Supabase configuration' });
        }

        // Call the send-outreach-email edge function with type: process_scheduled
        const response = await fetch(`${SUPABASE_URL}/functions/v1/send-outreach-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ type: 'process_scheduled' })
        });

        const result = await response.json();

        console.log('Process scheduled emails result:', JSON.stringify(result));

        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Process scheduled emails error:', error);
        return res.status(500).json({ error: error.message });
    }
}
