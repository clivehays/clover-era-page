#!/bin/bash

echo "Optimizing short meta descriptions..."

# 1. Blog/workplace-quietly-cracking-under-pressure.html (26 chars - TRUNCATED)
sed -i 's/<meta name="description" content="82% burnout globally with "/<meta name="description" content="82% burnout globally with workplace stress silently cracking employees. Discover the hidden signs and prevention strategies backed by neuroscience."/g' Blog/workplace-quietly-cracking-under-pressure.html && echo "✓ Blog post"

# 2. early-adopter-program.html (15 chars - TRUNCATED)
sed -i 's/<meta name="description" content="Join Clover ERA"/<meta name="description" content="Join Clover ERA early adopter program. Get 3-year locked pricing, direct founder support, and shape the future of AI-powered employee engagement."/g' early-adopter-program.html && echo "✓ Early adopter"

# 3. how-it-works.html (45 chars - too short)
sed -i 's/<meta name="description" content="Transform employee engagement with Clover ERA"/<meta name="description" content="Transform employee engagement with Clover ERA'\''s 30-second daily pulse checks. Anonymous feedback, real-time dashboards, proven CLOVER framework."/g' how-it-works.html && echo "✓ How it works"

# 4. neuroscience-of-employee-engagement/index.html (16 chars - TRUNCATED)
sed -i 's/<meta name="description" content="Free preview of "/<meta name="description" content="Free preview of The Neuroscience of Employee Engagement. Discover brain-based strategies to boost motivation, reduce burnout, improve retention."/g' neuroscience-of-employee-engagement/index.html && echo "✓ Neuroscience page"

# 5. tech-ceo-guide/index.html (31 chars - TRUNCATED)
sed -i 's/<meta name="description" content="Tech CEOs: Your developers aren"/<meta name="description" content="Tech CEOs: Your developers aren'\''t lazy—they'\''re burned out. Stop the exodus with neuroscience-backed strategies that reduce turnover by 47%."/g' tech-ceo-guide/index.html && echo "✓ Tech CEO guide"

# 6. terms.html (15 chars - TRUNCATED)
sed -i 's/<meta name="description" content="Read Clover ERA"/<meta name="description" content="Read Clover ERA terms of service. Clear, transparent terms for employee engagement platform. Updated policies for USA, UK, and European users."/g' terms.html && echo "✓ Terms"

# 7. the-brain-chemistry-audit/index.html (13 chars - TRUNCATED)
sed -i 's/<meta name="description" content="Discover what"/<meta name="description" content="Discover what brain chemistry reveals about your workplace engagement. Free diagnostic audit identifies burnout risks and retention issues in 5 minutes."/g' the-brain-chemistry-audit/index.html && echo "✓ Brain chemistry audit"

# 8. our-science.html (66 chars - expand slightly)
sed -i 's/<meta name="description" content="Discover the scientific research and methodology behind Clover ERA"/<meta name="description" content="Discover the scientific research and methodology behind Clover ERA. Neuroscience-based employee engagement backed by 20+ years Fortune 500 experience."/g' our-science.html && echo "✓ Our science"

# 9. pricing/index.html (65 chars - expand)
sed -i 's/<meta name="description" content="Transform employee engagement and prevent burnout with Clover Era"/<meta name="description" content="Transform employee engagement and prevent burnout with Clover Era. Simple pricing: $0.20\/employee\/day. 30-day free trial. ROI in first month."/g' pricing/index.html && echo "✓ Pricing"

# 10. resources-hub/index.html (101 chars - expand to 120)
sed -i 's/<meta name="description" content="Free employee engagement resources, guides, tools. Learn what engagement really is, measure your team"/<meta name="description" content="Free employee engagement resources, guides, tools and calculators. Learn what engagement really is, measure your team, get actionable strategies."/g' resources-hub/index.html && echo "✓ Resources hub"

# 11. hybrid-working-issues/index.html (68 chars - expand)
sed -i 's/<meta name="description" content="Solve challenges of hybrid office culture with proven strategies. UK"/<meta name="description" content="Solve hybrid working challenges with proven strategies. Combat isolation, maintain culture, boost engagement in remote and office teams across UK."/g' hybrid-working-issues/index.html && echo "✓ Hybrid working"

echo ""
echo "Done! Optimized 11 short meta descriptions."
