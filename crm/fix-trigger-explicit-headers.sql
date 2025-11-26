-- Explicitly set all pg_net parameters including method and headers

DROP FUNCTION IF EXISTS trigger_roundtable_email() CASCADE;

CREATE OR REPLACE FUNCTION trigger_roundtable_email()
RETURNS TRIGGER AS $$
DECLARE
  v_email_type TEXT;
  v_request_id BIGINT;
  v_app_id TEXT;
BEGIN
  -- Convert UUID to text
  v_app_id := NEW.id::text;

  -- Determine email type
  IF TG_OP = 'INSERT' THEN
    v_email_type := 'application_received';
  ELSIF TG_OP = 'UPDATE' AND NEW.status != OLD.status THEN
    CASE NEW.status
      WHEN 'accepted' THEN v_email_type := 'accepted';
      WHEN 'waitlisted' THEN v_email_type := 'waitlisted';
      WHEN 'declined' THEN v_email_type := 'declined';
      ELSE RETURN NEW;
    END CASE;
  ELSE
    RETURN NEW;
  END IF;

  -- Log what we're about to send
  RAISE NOTICE 'Trigger firing: type=%, app_id=%', v_email_type, v_app_id;

  -- Call pg_net with explicit Content-Type header
  SELECT INTO v_request_id net.http_post(
    url := 'https://dvvsphsvcpxkplumutyc.supabase.co/functions/v1/smooth-task',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'type', v_email_type,
      'application_id', v_app_id
    )
  );

  RAISE NOTICE 'HTTP request queued: %', v_request_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Email trigger failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS send_email_on_application_submit ON roundtable_applications;
DROP TRIGGER IF EXISTS send_email_on_status_change ON roundtable_applications;

CREATE TRIGGER send_email_on_application_submit
  AFTER INSERT ON roundtable_applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_roundtable_email();

CREATE TRIGGER send_email_on_status_change
  AFTER UPDATE ON roundtable_applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_roundtable_email();

-- Verify
SELECT 'Triggers updated with explicit headers' as status;
