-- Replace calendly link with /67 in all unsent emails
-- Covers both href and plain text versions of the link

UPDATE outreach_emails
SET body = REPLACE(
      body,
      'https://calendly.com/clive-hays-cloverera/15-mins-what-s-driving-it',
      'https://cloverera.com/67'
    )
WHERE status IN ('draft', 'approved', 'pending_followup', 'scheduled')
  AND body LIKE '%calendly.com/clive-hays-cloverera/15-mins-what-s-driving-it%';

-- Also update sequence_templates so any future regeneration uses the new link
UPDATE sequence_templates
SET body_template = REPLACE(
      body_template,
      'https://calendly.com/clive-hays-cloverera/15-mins-what-s-driving-it',
      'https://cloverera.com/67'
    )
WHERE body_template LIKE '%calendly.com/clive-hays-cloverera/15-mins-what-s-driving-it%';
