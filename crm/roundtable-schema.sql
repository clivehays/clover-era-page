-- Retention Reality Roundtable Database Schema
-- Run this in Supabase SQL Editor to create the roundtable application system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cohorts table - stores information about each roundtable session
CREATE TABLE roundtable_cohorts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  zoom_link TEXT,
  max_attendees INTEGER DEFAULT 10,
  registration_deadline DATE,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  theme TEXT,
  recording_link TEXT,
  framework_pdf_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table - stores all roundtable applications
CREATE TABLE roundtable_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id UUID REFERENCES roundtable_cohorts(id) ON DELETE SET NULL,

  -- Application status and score
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'waitlisted', 'declined')),
  score INTEGER DEFAULT 0,

  -- Basic Info (Section 1)
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  linkedin_url TEXT NOT NULL,
  company_name TEXT NOT NULL,
  title TEXT NOT NULL,

  -- Qualification (Section 2)
  direct_reports TEXT NOT NULL CHECK (direct_reports IN ('1-5', '6-10', '11-20', '20+')),
  company_size TEXT NOT NULL CHECK (company_size IN ('Under 50', '50-100', '100-200', '200-500', '500+')),
  industry TEXT NOT NULL,
  industry_other TEXT,

  -- Engagement Filter (Section 3)
  resignations_12mo TEXT NOT NULL CHECK (resignations_12mo IN ('0', '1-2', '3-5', '6+')),
  surprise_departures TEXT NOT NULL CHECK (surprise_departures IN ('None, I saw them all coming', 'A few caught me off guard', 'Most were a surprise', 'All of them blindsided me')),
  escalation_experience TEXT[] NOT NULL, -- array of selected options
  current_challenge TEXT NOT NULL,

  -- Intent Signal (Section 4)
  ceo_intro_openness TEXT NOT NULL CHECK (ceo_intro_openness IN ('Yes, I''d want them to hear this', 'Maybe, depends on what I learn', 'No, I''m here for my own development', 'My CEO would never go for this')),
  referral_source TEXT NOT NULL,
  referral_source_other TEXT,
  available_for_date BOOLEAN NOT NULL,

  -- Post-Event Tracking (manual entry by admin)
  attended BOOLEAN DEFAULT false,
  spoke_count INTEGER DEFAULT 0,
  intent_tag TEXT CHECK (intent_tag IN ('high', 'medium', 'low')),
  notes TEXT,

  -- Email Tracking
  emails_sent JSONB DEFAULT '[]'::jsonb, -- array of {type, sent_at}
  replied BOOLEAN DEFAULT false,
  ceo_intro_made BOOLEAN DEFAULT false,
  pipeline_generated DECIMAL(12, 2) DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_roundtable_applications_status ON roundtable_applications(status);
CREATE INDEX idx_roundtable_applications_email ON roundtable_applications(email);
CREATE INDEX idx_roundtable_applications_cohort_id ON roundtable_applications(cohort_id);
CREATE INDEX idx_roundtable_applications_score ON roundtable_applications(score DESC);
CREATE INDEX idx_roundtable_applications_created_at ON roundtable_applications(created_at DESC);
CREATE INDEX idx_roundtable_cohorts_date ON roundtable_cohorts(date);
CREATE INDEX idx_roundtable_cohorts_status ON roundtable_cohorts(status);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_roundtable_cohorts_updated_at
  BEFORE UPDATE ON roundtable_cohorts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roundtable_applications_updated_at
  BEFORE UPDATE ON roundtable_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate application score
CREATE OR REPLACE FUNCTION calculate_roundtable_score(
  p_company_size TEXT,
  p_industry TEXT,
  p_resignations_12mo TEXT,
  p_surprise_departures TEXT,
  p_escalation_experience TEXT[],
  p_ceo_intro_openness TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
BEGIN
  -- Company Size scoring
  CASE p_company_size
    WHEN '200-500' THEN v_score := v_score + 20;
    WHEN '100-200' THEN v_score := v_score + 15;
    WHEN '500+' THEN v_score := v_score + 10;
    WHEN '50-100' THEN v_score := v_score + 5;
    ELSE NULL;
  END CASE;

  -- Industry scoring
  CASE p_industry
    WHEN 'SaaS / Software' THEN v_score := v_score + 15;
    WHEN 'FinTech' THEN v_score := v_score + 15;
    WHEN 'HealthTech' THEN v_score := v_score + 10;
    WHEN 'Tech Services' THEN v_score := v_score + 10;
    WHEN 'Other Tech' THEN v_score := v_score + 5;
    ELSE NULL;
  END CASE;

  -- Resignations scoring
  CASE p_resignations_12mo
    WHEN '6+' THEN v_score := v_score + 15;
    WHEN '3-5' THEN v_score := v_score + 10;
    WHEN '1-2' THEN v_score := v_score + 5;
    ELSE NULL;
  END CASE;

  -- Surprise departures scoring
  CASE p_surprise_departures
    WHEN 'All of them blindsided me' THEN v_score := v_score + 10;
    WHEN 'Most were a surprise' THEN v_score := v_score + 8;
    WHEN 'A few caught me off guard' THEN v_score := v_score + 5;
    ELSE NULL;
  END CASE;

  -- Escalation experience scoring
  IF 'I''ve stopped raising concerns' = ANY(p_escalation_experience) THEN
    v_score := v_score + 10;
  END IF;
  IF 'They ask why I can''t keep my team happy' = ANY(p_escalation_experience) THEN
    v_score := v_score + 10;
  END IF;
  IF 'They say they''ll look into it but nothing changes' = ANY(p_escalation_experience) THEN
    v_score := v_score + 5;
  END IF;

  -- CEO intro openness scoring
  CASE p_ceo_intro_openness
    WHEN 'Yes, I''d want them to hear this' THEN v_score := v_score + 20;
    WHEN 'Maybe, depends on what I learn' THEN v_score := v_score + 10;
    WHEN 'No, I''m here for my own development' THEN v_score := v_score + 5;
    WHEN 'My CEO would never go for this' THEN v_score := v_score - 10;
    ELSE NULL;
  END CASE;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate score on insert/update
CREATE OR REPLACE FUNCTION set_roundtable_application_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.score := calculate_roundtable_score(
    NEW.company_size,
    NEW.industry,
    NEW.resignations_12mo,
    NEW.surprise_departures,
    NEW.escalation_experience,
    NEW.ceo_intro_openness
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_score_before_insert_or_update
  BEFORE INSERT OR UPDATE ON roundtable_applications
  FOR EACH ROW EXECUTE FUNCTION set_roundtable_application_score();

-- Enable Row Level Security
ALTER TABLE roundtable_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE roundtable_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cohorts
CREATE POLICY "Public can view upcoming cohorts"
  ON roundtable_cohorts FOR SELECT
  USING (status = 'upcoming');

CREATE POLICY "Admins can manage all cohorts"
  ON roundtable_cohorts FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for applications
CREATE POLICY "Anyone can insert applications"
  ON roundtable_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all applications"
  ON roundtable_applications FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update all applications"
  ON roundtable_applications FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete applications"
  ON roundtable_applications FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Insert a sample cohort for testing
INSERT INTO roundtable_cohorts (
  date,
  time,
  timezone,
  zoom_link,
  max_attendees,
  registration_deadline,
  status,
  theme
) VALUES (
  CURRENT_DATE + INTERVAL '30 days',
  '14:00:00',
  'America/New_York',
  'https://zoom.us/j/placeholder',
  10,
  CURRENT_DATE + INTERVAL '28 days',
  'upcoming',
  'Managing Surprise Resignations'
);

-- Comments for documentation
COMMENT ON TABLE roundtable_cohorts IS 'Stores roundtable session information including dates, zoom links, and capacity';
COMMENT ON TABLE roundtable_applications IS 'Stores all roundtable applications with automatic scoring and email tracking';
COMMENT ON COLUMN roundtable_applications.score IS 'Automatically calculated score based on qualification criteria (0-100+ range)';
COMMENT ON COLUMN roundtable_applications.escalation_experience IS 'Array of selected escalation experiences';
COMMENT ON COLUMN roundtable_applications.emails_sent IS 'JSON array tracking all emails sent to applicant';
COMMENT ON FUNCTION calculate_roundtable_score IS 'Calculates application score based on company size, industry, retention challenges, and CEO intro openness';
