-- Add authorization header so Edge Function accepts the request

DROP FUNCTION IF EXISTS trigger_roundtable_email() CASCADE;

CREATE OR REPLACE FUNCTION trigger_roundtable_email()
RETURNS TRIGGER AS $$
DECLARE
  v_email_type TEXT;
  v_request_id BIGINT;
  v_app_id TEXT;
  -- Use the anon key for authorization
  v_anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2dnNwaHN2Y3B4a3BsdW11dHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDc3MzksImV4cCI6MjA3OTU4MzczOX0.waQs1wvf4Er66Oe-NI5Ht0M-tHJk83St1UR8AT2dOeI';
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

  -- Call pg_net with Authorization header
  SELECT INTO v_request_id net.http_post(
    url := 'https://dvvsphsvcpxkplumutyc.supabase.co/functions/v1/smooth-task',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon_key
    ),
    body := jsonb_build_object(
      'type', v_email_type,
      'application_id', v_app_id
    )
  );

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

SELECT 'Triggers updated with authorization header' as status;
