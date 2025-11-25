-- Email Automation Database Trigger (FIXED VERSION)
-- Run this AFTER deploying your Supabase Edge Function
--
-- This trigger automatically calls your Edge Function when:
-- 1. A new application is submitted (sends welcome email)
-- 2. Application status changes (sends accepted/waitlisted/declined email)

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS send_email_on_application_submit ON roundtable_applications;
DROP TRIGGER IF EXISTS send_email_on_status_change ON roundtable_applications;
DROP FUNCTION IF EXISTS trigger_roundtable_email();

-- Create new trigger function with correct http_post syntax
CREATE OR REPLACE FUNCTION trigger_roundtable_email()
RETURNS TRIGGER AS $$
DECLARE
  v_email_type TEXT;
  v_edge_function_url TEXT := 'https://dvvsphsvcpxkplumutyc.supabase.co/functions/v1/smooth-task';
  v_request_body TEXT;
  v_app_id TEXT;
  v_cohort_id TEXT;
BEGIN
  -- Convert UUIDs to text first
  v_app_id := NEW.id::text;
  v_cohort_id := COALESCE(NEW.cohort_id::text, 'null');

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

  -- Build JSON request body manually
  v_request_body := json_build_object(
    'type', v_email_type,
    'application_id', v_app_id,
    'cohort_id', v_cohort_id,
    'status', NEW.status
  )::text;

  -- Call Edge Function using correct http_post syntax
  -- Syntax: http_post(url, body, content_type)
  PERFORM http_post(
    v_edge_function_url,
    v_request_body,
    'application/json'
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Failed to send email for application %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Test function to manually trigger an email
CREATE OR REPLACE FUNCTION send_test_email(p_application_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_app RECORD;
  v_edge_function_url TEXT := 'https://dvvsphsvcpxkplumutyc.supabase.co/functions/v1/smooth-task';
  v_request_body TEXT;
BEGIN
  -- Get application details
  SELECT * INTO v_app
  FROM roundtable_applications
  WHERE id = p_application_id;

  IF NOT FOUND THEN
    RETURN 'Application not found';
  END IF;

  -- Build request body
  v_request_body := json_build_object(
    'type', 'application_received',
    'application_id', v_app.id::text,
    'cohort_id', COALESCE(v_app.cohort_id::text, 'null'),
    'status', v_app.status
  )::text;

  -- Send request
  PERFORM http_post(
    v_edge_function_url,
    v_request_body,
    'application/json'
  );

  RETURN 'Email triggered successfully for application: ' || p_application_id::text;
EXCEPTION WHEN OTHERS THEN
  RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification query
SELECT
  'Triggers created successfully!' as status,
  'send_email_on_application_submit' as insert_trigger,
  'send_email_on_status_change' as update_trigger,
  'Use: SELECT send_test_email(''application-id-here''::uuid)' as test_command;

COMMENT ON FUNCTION trigger_roundtable_email() IS 'Automatically sends emails via Edge Function when applications are submitted or status changes';
COMMENT ON FUNCTION send_test_email(UUID) IS 'Manually trigger an email for testing. Usage: SELECT send_test_email(''uuid-here''::uuid)';
