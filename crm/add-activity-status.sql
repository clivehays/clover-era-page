-- Add status column to activities table for Kanban board
-- Run this in Supabase SQL Editor

-- Add status column
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'todo'
CHECK (status IN ('todo', 'doing', 'completed'));

-- Set existing activities based on their completed field
UPDATE activities
SET status = CASE
    WHEN completed = true THEN 'completed'
    ELSE 'todo'
END
WHERE status IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);

-- Update the activities table comment
COMMENT ON COLUMN activities.status IS 'Kanban status: todo, doing, or completed';
