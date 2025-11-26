-- Email Automation Database Trigger
-- Run this AFTER deploying your Supabase Edge Function
--
-- This trigger automatically calls your Edge Function when:
-- 1. A new application is submitted (sends welcome email)
-- 2. Application status changes (sends accepted/waitlisted/declined email)
--
-- IMPORTANT: Replace 'YOUR_EDGE_FUNCTION_URL' with your actual function URL
-- Get this from: Supabase Dashboard > Edge Functions > roundtable-emails > Copy URL

-- Enable the HTTP extension (for making external calls)
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Function to trigger email sending via Edge Function
CREATE OR REPLACE FUNCTION trigger_roundtable_email()
RETURNS TRIGGER AS $$
DECLARE
  v_email_type TEXT;
  v_edge_function_url TEXT := 'https://dvvsphsvcpxkplumutyc.supabase.co/functions/v1/smooth-task'; -- UPDATE THIS!
  v_request_body JSONB;
BEGIN
  -- Determine email type based on trigger
  IF TG_OP = 'INSERT' THEN
    v_email_type := 'application_received';
  ELSIF TG_OP = 'UPDATE' AND NEW.status != OLD.status THEN
    -- Status changed, send appropriate email
    CASE NEW.status
      WHEN 'accepted' THEN v_email_type := 'accepted';
      WHEN 'waitlisted' THEN v_email_type := 'waitlisted';
      WHEN 'declined' THEN v_email_type := 'declined';
      ELSE RETURN NEW; -- No email for other status changes
    END CASE;
  ELSE
    RETURN NEW; -- No email needed
  END IF;

  -- Build request body
  v_request_body := jsonb_build_object(
    'type', v_email_type,
    'application_id', NEW.id,
    'cohort_id', NEW.cohort_id
  );

  -- Call Edge Function asynchronously (fire and forget)
  -- Using pg_background or similar for true async
  -- For now, we'll use a simple HTTP POST
  PERFORM extensions.http_post(
    url := v_edge_function_url,
    body := v_request_body::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on INSERT (new application)
CREATE TRIGGER send_email_on_application_submit
  AFTER INSERT ON roundtable_applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_roundtable_email();

-- Create trigger on UPDATE (status change)
CREATE TRIGGER send_email_on_status_change
  AFTER UPDATE ON roundtable_applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_roundtable_email();

-- OPTIONAL: Function to manually send an email for testing
CREATE OR REPLACE FUNCTION send_test_email(
  p_application_id UUID,
  p_email_type TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_edge_function_url TEXT := 'YOUR_EDGE_FUNCTION_URL'; -- UPDATE THIS!
  v_request_body JSONB;
  v_response JSONB;
BEGIN
  v_request_body := jsonb_build_object(
    'type', p_email_type,
    'application_id', p_application_id
  );

  SELECT
    content::jsonb INTO v_response
  FROM extensions.http_post(
    url := v_edge_function_url,
    body := v_request_body::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    )
  );

  RETURN v_response;
END;
$$ LANGUAGE plpgsql;

-- Test the trigger (uncomment to test after setup)
-- SELECT send_test_email(
--   'application-uuid-here',
--   'application_received'
-- );

COMMENT ON FUNCTION trigger_roundtable_email() IS 'Automatically sends emails via Edge Function when applications are submitted or status changes';
COMMENT ON FUNCTION send_test_email(UUID, TEXT) IS 'Manually trigger an email for testing purposes. Usage: SELECT send_test_email(application_id, email_type)';
