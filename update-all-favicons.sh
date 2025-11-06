#!/bin/bash

echo "Updating favicon references across all HTML files..."
echo ""

# Find all HTML files (excluding backups, node_modules, etc.)
files=$(find . -name "*.html" -not -path "*/backups/*" -not -path "*/.git/*" -not -path "*/node_modules/*" -not -path "*/deprecated/*" -not -path "*/old/*" -not -path "*/archive/*")

updated=0
already_correct=0
added=0

for file in $files; do
    # Check if file has any favicon references
    if grep -q "favicon\|icon.*image/png\|apple-touch-icon\|shortcut icon" "$file"; then
        # Check if already using the new optimized favicons
        if grep -q "/images/favicon-32x32.png" "$file" && grep -q "/images/favicon-16x16.png" "$file"; then
            ((already_correct++))
            continue
        fi
        
        # Replace old favicon references with new optimized ones
        # This will handle various formats:
        # - Clover-era-new-logo-1.png references
        # - Any other favicon references
        
        # Create a temporary file with updated favicon section
        temp_file="${file}.tmp"
        
        # Read file and update favicon lines
        awk '
        BEGIN { in_favicon_section = 0; favicon_added = 0 }
        
        # Detect favicon section start (either comment or link tag)
        /<!-- Favicon -->/ || /<link[^>]*rel="icon"/ || /<link[^>]*rel="apple-touch-icon"/ || /<link[^>]*rel="shortcut icon"/ {
            if (!favicon_added) {
                print "    <!-- Favicon -->"
                print "    <link rel=\"icon\" type=\"image/png\" sizes=\"32x32\" href=\"/images/favicon-32x32.png\">"
                print "    <link rel=\"icon\" type=\"image/png\" sizes=\"16x16\" href=\"/images/favicon-16x16.png\">"
                print "    <link rel=\"apple-touch-icon\" sizes=\"180x180\" href=\"/images/Clover-era-new-logo-1.png\">"
                print "    <link rel=\"shortcut icon\" href=\"/images/favicon-32x32.png\">"
                favicon_added = 1
            }
            next
        }
        
        # Skip subsequent favicon lines
        /<link[^>]*type="image\/png"[^>]*href="\/images\/(Clover-era-new-logo-1|favicon-[^"]*).png"/ { next }
        /<link[^>]*href="\/images\/(Clover-era-new-logo-1|favicon-[^"]*).png"[^>]*type="image\/png"/ { next }
        
        # Print all other lines
        { print }
        ' "$file" > "$temp_file"
        
        # Replace original file if changes were made
        if ! cmp -s "$file" "$temp_file"; then
            mv "$temp_file" "$file"
            ((updated++))
            echo "✓ Updated: $file"
        else
            rm "$temp_file"
        fi
    else
        # No favicon found - add one after the mobile-responsive.css or in <head>
        if grep -q "mobile-responsive.css" "$file"; then
            sed -i '/<link rel="stylesheet" href="\/css\/mobile-responsive.css">/a\
\    \
\    <!-- Favicon -->\
\    <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png">\
\    <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png">\
\    <link rel="apple-touch-icon" sizes="180x180" href="/images/Clover-era-new-logo-1.png">\
\    <link rel="shortcut icon" href="/images/favicon-32x32.png">' "$file"
            ((added++))
            echo "✓ Added favicon to: $file"
        fi
    fi
done

echo ""
echo "======================================"
echo "Favicon Update Complete!"
echo "======================================"
echo "Files updated: $updated"
echo "Files already correct: $already_correct"
echo "Files with favicon added: $added"
echo "Total files processed: $((updated + already_correct + added))"
