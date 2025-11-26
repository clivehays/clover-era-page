-- Try sending body as JSON string instead of JSONB object

DROP FUNCTION IF EXISTS trigger_roundtable_email() CASCADE;

CREATE OR REPLACE FUNCTION trigger_roundtable_email()
RETURNS TRIGGER AS $$
DECLARE
  v_email_type TEXT;
  v_edge_function_url TEXT := 'https://dvvsphsvcpxkplumutyc.supabase.co/functions/v1/smooth-task';
  v_request_id BIGINT;
  v_payload JSONB;
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

  -- Build payload
  v_payload := jsonb_build_object(
    'type', v_email_type,
    'application_id', NEW.id::text
  );

  RAISE NOTICE 'Sending payload: %', v_payload::text;

  -- Use pg_net.http_post with body as JSON object (not string)
  SELECT net.http_post(
    url := v_edge_function_url,
    body := v_payload
  ) INTO v_request_id;

  RAISE NOTICE 'Request ID: %', v_request_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Failed to send email for application %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers
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

SELECT 'Triggers recreated - simplified pg_net call' as status;
