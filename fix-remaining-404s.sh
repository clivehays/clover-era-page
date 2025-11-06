#!/bin/bash

echo "Fixing remaining 404 errors from SEO report..."
echo ""

# Find all HTML files (excluding backups)
files=$(find . -name "*.html" -not -path "*/backups/*" -not -path "*/.git/*" -not -path "*/node_modules/*")

count=0

for file in $files; do
    # Fix /terms/ (with trailing slash) -> /terms.html
    if grep -q 'href="/terms/"' "$file"; then
        sed -i 's|href="/terms/"|href="/terms.html"|g' "$file"
        sed -i 's|href="https://www.cloverera.com/terms/"|href="https://cloverera.com/terms.html"|g' "$file"
        sed -i 's|href="https://cloverera.com/terms/"|href="https://cloverera.com/terms.html"|g' "$file"
        ((count++))
    fi
    
    # Fix /privacy/ (with trailing slash) -> /privacy-policy.html
    if grep -q 'href="/privacy/"' "$file" || grep -q 'href="https://.*cloverera.com/privacy/"' "$file"; then
        sed -i 's|href="/privacy/"|href="/privacy-policy.html"|g' "$file"
        sed -i 's|href="https://www.cloverera.com/privacy/"|href="https://cloverera.com/privacy-policy.html"|g' "$file"
        sed -i 's|href="https://cloverera.com/privacy/"|href="https://cloverera.com/privacy-policy.html"|g' "$file"
        ((count++))
    fi
    
    # Fix /contact/ (with trailing slash) -> /contact.html
    if grep -q 'href="/contact/"' "$file" || grep -q 'href="https://.*cloverera.com/contact/"' "$file"; then
        sed -i 's|href="/contact/"|href="/contact.html"|g' "$file"
        sed -i 's|href="https://www.cloverera.com/contact/"|href="https://cloverera.com/contact.html"|g' "$file"
        sed -i 's|href="https://cloverera.com/contact/"|href="https://cloverera.com/contact.html"|g' "$file"
        ((count++))
    fi
done

echo "✓ Fixed links with trailing slashes in $count files"

# Check if PDF files exist in downloads directory
echo ""
echo "Checking for missing PDF files..."

if [ ! -d "downloads" ]; then
    echo "⚠ downloads directory does not exist - creating it"
    mkdir -p downloads
fi

pdf_files=(
    "Sales-Call-Battle-Cards.pdf"
    "Clover-ERA-Value-Proposition-ROI.pdf"
    "Clover-ERA-Company-Overview.pdf"
)

for pdf in "${pdf_files[@]}"; do
    if [ ! -f "downloads/$pdf" ]; then
        echo "⚠ Missing: downloads/$pdf"
    else
        echo "✓ Found: downloads/$pdf"
    fi
done

echo ""
echo "Summary of URL fixes:"
echo "  /terms/ → /terms.html"
echo "  /privacy/ → /privacy-policy.html"
echo "  /contact/ → /contact.html"
echo "  (All variations including www and non-www)"
