-- Sample Roundtable Sessions
-- Run this after setting up the schema to create your first roundtables

-- Week 1: The 30-Day Warning System
INSERT INTO roundtables (topic, description, scheduled_at, max_participants)
VALUES (
    'The 30-Day Warning System',
    'How to identify the warning signs 30 days before a team member resigns, and what to do about it.',
    '2025-01-21 12:00:00-05', -- Tuesday, noon ET
    6
);

-- Week 1: The Workload Balance Equation
INSERT INTO roundtables (topic, description, scheduled_at, max_participants)
VALUES (
    'The Workload Balance Equation',
    'Preventing burnout without sacrificing results—finding the sustainable performance sweet spot.',
    '2025-01-23 12:00:00-05', -- Thursday, noon ET
    6
);

-- Week 2: Communication Breakdowns
INSERT INTO roundtables (topic, description, scheduled_at, max_participants)
VALUES (
    'Communication Breakdowns',
    'Fixing the communication patterns that cost you your best people and create inefficiency.',
    '2025-01-28 12:00:00-05', -- Tuesday, noon ET
    6
);

-- Week 2: From Stuck in the Middle to Strategic Leader
INSERT INTO roundtables (topic, description, scheduled_at, max_parameters)
VALUES (
    'From Stuck in the Middle to Strategic Leader',
    'The manager transformation journey—moving beyond task management to strategic leadership.',
    '2025-01-30 12:00:00-05', -- Thursday, noon ET
    6
);

-- Week 3: Repeat the cycle
INSERT INTO roundtables (topic, description, scheduled_at, max_participants)
VALUES (
    'The 30-Day Warning System',
    'How to identify the warning signs 30 days before a team member resigns, and what to do about it.',
    '2025-02-04 12:00:00-05', -- Tuesday, noon ET
    6
);

INSERT INTO roundtables (topic, description, scheduled_at, max_participants)
VALUES (
    'The Workload Balance Equation',
    'Preventing burnout without sacrificing results—finding the sustainable performance sweet spot.',
    '2025-02-06 12:00:00-05', -- Thursday, noon ET
    6
);

-- Verify the roundtables were created
SELECT
    id,
    topic,
    scheduled_at AT TIME ZONE 'America/New_York' as scheduled_at_et,
    max_participants,
    status
FROM roundtables
ORDER BY scheduled_at;

-- Check the upcoming_roundtables view
SELECT * FROM upcoming_roundtables;
