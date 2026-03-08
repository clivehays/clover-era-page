-- =============================================
-- Migration 045: C-Suite Cold - Report Turnover Cost Sequence
-- =============================================
-- New 3-email sequence for batch cold outreach to C-Suite
-- Uses report data variables (short format) for turnover cost
-- Timing: Day 0, Day 4, Day 8
-- =============================================

INSERT INTO outreach_sequences (name, description, email_count, delay_days, is_active, sequence_type)
VALUES (
  'C-Suite Cold - Report Turnover Cost',
  '3-email sequence for C-Suite cold outreach. Turnover report attached to Email 1. Short cost figures. Day 0/4/8.',
  3,
  '{0,4,8}',
  true,
  'operational'
);

DO $$
DECLARE
  seq_id UUID;
BEGIN
  SELECT id INTO seq_id FROM outreach_sequences WHERE name = 'C-Suite Cold - Report Turnover Cost';

  -- Email 1 (Day 0)
  INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template, days_delay)
  VALUES (seq_id, 1,
    '{{company_name}}: {{currency_symbol}}{{annual_turnover_cost_short}}',
    '{{first_name}},

{{company_name}} lost {{currency_symbol}}{{annual_turnover_cost_short}} to turnover last year.

You didn''t see it because it''s scattered across recruiting, onboarding, lost productivity, and knowledge walking out the door. The attached report shows where it''s hiding.

Here''s the part that''s happening right now: {{67_day_number}} of your {{employee_count}} employees have already decided to leave. They just haven''t told you yet. Average time between decision and resignation: 67 days.

The question isn''t whether they''re leaving. It''s whether you can see them before they resign.

If the {{currency_symbol}}{{annual_turnover_cost_short}} is in the ballpark, let''s talk about what''s driving it. 15 minutes: {{calendar_link}}

Clive Hays
Co-Founder, Clover ERA
cloverera.com',
    0);

  -- Email 2 (Day 4)
  INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template, days_delay)
  VALUES (seq_id, 2,
    'Re: {{company_name}}: {{currency_symbol}}{{annual_turnover_cost_short}}',
    '{{first_name}},

Following up on the Turnover Intelligence Report I sent last week.

Most CFOs have one of two reactions when they see the {{67_day_number}}-employee number:

(1) It''s inflated.
(2) It''s worse than they thought.

Which was it?

The {{currency_symbol}}{{annual_turnover_cost_short}} shows what turnover cost you last year. The {{67_day_number}} employees in the 67-day window show what''s costing you right now. The difference: last year''s number is a receipt. This year''s number is a forecast you can still change.

If the numbers are in the ballpark, let''s talk about which departments are highest risk. 15 minutes: {{calendar_link}}

Clive',
    4);

  -- Email 3 (Day 8)
  INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template, days_delay)
  VALUES (seq_id, 3,
    '{{company_name}}—last one',
    '{{first_name}},

Last email on this.

The {{67_day_number}} employees in the 67-day window aren''t waiting for culture initiatives or comp reviews. They''re interviewing. The day they resign, the replacement cost starts: {{currency_symbol}}{{cost_per_departure_short}} per person on average.

The companies that prevent this don''t survey people quarterly. They see patterns weekly. Before the resignation letter.

If you want to see what that looks like for {{company_name}}, 15 minutes: {{calendar_link}}

If the timing''s not right, just reply "not now" and I''ll stop following up.

Clive Hays
Co-Founder, Clover ERA',
    8);

END $$;

-- Verify
SELECT s.name, s.sequence_type, s.email_count, s.delay_days,
       count(t.id) as template_count
FROM outreach_sequences s
LEFT JOIN sequence_templates t ON t.sequence_id = s.id
WHERE s.name = 'C-Suite Cold - Report Turnover Cost'
GROUP BY s.id, s.name, s.sequence_type, s.email_count, s.delay_days;
