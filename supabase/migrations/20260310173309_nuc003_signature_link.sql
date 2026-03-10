-- =============================================
-- Update Nuc 003 Cold signature: link cloverera.com to /67
-- Displays "cloverera.com" but links to https://cloverera.com/67
-- =============================================

UPDATE sequence_templates
SET body_template = REPLACE(
      body_template,
      'cloverera.com</p>',
      '<a href="https://cloverera.com/67" style="color:#1a1a1a; text-decoration:none;">cloverera.com</a></p>'
    )
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'Nuc 003 Cold');

-- Verify
SELECT position,
       body_template LIKE '%href="https://cloverera.com/67"%' as has_67_link
FROM sequence_templates
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'Nuc 003 Cold')
ORDER BY position;
