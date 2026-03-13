-- Migration 055: Personalized landing page tokens
-- Adds a unique page_token to each prospect that drives the /67-v3?ref= URL
-- Creates a safe anon-callable RPC for the landing page to fetch its display data

-- 1. Add page_token column
ALTER TABLE outreach_prospects ADD COLUMN IF NOT EXISTS page_token TEXT UNIQUE;

-- 2. Backfill existing prospects (deterministic from id so re-running is safe)
UPDATE outreach_prospects
SET page_token = substr(md5(id::text || 'clover-era-salt-2026'), 1, 12)
WHERE page_token IS NULL;

-- 3. Auto-generate token for every new prospect on insert
CREATE OR REPLACE FUNCTION generate_page_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.page_token IS NULL THEN
    NEW.page_token := substr(md5(gen_random_uuid()::text), 1, 12);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_page_token ON outreach_prospects;
CREATE TRIGGER set_page_token
  BEFORE INSERT ON outreach_prospects
  FOR EACH ROW EXECUTE FUNCTION generate_page_token();

-- 4. RPC function called by the landing page
-- SECURITY DEFINER so it bypasses RLS on the underlying tables.
-- Returns only the fields the landing page needs — nothing sensitive.
CREATE OR REPLACE FUNCTION get_landing_page_data(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'first_name',        p.first_name,
    'company_name',      COALESCE(tr.company_name, p.company_name),
    'employee_count',    COALESCE(tr.total_employees, p.company_employee_count),
    'industry',          p.company_industry,
    'country',           p.country,
    'avg_salary',        p.estimated_avg_salary,
    'annual_cost',       tr.annual_cost,
    'daily_cost',        tr.daily_cost,
    'cost_per_departure',tr.cost_per_departure,
    'in_67_day_window',  tr.in_67_day_window,
    'annual_departures', tr.annual_departures
  )
  INTO result
  FROM outreach_prospects p
  LEFT JOIN turnover_reports tr ON tr.id = p.turnover_report_id
  WHERE p.page_token = p_token
  LIMIT 1;

  RETURN result;
END;
$$;

-- 5. Allow the anon role to call the function (landing page has no auth)
GRANT EXECUTE ON FUNCTION get_landing_page_data(TEXT) TO anon;
