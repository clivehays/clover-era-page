#!/bin/bash

echo "Fixing all 404 errors by replacing broken URLs with correct ones..."
echo ""

# Find all HTML files (excluding backups)
files=$(find . -name "*.html" -not -path "*/backups/*" -not -path "*/.git/*" -not -path "*/node_modules/*")

count=0

for file in $files; do
    # Fix employee-engagement-strategies -> engagement-strategies
    if grep -q "employee-engagement-strategies" "$file"; then
        sed -i 's|/employee-engagement-strategies|/engagement-strategies|g' "$file"
        sed -i 's|href="employee-engagement-strategies|href="engagement-strategies|g' "$file"
        ((count++))
    fi
    
    # Fix engagement-best-practices -> employee-engagement-best-practices
    if grep -q 'href="/engagement-best-practices["/]' "$file" || grep -q 'href="engagement-best-practices["/]' "$file"; then
        sed -i 's|/engagement-best-practices|/employee-engagement-best-practices|g' "$file"
        sed -i 's|href="engagement-best-practices|href="employee-engagement-best-practices|g' "$file"
        ((count++))
    fi
    
    # Fix quiet-cracking-framework -> quiet-cracking
    if grep -q "quiet-cracking-framework" "$file"; then
        sed -i 's|/quiet-cracking-framework|/quiet-cracking|g' "$file"
        sed -i 's|href="quiet-cracking-framework|href="quiet-cracking|g' "$file"
        ((count++))
    fi
    
    # Fix what-is-quiet-cracking -> the-quiet-crack
    if grep -q "what-is-quiet-cracking" "$file"; then
        sed -i 's|/what-is-quiet-cracking|/the-quiet-crack|g' "$file"
        sed -i 's|href="what-is-quiet-cracking|href="the-quiet-crack|g' "$file"
        ((count++))
    fi
    
    # Fix /contact -> /contact.html (but not /contact/)
    if grep -q 'href="/contact"' "$file"; then
        sed -i 's|href="/contact"|href="/contact.html"|g' "$file"
        ((count++))
    fi
    
    # Fix /terms -> /terms.html (but not /terms/)
    if grep -q 'href="/terms"' "$file"; then
        sed -i 's|href="/terms"|href="/terms.html"|g' "$file"
        ((count++))
    fi
    
    # Fix /privacy -> /privacy-policy.html
    if grep -q 'href="/privacy"' "$file"; then
        sed -i 's|href="/privacy"|href="/privacy-policy.html"|g' "$file"
        ((count++))
    fi
    
    # Fix measure-employee-engagement -> how-to-measure-employee-engagement
    if grep -q "/measure-employee-engagement[^-]" "$file"; then
        sed -i 's|/measure-employee-engagement/|/how-to-measure-employee-engagement/|g' "$file"
        sed -i 's|href="measure-employee-engagement|href="how-to-measure-employee-engagement|g' "$file"
        ((count++))
    fi
    
    # Fix /book-demo (we already fixed /start-trial, check if book-demo exists)
    if grep -q 'href="/book-demo"' "$file"; then
        # Replace with contact or assessment page
        sed -i 's|href="/book-demo"|href="/contact.html"|g' "$file"
        ((count++))
    fi
done

echo "✅ Fixed broken URLs in $count file instances"
echo ""
echo "Summary of fixes:"
echo "  /employee-engagement-strategies -> /engagement-strategies"
echo "  /engagement-best-practices -> /employee-engagement-best-practices"
echo "  /quiet-cracking-framework -> /quiet-cracking"
echo "  /what-is-quiet-cracking -> /the-quiet-crack"
echo "  /contact -> /contact.html"
echo "  /terms -> /terms.html"
echo "  /privacy -> /privacy-policy.html"
echo "  /measure-employee-engagement -> /how-to-measure-employee-engagement"
echo "  /book-demo -> /contact.html"
