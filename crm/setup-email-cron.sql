-- Set up Supabase cron job to check for scheduled emails every 15 minutes
-- Run this SQL in your Supabase SQL Editor

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create the cron job to check scheduled emails every 15 minutes
SELECT cron.schedule(
  'check-roundtable-scheduled-emails',  -- job name
  '*/15 * * * *',                        -- every 15 minutes
  $$
  SELECT net.http_post(
    url := 'https://dvvsphsvcpxkplumutyc.supabase.co/functions/v1/smooth-task',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2dnNwaHN2Y3B4a3BsdW11dHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDc3MzksImV4cCI6MjA3OTU4MzczOX0.waQs1wvf4Er66Oe-NI5Ht0M-tHJk83St1UR8AT2dOeI'
    ),
    body := '{"type": "check_scheduled_emails"}'::jsonb
  );
  $$
);

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'check-roundtable-scheduled-emails';

-- To view cron job run history (after it has run):
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- To delete the cron job if needed:
-- SELECT cron.unschedule('check-roundtable-scheduled-emails');
