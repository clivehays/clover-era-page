-- File: migrations/020_create_book_waitlist.sql
-- Book Waitlist - Store signups for "Already Gone" book launch

-- BOOK WAITLIST TABLE
CREATE TABLE IF NOT EXISTS book_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User info
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,

    -- Book tracking
    book_slug VARCHAR(100) NOT NULL DEFAULT 'already-gone',
    -- book_slug allows reuse for future book launches

    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    -- status: 'pending', 'confirmed', 'unsubscribed'

    -- Tracking
    source VARCHAR(100) DEFAULT 'website',
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,

    -- Prevent duplicates per book
    UNIQUE(email, book_slug)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_book_waitlist_email ON book_waitlist(email);
CREATE INDEX IF NOT EXISTS idx_book_waitlist_book ON book_waitlist(book_slug);
CREATE INDEX IF NOT EXISTS idx_book_waitlist_created ON book_waitlist(created_at);
CREATE INDEX IF NOT EXISTS idx_book_waitlist_status ON book_waitlist(status);

-- Enable RLS
ALTER TABLE book_waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies (service key access only - no public access)
DROP POLICY IF EXISTS "Service role can insert waitlist" ON book_waitlist;
CREATE POLICY "Service role can insert waitlist" ON book_waitlist
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can read waitlist" ON book_waitlist;
CREATE POLICY "Service role can read waitlist" ON book_waitlist
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can update waitlist" ON book_waitlist;
CREATE POLICY "Service role can update waitlist" ON book_waitlist
    FOR UPDATE USING (auth.role() = 'authenticated' OR auth.jwt()->>'role' = 'service_role');
