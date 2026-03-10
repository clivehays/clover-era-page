-- =============================================
-- Migration 054: Nuc 003 Cold - Add Emails 4, 5, 6
-- =============================================
-- Adds 3 new follow-up emails to extend the sequence from 3 to 6 emails
-- Email 4: THE GAP (Day 21) - "Three weeks, still bleeding"
-- Email 5: THE PATTERN (Day 28) - "Already Gone signals"
-- Email 6: THE ULTIMATUM (Day 33) - "Last email"
-- =============================================

-- Update sequence email_count and delay_days
UPDATE outreach_sequences
SET email_count = 6,
    delay_days = '{0,4,8,21,28,33}'
WHERE name = 'Nuc 003 Cold';

-- EMAIL 4: THE GAP (Day 21 after Email 1)
INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template, days_delay)
SELECT s.id, 4,
  '{{first_name}}—still ${{daily_cost_short}}/day',
  '<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #1a1a1a;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #ffffff;
}
p {
  margin: 0 0 16px 0;
}
strong {
  font-weight: 600;
  color: #000000;
}
em {
  font-style: italic;
}
.cost-highlight {
  font-weight: 700;
  color: #c7254e;
  font-size: 17px;
}
.divider {
  border: 0;
  border-top: 1px solid #e0e0e0;
  margin: 24px 0;
}
.since-then {
  margin: 20px 0;
  padding: 16px;
  background-color: #fff5f5;
  border-left: 3px solid #c7254e;
}
.since-then ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}
.since-then li {
  margin-bottom: 8px;
}
.cta-section {
  margin: 32px 0;
  text-align: left;
}
.cta-button {
  display: inline-block;
  padding: 14px 28px;
  background-color: #c7254e;
  color: #ffffff !important;
  text-decoration: none;
  font-weight: 600;
  border-radius: 4px;
  margin: 8px 0;
}
.signature {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}
.signature-name {
  font-weight: 600;
  margin-bottom: 4px;
}
.ps-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
  font-style: italic;
  color: #4a4a4a;
}
@media only screen and (max-width: 480px) {
  body {
    font-size: 15px;
    padding: 16px;
  }
  .cta-button {
    display: block;
    text-align: center;
    padding: 16px 20px;
  }
}
</style>
</head>
<body>

<p>{{first_name}},</p>

<p>Three weeks ago I told you {{company_name}} was losing ${{total_annual_cost_short}} to turnover. You saw the number. You didn''t book the call.</p>

<p>I get it. You''re busy. Or you think the number''s inflated. Or you think you''re good.</p>

<p>But here''s what''s happened in the last 23 days:</p>

<div class="since-then">
  <ul>
    <li>Someone on your team had a second interview</li>
    <li>Someone else got a written offer</li>
    <li>Someone who was "fine" three weeks ago just started updating their LinkedIn profile</li>
  </ul>
</div>

<p>You didn''t see any of it. That''s the problem.</p>

<hr class="divider">

<p>The <strong>{{67_day_employees}} people</strong> I flagged? They''re still in the 67-day window. They''re still planning their exit. And you''re still flying blind.</p>

<p>Most CEOs/CFOs/COOs assume silence means stability. It doesn''t. Silence means you''re not looking. And while you''re not looking, people are leaving.</p>

<hr class="divider">

<p>I''ll give you one more shot at seeing what''s actually happening before someone resigns and you''re stuck explaining to the board why you didn''t see it coming.</p>

<div class="cta-section">
  <p>15 minutes:</p>
  <a href="{{calendar_link}}" class="cta-button">Book the call</a>
</div>

<p>Or don''t. And when the next resignation lands, you can tell yourself you were too busy to spend 15 minutes preventing it.</p>

<div class="signature">
  <p class="signature-name">Clive Hays</p>
  <p>Co-Founder, Clover ERA<br>
  cloverera.com</p>
</div>

<div class="ps-section">
  <p><strong>P.S.</strong> The last CFO who ignored the number? Lost his VP of Operations six weeks later. <span class="cost-highlight">$520K replacement cost.</span> He told me: "I thought we were good." Yeah. Everyone does.</p>
</div>

</body>
</html>',
  21
FROM outreach_sequences s WHERE s.name = 'Nuc 003 Cold';


-- EMAIL 5: THE PATTERN (Day 28 after Email 1)
INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template, days_delay)
SELECT s.id, 5,
  'Re: {{first_name}}—still ${{daily_cost_short}}/day',
  '<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #1a1a1a;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #ffffff;
}
p {
  margin: 0 0 16px 0;
}
strong {
  font-weight: 600;
  color: #000000;
}
em {
  font-style: italic;
}
.cost-highlight {
  font-weight: 700;
  color: #c7254e;
  font-size: 17px;
}
.divider {
  border: 0;
  border-top: 1px solid #e0e0e0;
  margin: 24px 0;
}
.already-gone-section {
  margin: 20px 0;
  padding: 16px;
  background-color: #f9f9f9;
  border-left: 4px solid #c7254e;
}
.cta-section {
  margin: 32px 0;
  text-align: left;
}
.cta-button {
  display: inline-block;
  padding: 14px 28px;
  background-color: #c7254e;
  color: #ffffff !important;
  text-decoration: none;
  font-weight: 600;
  border-radius: 4px;
  margin: 8px 0;
}
.signature {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}
.signature-name {
  font-weight: 600;
  margin-bottom: 4px;
}
.ps-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
  font-style: italic;
  color: #4a4a4a;
}
@media only screen and (max-width: 480px) {
  body {
    font-size: 15px;
    padding: 16px;
  }
  .cta-button {
    display: block;
    text-align: center;
    padding: 16px 20px;
  }
}
</style>
</head>
<body>

<p>{{first_name}},</p>

<p>Four weeks ago I told you about {{company_name}}''s <span class="cost-highlight">${{total_annual_cost_short}}</span> turnover cost. You didn''t act.</p>

<p>That''s fine. Most leaders don''t act until after someone resigns. They wait for proof. Then they get it. And it costs <span class="cost-highlight">${{cost_per_departure_short}}</span> per person.</p>

<p>Here''s what you''re missing right now:</p>

<div class="already-gone-section">
  <p><strong>The Already Gone signals.</strong></p>

  <p>Your people don''t wake up one day and resign. They withdraw first. Slowly. Over weeks. They stop pushing back in meetings. They stop asking questions in 1:1s. They go from "why are we doing it this way?" to "sounds good" to "just staying in my lane."</p>

  <p>You''ve seen it. You just didn''t know what you were looking at.</p>
</div>

<hr class="divider">

<p>That''s not a management problem. That''s a visibility problem. You''re measuring engagement once a quarter with a survey. We measure it <strong>every day</strong> with behavior.</p>

<p>And right now, <strong>{{67_day_employees}}</strong> of your people are showing Already Gone patterns. You won''t know which ones until they hand you a letter. Unless you start seeing the signals before the resignation.</p>

<div class="cta-section">
  <p>15 minutes:</p>
  <a href="{{calendar_link}}" class="cta-button">Book the call</a>
</div>

<hr class="divider">

<p>You''re still making the same mistake you made four weeks ago. You''re waiting for proof that someone''s leaving. By the time you get proof, they''re gone.</p>

<div class="signature">
  <p class="signature-name">Clive Hays</p>
  <p>Co-Founder, Clover ERA</p>
</div>

<div class="ps-section">
  <p><strong>P.S.</strong> My co-author Neil and I documented 78 Already Gone signals. The book is called <em>Already Gone: 78 Ways to Miss Someone Leaving</em> - find it on Amazon. Every CEO who''s read it has said the same thing: "I''ve seen this. I just didn''t know it was a pattern."</p>
</div>

</body>
</html>',
  7
FROM outreach_sequences s WHERE s.name = 'Nuc 003 Cold';


-- EMAIL 6: THE ULTIMATUM (Day 33 after Email 1)
INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template, days_delay)
SELECT s.id, 6,
  '{{first_name}}—last one',
  '<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #1a1a1a;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #ffffff;
}
p {
  margin: 0 0 16px 0;
}
strong {
  font-weight: 600;
  color: #000000;
}
em {
  font-style: italic;
}
.cost-highlight {
  font-weight: 700;
  color: #c7254e;
  font-size: 17px;
}
.divider {
  border: 0;
  border-top: 1px solid #e0e0e0;
  margin: 24px 0;
}
.since-then {
  margin: 20px 0;
  padding: 16px;
  background-color: #fff5f5;
  border-left: 3px solid #c7254e;
}
.since-then ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}
.since-then li {
  margin-bottom: 8px;
}
.cta-section {
  margin: 32px 0;
  text-align: left;
}
.cta-button {
  display: inline-block;
  padding: 14px 28px;
  background-color: #c7254e;
  color: #ffffff !important;
  text-decoration: none;
  font-weight: 600;
  border-radius: 4px;
  margin: 8px 0;
}
.signature {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}
.signature-name {
  font-weight: 600;
  margin-bottom: 4px;
}
@media only screen and (max-width: 480px) {
  body {
    font-size: 15px;
    padding: 16px;
  }
  .cta-button {
    display: block;
    text-align: center;
    padding: 16px 20px;
  }
}
</style>
</head>
<body>

<p>{{first_name}},</p>

<p><strong>This is the last email.</strong></p>

<p>Five weeks ago I told you {{67_day_employees}} of your people had already decided to leave. You didn''t act.</p>

<p>Since then:</p>

<div class="since-then">
  <ul>
    <li>At least two of them have had final-round interviews</li>
    <li>One of them has a written offer on the table</li>
    <li>You''ve had 83 meetings, sent 600 emails, and put out a dozen fires</li>
  </ul>
</div>

<p>And you did <strong>nothing</strong> about the <span class="cost-highlight">${{total_annual_cost_short}}</span> problem that''s happening right now.</p>

<hr class="divider">

<p>I''m not following up again. If you want to see which of your {{67_day_employees}} people are in final rounds, which teams have multiple in the window, and which resignation triggers the cascade, here''s the link:</p>

<div class="cta-section">
  <a href="{{calendar_link}}" class="cta-button">Book the call</a>
</div>

<p>If you don''t, that''s fine. You''ll see it in two weeks when someone resigns. And then again a month later. And then again six weeks after that.</p>

<hr class="divider">

<p>The CEO who lost his VP of Engineering? He''s a customer now. Six months in. Zero unplanned resignations since he started seeing the 67-day patterns.</p>

<p>He told me last week: <em>"I can''t believe I almost didn''t take the call."</em></p>

<p>Yeah. Me neither.</p>

<div class="signature">
  <p class="signature-name">Clive Hays</p>
  <p>Co-Founder, Clover ERA<br>
  cloverera.com</p>
</div>

</body>
</html>',
  5
FROM outreach_sequences s WHERE s.name = 'Nuc 003 Cold';


-- Verify all 6 templates
SELECT s.name, t.position, t.days_delay, t.subject_template,
       t.body_template LIKE '%<!DOCTYPE%' as is_full_html,
       LENGTH(t.body_template) as template_length
FROM sequence_templates t
JOIN outreach_sequences s ON s.id = t.sequence_id
WHERE s.name = 'Nuc 003 Cold'
ORDER BY t.position;
