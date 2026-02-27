-- =============================================
-- Migration 030: Dual-Funnel Email Sequences
-- =============================================
-- Adds:
-- 1. sequence_type column to outreach_sequences
-- 2. LinkedIn + salary fields to outreach_prospects
-- 3. Sequence 1: Operational Buyer - Turnover Cost (3 emails)
-- 4. Sequence 2: LinkedIn Commenter - Assessment Path (2 emails)
-- =============================================

-- Section 1: Schema Changes
-- =============================================

-- Add sequence_type to distinguish funnel paths
ALTER TABLE outreach_sequences ADD COLUMN IF NOT EXISTS sequence_type TEXT DEFAULT 'operational';

-- Tag existing sequences
UPDATE outreach_sequences SET sequence_type = 'operational' WHERE name LIKE '%CEO%' OR name LIKE '%Cold Outreach%';
UPDATE outreach_sequences SET sequence_type = 'broadcast' WHERE name LIKE '%Book%' OR name LIKE '%Already%';

-- Add LinkedIn fields to outreach_prospects (for Sequence 2)
ALTER TABLE outreach_prospects ADD COLUMN IF NOT EXISTS post_number TEXT;
ALTER TABLE outreach_prospects ADD COLUMN IF NOT EXISTS post_topic TEXT;
ALTER TABLE outreach_prospects ADD COLUMN IF NOT EXISTS comment_text TEXT;

-- Add estimated avg salary for turnover calculations (Sequence 1)
ALTER TABLE outreach_prospects ADD COLUMN IF NOT EXISTS estimated_avg_salary INTEGER DEFAULT 85000;

-- Add country for currency symbol detection
ALTER TABLE outreach_prospects ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'United States';

-- =============================================
-- Section 2: Sequence 1 - Operational Buyer - Turnover Cost
-- =============================================
-- 3-email sequence for CFO/CEO/COO at 200-1000+ employee companies
-- Goal: Book 15-minute Turnover Analysis call
-- Timing: Day 0 (manual), Day 7 (auto), Day 14 (auto)

INSERT INTO outreach_sequences (name, description, email_count, delay_days, is_active, sequence_type)
VALUES (
  'Operational Buyer - Turnover Cost',
  '3-email sequence for CFO/CEO/COO. Turnover cost contradiction approach with Intelligence Report. Day 0/7/14.',
  3,
  '{0,7,14}',
  true,
  'operational'
);

DO $$
DECLARE
  seq_id UUID;
BEGIN
  SELECT id INTO seq_id FROM outreach_sequences WHERE name = 'Operational Buyer - Turnover Cost';

  -- Email 1: Short intro + PDF attachment (Day 0 - Manual Send)
  INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template, days_delay)
  VALUES (seq_id, 1,
    '{{company_name}}: {{currency_symbol}}{{annual_turnover_cost_formatted}}',
    '{{first_name}},

Most CFOs track turnover rate. Almost none track turnover cost.

I ran the numbers for {{company_name}}. They''re in the attached report.

{{custom_company_reference}}

If you want to walk through what I found, I''m here: {{calendar_link}}

Clive Hays
Co-Founder, Clover ERA
cloverera.com | clive.hays@cloverera.com',
    0);

  -- Email 2: Value Reinforcement (Day 7 - Automated)
  INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template, days_delay)
  VALUES (seq_id, 2,
    'The ${{daily_cost_formatted}} question',
    '{{first_name}},

Following up on the Turnover Intelligence Report I sent last week.

The number that matters: ${{daily_cost_formatted}} per day.

That''s what {{company_name}} is losing to turnover you can''t see yet. Not the people who quit yesterday. The {{67_day_number}} who''ve already decided but are still showing up.

Most companies treat this as an HR problem. It''s not. It''s a P&L problem hiding in:
-> Productivity loss (6-8 months to replacement productivity)
-> Knowledge drain (undocumented processes walk out the door)
-> Team disruption (remaining team compensates, burns out, follows)
-> Recruiting/training (the only cost you''re actually tracking)

You''re tracking #4. You''re missing #1-3.

15 minutes: I''ll show you where the cost is actually sitting and which departments are highest risk.

{{calendar_link}}

Clive Hays
Co-Founder, Clover ERA
cloverera.com',
    7);

  -- Email 3: Social Proof + Final Touch (Day 14 - Automated)
  INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template, days_delay)
  VALUES (seq_id, 3,
    '{{company_name}} + {{67_day_number}} people',
    '{{first_name}},

Last email on this.

I''ve been running these Turnover Intelligence Reports for leaders at mid-market {{industry}} companies for the past 18 months. The pattern I see:

Companies tracking turnover rate (12%) think they have a manageable problem.
Companies tracking turnover cost (${{annual_turnover_cost_formatted}}) realize they have an invisible budget leak.

The {{67_day_number}} people who''ve already mentally checked out at {{company_name}}. They''re not waiting for you to fix culture or raise salaries. They''re interviewing. The day they resign, the clock starts on a ${{cost_per_departure_formatted}} replacement cost.

You can know which departments, which managers, which teams are highest risk. Or you can find out the day someone hands you a resignation letter.

{{calendar_link}}

If the timing''s not right, no worries. Just let me know and I''ll stop following up.

Clive Hays
Co-Founder, Clover ERA
Already Gone: 78 Ways to Miss Someone Leaving
cloverera.com',
    14);

END $$;

-- =============================================
-- Section 3: Sequence 2 - LinkedIn Commenter - Assessment Path
-- =============================================
-- 2-email sequence for managers who commented on LinkedIn posts
-- Goal: Assessment + 14-day trial
-- Timing: Day 0 (manual), Day 5 (auto)

INSERT INTO outreach_sequences (name, description, email_count, delay_days, is_active, sequence_type)
VALUES (
  'LinkedIn Commenter - Assessment Path',
  '2-email sequence for managers who commented on LinkedIn posts. Paranoia trigger + book preview. Day 0/5.',
  2,
  '{0,5}',
  true,
  'self_serve'
);

DO $$
DECLARE
  seq_id UUID;
BEGIN
  SELECT id INTO seq_id FROM outreach_sequences WHERE name = 'LinkedIn Commenter - Assessment Path';

  -- Email 1: Paranoia Trigger (Day 0 - Manual Send)
  -- Subject and body components are Claude-generated
  INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template, days_delay)
  VALUES (seq_id, 1,
    '{{subject_line}}',
    'Hi {{first_name}},

{{opening_hook}}

{{mirror_statement}}

{{trap_question}}

We built a 2-minute assessment that flags where these patterns might be happening: cloverera.com/assessment. It''s designed to surface the person you''re not thinking about.

If it flags someone, you can run daily check-ins for your team free for 14 days. No card, no pitch: cloverera.com/get/

{{closing_question}}

Clive
Clover ERA | contact@cloverera.com',
    0);

  -- Email 2: Book Preview + Repeat Trap (Day 5 - Automated)
  INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template, days_delay)
  VALUES (seq_id, 2,
    'something you might find useful',
    'Hi {{first_name}},

Quick follow-up. Neil and I wrote a short book called Already Gone. 78 real patterns of how managers miss the signs before someone leaves. Preview attached if it''s useful.

{{trap_question}}

If that question made you think of someone specific, the assessment might tell you something you need to hear: cloverera.com/assessment

Either way, appreciated your comment on the post.

Clive
Clover ERA | contact@cloverera.com',
    5);

END $$;

-- =============================================
-- Section 4: Verify
-- =============================================
SELECT s.name, s.sequence_type, s.email_count, s.delay_days,
       count(t.id) as template_count
FROM outreach_sequences s
LEFT JOIN sequence_templates t ON t.sequence_id = s.id
GROUP BY s.id, s.name, s.sequence_type, s.email_count, s.delay_days
ORDER BY s.created_at;
