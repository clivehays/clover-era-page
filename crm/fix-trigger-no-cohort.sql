-- Fix the trigger to not pass cohort_id (to avoid the .single() error in Edge Function)
-- The Edge Function will get cohort from the application record instead

DROP FUNCTION IF EXISTS trigger_roundtable_email() CASCADE;

CREATE OR REPLACE FUNCTION trigger_roundtable_email()
RETURNS TRIGGER AS $$
DECLARE
  v_email_type TEXT;
  v_edge_function_url TEXT := 'https://dvvsphsvcpxkplumutyc.supabase.co/functions/v1/smooth-task';
  v_request_body TEXT;
  v_app_id TEXT;
BEGIN
  -- Convert UUID to text first
  v_app_id := NEW.id::text;

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

  -- Build JSON request body - DON'T include cohort_id, let Edge Function get it from app
  v_request_body := json_build_object(
    'type', v_email_type,
    'application_id', v_app_id
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

-- Recreate triggers
CREATE TRIGGER send_email_on_application_submit
  AFTER INSERT ON roundtable_applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_roundtable_email();

CREATE TRIGGER send_email_on_status_change
  AFTER UPDATE ON roundtable_applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_roundtable_email();

-- Verify triggers created
SELECT
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgrelid = 'roundtable_applications'::regclass
AND tgname LIKE '%email%';
