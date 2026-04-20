-- PPE Instrument submissions
-- Captures the full picture once the user clicks "See your exposure":
-- industry, financials, all four exposure groups, derived states, light metadata.
-- No email captured by spec. Inserts go through the API using the service key
-- (which bypasses RLS), so no anon insert policy is needed.

CREATE TABLE ppe_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Industry
  industry        TEXT,
  industry_other  TEXT,

  -- Financials and denominator
  revenue              NUMERIC,
  profit               NUMERIC,
  denominator_value    NUMERIC,
  denominator_type     TEXT,    -- 'direct' | 'fte_pt' | 'fte_contract' | 'lce'
  denominator_label    TEXT,    -- human-readable, e.g. 'Direct employees only'
  ppe                  NUMERIC, -- profit / denominator_value

  -- Group 1: Drift exposure
  q11_confidence  INTEGER, -- 1-5
  q12_stale_pct   INTEGER, -- 0-100

  -- Group 2: Competitive exposure
  q21_pressures        JSONB, -- array of selected option keys
  q22_pricing_pressure INTEGER, -- 1-5

  -- Group 3: Execution exposure
  q31_levers_pulled    JSONB, -- array of selected option keys
  q32_runway           INTEGER, -- 1-5

  -- Group 4: Human exposure
  q41_visibility   TEXT,    -- 'yes' | 'no' | 'not_sure'
  q42_confidence   INTEGER, -- 1-5
  q43_cost_estimate TEXT,   -- free text, max 300 chars

  -- Derived states (computed by the page, captured for analysis convenience)
  human_state           TEXT,    -- 'locked' | 'partial' | 'unlocked'
  consumed_lever_count  INTEGER, -- count of mechanical levers checked, excluding 'none'

  -- Light metadata for spam triage / segmentation
  user_agent  TEXT,
  referrer    TEXT,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ppe_submissions_created_at  ON ppe_submissions(created_at DESC);
CREATE INDEX idx_ppe_submissions_industry    ON ppe_submissions(industry);
CREATE INDEX idx_ppe_submissions_human_state ON ppe_submissions(human_state);

ALTER TABLE ppe_submissions ENABLE ROW LEVEL SECURITY;

-- Authenticated dashboards can read everything.
CREATE POLICY "Authenticated read" ON ppe_submissions
  FOR SELECT TO authenticated USING (true);

NOTIFY pgrst, 'reload schema';
