#!/bin/bash

echo "Trimming long meta descriptions to 160 chars or less..."

# 1. active-employee-engagement-management/index.html (162 → 155)
sed -i 's/<meta name="description" content="Forget massive transformations. Real change happens through micro-actions your managers will actually do. See how 1% daily improvements compound into 37x results.">/<meta name="description" content="Forget massive transformations. Real change through micro-actions managers actually do. See how 1% daily improvements compound into 37x results.">/g' active-employee-engagement-management/index.html && echo "✓ Active management"

# 2. burnout/index.html (162 → 158)
sed -i 's/<meta name="description" content="Employee burnout affects 73% of workers, driving employee turnover rates to crisis levels. Proven burnout solutions reduce turnover. Calculate your burnout costs.">/<meta name="description" content="Employee burnout affects 73% of workers, driving turnover to crisis levels. Proven solutions reduce burnout and turnover. Calculate your costs today.">/g' burnout/index.html && echo "✓ Burnout"

# 3. locations/birmingham/index.html (184 → 157)
sed -i 's/<meta name="description" content="Transform your Birmingham workplace with neuroscience-backed employee engagement strategies. Reduce burnout, boost productivity in manufacturing, automotive, and professional services.">/<meta name="description" content="Transform Birmingham workplace with neuroscience-backed engagement. Reduce burnout, boost productivity in manufacturing, automotive, professional services.">/g' locations/birmingham/index.html && echo "✓ Birmingham"

# 4. locations/glasgow/index.html (167 → 155)
sed -i 's/<meta name="description" content="Transform your Glasgow workplace with neuroscience-backed employee engagement strategies. Reduce burnout in financial services, manufacturing, and creative industries.">/<meta name="description" content="Transform Glasgow workplace with neuroscience-backed engagement. Reduce burnout in financial services, manufacturing, and creative industries.">/g' locations/glasgow/index.html && echo "✓ Glasgow"

# 5. locations/london/index.html (171 → 157)
sed -i 's/<meta name="description" content="Transform your London workplace with neuroscience-backed employee engagement solutions. Reduce burnout, boost productivity, and improve retention across London businesses.">/<meta name="description" content="Transform London workplace with neuroscience-backed engagement. Reduce burnout, boost productivity, improve retention across all London businesses.">/g' locations/london/index.html && echo "✓ London"

# 6. locations/newcastle/index.html (162 → 156)
sed -i 's/<meta name="description" content="Transform your Newcastle workplace with neuroscience-backed employee engagement strategies. Reduce burnout in professional services, healthcare, and tech sectors.">/<meta name="description" content="Transform Newcastle workplace with neuroscience-backed engagement. Reduce burnout in professional services, healthcare, and technology sectors.">/g' locations/newcastle/index.html && echo "✓ Newcastle"

# 7. quiet-cracking/index.html (179 → 156)
sed -i 's/<meta name="description" content="Discover the 4 stages of quiet cracking: from mental strain to system failure. 73% of employees are quietly breaking. Learn the neuroscience, warning signs, prevention strategies.">/<meta name="description" content="Discover 4 stages of quiet cracking: mental strain to system failure. 73% of employees quietly breaking. Learn neuroscience, warning signs, prevention.">/g' quiet-cracking/index.html && echo "✓ Quiet cracking"

# 8. research/2026-employee-experience-reality.html (214 → 159)
sed -i 's/<meta name="description" content="The managerial layer is collapsing (27% engagement) while Gen Z hits burnout at 25 vs 42 historically. AI adoption races 3x faster than leadership realizes. Research-backed 2026 workforce predictions by Clive Hays.">/<meta name="description" content="Managerial layer collapsing at 27% engagement. Gen Z burnout at 25 vs 42 historically. AI races 3x faster than leaders realize. 2026 workforce predictions.">/g' research/2026-employee-experience-reality.html && echo "✓ 2026 research"

# 9. research/clover-framework-neuroscience.html (220 → 158)
sed -i 's/<meta name="description" content="The CLOVER Framework measures 6 neurochemical systems driving employee engagement: Communication, Learning, Opportunity, Vulnerability, Enablement, Reflection. Developed through 20+ years Fortune 500 transformation work.">/<meta name="description" content="CLOVER Framework: 6 neurochemical systems driving engagement—Communication, Learning, Opportunity, Vulnerability, Enablement, Reflection. 20+ years proven.">/g' research/clover-framework-neuroscience.html && echo "✓ CLOVER neuroscience"

# 10. research/daily-checkins-vs-annual-surveys.html (185 → 155)
sed -i 's/<meta name="description" content="Research shows daily employee check-ins achieve 65-75% response rates versus 40-55% for annual surveys. Neuroscience-based analysis by Clive Hays, author of The Trillion Dollar Problem.">/<meta name="description" content="Daily check-ins achieve 65-75% response rates vs 40-55% for annual surveys. Neuroscience-based analysis by Clive Hays, The Trillion Dollar Problem.">/g' research/daily-checkins-vs-annual-surveys.html && echo "✓ Check-ins research"

# 11. research/index.html (187 → 155)
sed -i 's/<meta name="description" content="Research-backed insights on employee engagement, neuroscience, and workplace transformation. Statistics, case studies, and evidence-based methodologies from 20+ years of Fortune 500 work.">/<meta name="description" content="Research-backed insights on employee engagement, neuroscience, workplace transformation. Statistics, case studies, proven methodologies from 20+ years.">/g' research/index.html && echo "✓ Research hub"

# 12. research/uk-employee-engagement-statistics.html (175 → 155)
sed -i 's/<meta name="description" content="UK businesses lose £340 billion annually to employee disengagement. Comprehensive statistics on engagement costs, turnover rates, and productivity impact across UK industries.">/<meta name="description" content="UK businesses lose £340B annually to disengagement. Comprehensive statistics on engagement costs, turnover rates, productivity impact across industries.">/g' research/uk-employee-engagement-statistics.html && echo "✓ UK stats"

# 13. resources-hub/why-employee-engagement-matters.html (201 → 159)
sed -i 's/<meta name="description" content="Discover why employee engagement matters for business success. Companies with engaged employees see 23% higher profitability, 18% higher productivity, and 87% better retention. Learn the proven impact.">/<meta name="description" content="Why employee engagement matters: 23% higher profitability, 18% higher productivity, 87% better retention. Discover the proven impact on business success.">/g' resources-hub/why-employee-engagement-matters.html && echo "✓ Why engagement matters"

# 14. the-quiet-crack/index.html (176 → 157)
sed -i 's/<meta name="description" content="The Quiet Crack podcast reveals quiet cracking - the 4-stage breakdown affecting 73% of employees. Learn what quiet cracking is and how to prevent The Quiet Crack in your team.">/<meta name="description" content="The Quiet Crack podcast: 4-stage breakdown affecting 73% of employees. Learn what quiet cracking is and how to prevent it from destroying your team.">/g' the-quiet-crack/index.html && echo "✓ Podcast"

# 15. workplace-solutions/change-management.html (164 → 158)
sed -i 's/<meta name="description" content="70% of transformations fail, wasting £5.2M? Our AI predicts resistance, drives adoption, and ensures change success. Real-time sentiment tracking. Start free trial.">/<meta name="description" content="70% of transformations fail, wasting £5.2M. Our AI predicts resistance, drives adoption, ensures change success. Real-time tracking. Free trial.">/g' workplace-solutions/change-management.html && echo "✓ Change management"

echo ""
echo "Done! Trimmed 15 long meta descriptions to 160 chars or less."
