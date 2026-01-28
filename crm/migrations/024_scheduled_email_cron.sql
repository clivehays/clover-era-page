-- Migration: Set up automated scheduled email processing
--
-- IMPORTANT: There are two options for automating follow-up emails:
--
-- OPTION 1: External Cron (Recommended for simplicity)
-- Use a service like cron-job.org, GitHub Actions, or Vercel Cron to call:
-- POST https://drugebiitlcjkknjfxeh.supabase.co/functions/v1/send-outreach-email
-- Headers: Authorization: Bearer <SUPABASE_ANON_KEY>, Content-Type: application/json
-- Body: {"type": "process_scheduled"}
-- Schedule: Every hour or at 9 AM daily
--
-- OPTION 2: Supabase pg_cron + pg_net (Requires service role key in vault)
-- The SQL below sets this up, but requires storing the service_role_key securely.

-- Enable extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create logging table for scheduled email processing
CREATE TABLE IF NOT EXISTS scheduled_email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  emails_processed INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  status TEXT,
  details JSONB
);

-- Create index for log queries
CREATE INDEX IF NOT EXISTS idx_scheduled_email_logs_date ON scheduled_email_logs(executed_at DESC);

-- Add scheduled_at column to outreach_emails if not exists (should already exist from sequence delays)
-- This stores when follow-up emails should be sent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'outreach_emails' AND column_name = 'scheduled_at'
  ) THEN
    ALTER TABLE outreach_emails ADD COLUMN scheduled_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create index for scheduled email queries
CREATE INDEX IF NOT EXISTS idx_outreach_emails_scheduled
ON outreach_emails(status, scheduled_at)
WHERE status = 'scheduled';

COMMENT ON TABLE scheduled_email_logs IS 'Logs of automated scheduled email processing runs';
COMMENT ON COLUMN outreach_emails.scheduled_at IS 'When a follow-up email is scheduled to be sent (used for Emails 2 and 3)';

-- NOTE: To set up the actual cron job, you have two options:
--
-- 1. SIMPLE: Use external cron service to call the edge function every hour
--    This is the recommended approach as it doesn't require storing secrets in the database.
--
-- 2. ADVANCED: Use pg_cron with pg_net (uncomment below after storing service_role_key in vault)
--
-- First, store your service role key in Supabase Vault:
-- INSERT INTO vault.secrets (name, secret) VALUES ('service_role_key', 'your-service-role-key-here');
--
-- Then uncomment and run:
/*
CREATE OR REPLACE FUNCTION trigger_scheduled_email_processing()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_key TEXT;
BEGIN
  -- Get service role key from vault
  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key';

  IF service_key IS NULL THEN
    RAISE EXCEPTION 'Service role key not found in vault';
  END IF;

  -- Call edge function via pg_net
  PERFORM net.http_post(
    url := 'https://drugebiitlcjkknjfxeh.supabase.co/functions/v1/send-outreach-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := '{"type": "process_scheduled"}'::jsonb
  );

  -- Log the execution
  INSERT INTO scheduled_email_logs (status, details)
  VALUES ('triggered', jsonb_build_object('triggered_at', NOW()));
END;
$$;

-- Schedule to run every hour
SELECT cron.schedule('process-scheduled-emails-hourly', '0 * * * *', 'SELECT trigger_scheduled_email_processing()');

-- Also run at 9 AM when follow-ups are scheduled
SELECT cron.schedule('process-scheduled-emails-9am', '0 9 * * *', 'SELECT trigger_scheduled_email_processing()');
*/
