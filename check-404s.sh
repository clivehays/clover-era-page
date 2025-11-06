#!/bin/bash

echo "Checking for 404 errors..."
echo ""

# List of URLs to check (from the user's list)
urls=(
    "employee-engagement-strategies/index.html"
    "engagement-best-practices/index.html"
    "downloads/Sales-Call-Battle-Cards.pdf"
    "quiet-cracking-framework/index.html"
    "what-is-quiet-cracking/index.html"
    "contact"
    "terms/index.html"
    "start-trial"
    "privacy/index.html"
    "contact/index.html"
    "downloads/Clover-ERA-Value-Proposition-ROI.pdf"
    "measure-employee-engagement/index.html"
    "terms"
    "book-demo"
    "downloads/Clover-ERA-Company-Overview.pdf"
    "privacy"
    "quiet-cracking-framework/index.html"
)

for url in "${urls[@]}"; do
    if [ -f "$url" ]; then
        echo "✅ EXISTS: $url"
    else
        echo "❌ MISSING: $url"
    fi
done
