-- File: migrations/021_add_book_waitlist_email_tracking.sql
-- Add email tracking columns for the book waitlist email sequence

-- Add columns for tracking which emails have been sent
ALTER TABLE book_waitlist
ADD COLUMN IF NOT EXISTS gift_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gift_email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS launch_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS launch_email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS final_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS final_email_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient filtering by email sent status
CREATE INDEX IF NOT EXISTS idx_book_waitlist_gift_email ON book_waitlist(gift_email_sent) WHERE gift_email_sent = FALSE;
CREATE INDEX IF NOT EXISTS idx_book_waitlist_launch_email ON book_waitlist(launch_email_sent) WHERE launch_email_sent = FALSE;
CREATE INDEX IF NOT EXISTS idx_book_waitlist_reminder_email ON book_waitlist(reminder_email_sent) WHERE reminder_email_sent = FALSE;
CREATE INDEX IF NOT EXISTS idx_book_waitlist_final_email ON book_waitlist(final_email_sent) WHERE final_email_sent = FALSE;
