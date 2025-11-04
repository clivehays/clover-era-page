#!/bin/bash

echo "Mobile Responsiveness Audit Report"
echo "==================================="
echo ""
echo "Total HTML files found: $(find . -name '*.html' -type f | grep -v node_modules | wc -l)"
echo ""
echo "Checking for mobile optimizations..."
echo ""

# Check which files have viewport meta tag
echo "Files WITHOUT viewport meta tag:"
echo "--------------------------------"
for file in $(find . -name "*.html" -type f | grep -v node_modules); do
    if ! grep -q "viewport" "$file" 2>/dev/null; then
        echo "$file"
    fi
done
echo ""

# Check which files have media queries
echo "Files WITHOUT mobile media queries:"
echo "-----------------------------------"
for file in $(find . -name "*.html" -type f | grep -v node_modules); do
    count=$(grep -c "@media" "$file" 2>/dev/null || echo "0")
    if [ "$count" = "0" ]; then
        echo "$file"
    fi
done
echo ""

# Check which files already link to mobile-responsive.css
echo "Files ALREADY using mobile-responsive.css:"
echo "-------------------------------------------"
for file in $(find . -name "*.html" -type f | grep -v node_modules); do
    if grep -q "mobile-responsive.css" "$file" 2>/dev/null; then
        echo "$file"
    fi
done
echo ""

echo "Audit complete!"
