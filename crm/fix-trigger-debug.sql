-- Debug and fix the trigger - the issue is application_id is coming through as undefined

DROP FUNCTION IF EXISTS trigger_roundtable_email() CASCADE;

CREATE OR REPLACE FUNCTION trigger_roundtable_email()
RETURNS TRIGGER AS $$
DECLARE
  v_email_type TEXT;
  v_edge_function_url TEXT := 'https://dvvsphsvcpxkplumutyc.supabase.co/functions/v1/smooth-task';
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

  -- Build JSON request body as JSONB first, then convert to text
  v_request_body := jsonb_build_object(
    'type', v_email_type,
    'application_id', NEW.id::text
  );

  -- Log for debugging
  RAISE NOTICE 'Sending email request: %', v_request_body::text;

  -- Call Edge Function using http_post
  PERFORM http_post(
    v_edge_function_url,
    v_request_body::text,
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

-- Test by inserting a dummy record
-- Uncomment to test:
-- INSERT INTO roundtable_applications (
--   full_name, email, linkedin_url, company_name, title,
--   direct_reports, company_size, industry, resignations_12mo,
--   surprise_departures, escalation_experience, current_challenge,
--   ceo_intro_openness, referral_source, available_for_date
-- ) VALUES (
--   'Test Debug', 'test@example.com', 'https://linkedin.com/in/test',
--   'Test Co', 'Manager', '1-5', '100-200', 'SaaS / Software',
--   '1-2', 'A few caught me off guard', ARRAY['They say they''ll look into it but nothing changes'],
--   'Testing trigger', 'Yes, I''d want them to hear this', 'Testing', true
-- );
