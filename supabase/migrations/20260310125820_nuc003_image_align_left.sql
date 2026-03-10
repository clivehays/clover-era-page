-- Align image left instead of centered in Nuc 003 Email 1
UPDATE sequence_templates
SET body_template = REPLACE(
  body_template,
  'text-align:center;margin:24px 0;',
  'margin:24px 0;'
)
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'Nuc 003 Cold')
  AND position = 1;
