-- =============================================
-- Migration 051: Nuc 003 Cold Sequence
-- =============================================
-- Nuclear 3-email cold outreach sequence
-- Uses turnover report data + derived variables (senior cost, cascade projections)
-- Timing: Day 0, Day 4, Day 8 (same as C-Suite Cold)
-- Email 1 includes inline screenshot image
-- =============================================

INSERT INTO outreach_sequences (name, description, email_count, delay_days, is_active, sequence_type)
VALUES (
  'Nuc 003 Cold',
  'Nuclear 3-email cold sequence. Aggressive turnover cost messaging with inline screenshot. Day 0/4/8.',
  3,
  '{0,4,8}',
  true,
  'operational'
);

DO $$
DECLARE
  seq_id UUID;
BEGIN
  SELECT id INTO seq_id FROM outreach_sequences WHERE name = 'Nuc 003 Cold';

  -- Email 1 (Day 0): NUCLEAR + SCREENSHOT
  INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template, days_delay)
  VALUES (seq_id, 1,
    '{{first_name}}—{{currency_symbol}}{{cost_per_departure_short}}',
    '{{first_name}},

Someone on your team has an offer.

Not "thinking about leaving."
Not "looking around."

They have an offer. In writing. And they''re about to accept it.

You''re going to lose {{currency_symbol}}{{cost_per_departure_short}} replacing them. If they''re senior technical or leadership, {{currency_symbol}}{{cost_per_departure_senior_short}}. If two more people start looking when they see the first one resign—and they will—you''re at {{currency_symbol}}{{cost_three_departures_short}} in 90 days.

You didn''t see it coming because you''re not looking.

{{67_day_employees}} of your {{employee_count}} people have already decided to leave. They made the decision weeks ago. They''re interviewing at night. Updating LinkedIn on weekends. Taking "dentist appointments" for final rounds.

And you think everything''s fine because they''re still showing up.

They''re showing up because they''re professional. Not because they''re staying.

Last year this cost you {{currency_symbol}}{{total_annual_cost_short}}. Recruiting. Onboarding. Lost deals. Blown timelines. Projects that died because the person who knew how to do it walked out the door and took the knowledge with them.

This year you''re going to lose more. Unless you do something this week.

The CEO I talked to on Monday lost his VP of Engineering on Thursday. Didn''t see it coming. "She seemed fine," he said. She''d been interviewing for six weeks. $520K replacement cost. Two of her directs resigned the following week.

He called me back on Friday and said: "I should''ve taken the call when you first reached out."

Yeah. He should have.

I can''t tell you which specific person—Clover ERA is anonymous, that''s the only reason they tell the truth.

But I can show you this:

<img src="https://drugebiitlcjkknjfxeh.supabase.co/storage/v1/object/public/outreach-attachments/email-images/team-member-withdrawing.jpg" alt="Clover ERA behavioral insight showing team member withdrawal pattern" style="max-width: 100%; width: 600px; border-radius: 8px; margin: 16px 0;" />

This is what Clover ERA found in a 12-person team last week. The manager had no idea.

"I just stay in my lane and do my work."

That''s not neutrality. That''s someone who''s already given up trying. The resignation letter came 11 days later.

Do you have someone on your team saying this right now?

I can show you which teams have someone in the 67-day window, which roles cost the most when they walk, and what the next 90 days look like if you keep operating blind.

Book the call: {{calendar_link}}

Or don''t.

And when someone resigns next week—and someone will—you can tell yourself you didn''t have time for a 15-minute conversation that would''ve cost you nothing and saved you a quarter million dollars.

Your call.

Clive Hays
Co-Founder, Clover ERA
cloverera.com

P.S. You''re wondering if this is real or if I''m just trying to scare you into a meeting. It''s real. And you''re about to find out the expensive way.',
    0);

  -- Email 2 (Day 4): THE PATTERN
  INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template, days_delay)
  VALUES (seq_id, 2,
    'Re: {{first_name}}—{{currency_symbol}}{{cost_per_departure_short}}',
    '{{first_name}},

You didn''t book the call.

That means one of three things:

You don''t believe {{67_day_employees}} of your people have already decided to leave
You believe it, but you think you''d see it if it were true
You believe it, you know you can''t see it, and you''re hoping it''s not as bad as I said
It''s worse.

Because the {{67_day_employees}} people in the 67-day window aren''t your problem. The pattern is.

When one person resigns, it doesn''t just cost you {{currency_symbol}}{{cost_per_departure_short}}. It sends a signal to everyone who was on the fence: "If they''re leaving, maybe I should too."

That''s how {{67_day_employees}} becomes {{cascade_count_step2}}.
That''s how {{currency_symbol}}{{total_annual_cost_short}} becomes {{currency_symbol}}{{cascade_annual_cost_short}}.
That''s how "manageable attrition" becomes "we can''t hire fast enough to replace the people walking out."

The CEO I mentioned in my last email? The one who lost his VP of Engineering?

He didn''t just lose her. He lost two of her directs the following week. Then another one three weeks later. Four people in 30 days. $1.4M in replacement costs.

He called it a "leadership crisis."

I called it Tuesday.

Because I can see the pattern. You can''t. Yet.

Here''s what you''re missing right now:

Which of your {{67_day_employees}} are in final rounds (one is)
Which teams have multiple people in the 67-day window (three do)
Which resignation triggers the cascade (it''s not who you think)
I can show you all of it. 15 minutes: {{calendar_link}}

Or you can wait for the first resignation letter and spend the next six months playing whack-a-mole with departures you didn''t see coming.

The cost is the same either way: {{currency_symbol}}{{cost_per_departure_short}} per person.

The only difference is whether you see them before they resign or after.

Clive Hays
Co-Founder, Clover ERA
cloverera.com

P.S. The manager who saw that "I just stay in my lane and do my work" message? She told me after the resignation: "Looking back, I should''ve known. But I didn''t know what I was looking for."

That''s the problem. You don''t know what you''re looking for. I do.',
    4);

  -- Email 3 (Day 8): THE ULTIMATUM
  INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template, days_delay)
  VALUES (seq_id, 3,
    '{{first_name}}—last one',
    '{{first_name}},

Last email.

Eight days ago I told you {{67_day_employees}} of your people have already decided to leave.

Since then:

One of them had a final-round interview
Another negotiated an offer
A third updated their LinkedIn and got contacted by two recruiters
And you did nothing.

I get it. You''re busy. You have fires to put out. Board decks to build. Investors to update. This feels like something you can "get to later."

You can''t.

Because "later" is when the resignation letter lands. And by then you''re not preventing turnover. You''re reacting to it.

{{currency_symbol}}{{cost_per_departure_short}} per person.
{{currency_symbol}}{{cost_three_departures_short}} if the departure triggers two more.
{{currency_symbol}}{{total_annual_cost_short}} last year.
{{currency_symbol}}{{cascade_annual_cost_short}} this year if the pattern holds.

The companies that prevent this aren''t smarter than you. They''re not better at culture or compensation or career pathing.

They just see the problem before the resignation letter.

That''s it. That''s the entire difference.

They see someone withdrawing—"I just stay in my lane and do my work"—and they intervene. Before the person has an offer. Before they''ve mentally checked out. Before the decision is irreversible.

You''re operating blind. You don''t know which of your {{67_day_employees}} are withdrawing. You don''t know which teams are highest risk. You don''t know which resignation triggers the cascade.

I can show you. 15 minutes: {{calendar_link}}

After this email, I''m done following up.

If you want to see which of your {{67_day_employees}} are in the 67-day window, which roles cost the most to lose, and what the next 90 days look like if you do nothing—book the call.

If not, I''ll see you in six months when you''re trying to figure out why you lost eight people in Q2 and your recruiting budget is blown.

Your call.

Clive Hays
Co-Founder, Clover ERA
cloverera.com

P.S. The CEO who lost his VP of Engineering? He''s a customer now. Four months in. Zero unplanned resignations since he started seeing the 67-day patterns.

He told me last week: "I can''t believe I almost didn''t take the call."

Yeah. Me neither.',
    8);

END $$;

-- Verify
SELECT s.name, s.sequence_type, s.email_count, s.delay_days,
       count(t.id) as template_count
FROM outreach_sequences s
LEFT JOIN sequence_templates t ON t.sequence_id = s.id
WHERE s.name = 'Nuc 003 Cold'
GROUP BY s.id, s.name, s.sequence_type, s.email_count, s.delay_days;
