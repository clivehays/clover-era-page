#!/bin/bash

# Add missing meta descriptions to 7 pages

echo "Adding missing meta descriptions..."

# 1. 3-min-manager-fix/index.html
sed -i '/<title>The 3-Minute Manager Fix™ - Clover ERA<\/title>/a\    <meta name="description" content="Stop employee turnover in 3 minutes daily using the neuroscience-based CLOVER Framework. Reduce burnout by 67% and save $4.2M annually.">' 3-min-manager-fix/index.html && echo "✓ 3-min-manager-fix/index.html"

# 2. sales-portal.html
sed -i '/<title>Clover ERA Sales Portal - Internal Sales Resources<\/title>/a\    <meta name="description" content="Clover ERA sales portal with AI-powered predictive analytics, battle cards, objection handlers and proven closing strategies. 100% beta success rate.">' sales-portal.html && echo "✓ sales-portal.html"

# 3. site-map/index.html  
sed -i '/<title>Clover Era - Site Architecture Map<\/title>/a\    <meta name="description" content="Clover ERA site map with 60+ pages covering employee engagement solutions, crisis intervention, retention strategies and ROI tools across major cities.">' site-map/index.html && echo "✓ site-map/index.html"

# Note: pilot/index.html and downloads/index.html are empty, skipping
# Note: Blog/admin/index.html is admin interface, skipping

echo "Done! Added meta descriptions to 3 pages."
