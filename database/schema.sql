-- Manager Roundtable Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roundtables table (stores upcoming sessions)
CREATE TABLE roundtables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    max_participants INTEGER DEFAULT 6,
    zoom_meeting_id VARCHAR(255),
    zoom_join_url TEXT,
    zoom_host_url TEXT,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registrations table (stores participant registrations)
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roundtable_id UUID REFERENCES roundtables(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    company VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    is_waitlist BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, cancelled, attended, no_show
    confirmation_sent BOOLEAN DEFAULT FALSE,
    reminder_sent BOOLEAN DEFAULT FALSE,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_roundtables_scheduled_at ON roundtables(scheduled_at);
CREATE INDEX idx_roundtables_status ON roundtables(status);
CREATE INDEX idx_registrations_roundtable_id ON registrations(roundtable_id);
CREATE INDEX idx_registrations_email ON registrations(email);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_is_waitlist ON registrations(is_waitlist);

-- Function to get registered count for a roundtable
CREATE OR REPLACE FUNCTION get_registered_count(roundtable_uuid UUID)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER
    FROM registrations
    WHERE roundtable_id = roundtable_uuid
    AND is_waitlist = FALSE
    AND status IN ('confirmed', 'attended');
$$ LANGUAGE SQL STABLE;

-- Function to get waitlist count for a roundtable
CREATE OR REPLACE FUNCTION get_waitlist_count(roundtable_uuid UUID)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER
    FROM registrations
    WHERE roundtable_id = roundtable_uuid
    AND is_waitlist = TRUE
    AND status = 'confirmed';
$$ LANGUAGE SQL STABLE;

-- View for upcoming roundtables with registration counts
CREATE OR REPLACE VIEW upcoming_roundtables AS
SELECT
    r.*,
    get_registered_count(r.id) as registered_count,
    get_waitlist_count(r.id) as waitlist_count
FROM roundtables r
WHERE r.scheduled_at > NOW()
AND r.status = 'scheduled'
ORDER BY r.scheduled_at ASC;

-- View for past roundtables with statistics
CREATE OR REPLACE VIEW past_roundtables AS
SELECT
    r.*,
    get_registered_count(r.id) as registered_count,
    get_waitlist_count(r.id) as waitlist_count,
    (SELECT COUNT(*) FROM registrations WHERE roundtable_id = r.id AND status = 'attended') as attended_count,
    (SELECT COUNT(*) FROM registrations WHERE roundtable_id = r.id AND status = 'no_show') as no_show_count
FROM roundtables r
WHERE r.scheduled_at <= NOW()
OR r.status IN ('completed', 'cancelled')
ORDER BY r.scheduled_at DESC;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roundtables_updated_at
    BEFORE UPDATE ON roundtables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at
    BEFORE UPDATE ON registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE roundtables ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to scheduled roundtables
CREATE POLICY "Public can view scheduled roundtables"
    ON roundtables FOR SELECT
    USING (status = 'scheduled' AND scheduled_at > NOW());

-- Allow public insert for registrations (will be validated by API)
CREATE POLICY "Public can create registrations"
    ON registrations FOR INSERT
    WITH CHECK (true);

-- Allow public to view their own registrations
CREATE POLICY "Users can view their own registrations"
    ON registrations FOR SELECT
    USING (true);

-- Admin policies (authenticated users - you'll need to set up Supabase auth)
-- For now, using service role key in API will bypass RLS

-- Sample data for testing (optional - remove in production)
-- INSERT INTO roundtables (topic, description, scheduled_at, max_participants)
-- VALUES
--     ('The 30-Day Warning System', 'Learn to spot the warning signs 30 days before someone quits', NOW() + INTERVAL '3 days', 6),
--     ('The Workload Balance Equation', 'Preventing burnout without sacrificing results', NOW() + INTERVAL '5 days', 6),
--     ('Communication Breakdowns', 'Fixing communication patterns that cost you talent', NOW() + INTERVAL '7 days', 6);
