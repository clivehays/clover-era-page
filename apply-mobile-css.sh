#!/bin/bash

# Script to automatically apply mobile-responsive.css to all HTML pages
# Excludes index.html (already has comprehensive mobile styles)

echo "=========================================="
echo "Mobile CSS Application Script"
echo "=========================================="
echo ""

# Change to the clover-era-page directory
cd "C:/Users/Administrator/clover-era-page" || exit 1

# Count total HTML files (excluding node_modules)
TOTAL_FILES=$(find . -name "*.html" -type f | grep -v node_modules | grep -v index.html | wc -l)
echo "Found $TOTAL_FILES HTML files to process (excluding index.html)"
echo ""

# Counter for modified files
MODIFIED=0
SKIPPED=0
ALREADY_HAS_CSS=0

# Create backup directory
BACKUP_DIR="./backups/mobile-css-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Backup directory created: $BACKUP_DIR"
echo ""

echo "Processing files..."
echo "=========================================="

# Process each HTML file
for file in $(find . -name "*.html" -type f | grep -v node_modules | grep -v index.html); do
    echo "Processing: $file"

    # Check if file already has mobile-responsive.css
    if grep -q "mobile-responsive.css" "$file" 2>/dev/null; then
        echo "  ✓ Already has mobile-responsive.css - SKIPPED"
        ((ALREADY_HAS_CSS++))
        echo ""
        continue
    fi

    # Create backup
    cp "$file" "$BACKUP_DIR/"

    # Check if file has </title> tag
    if grep -q "</title>" "$file" 2>/dev/null; then
        # Insert after </title> tag
        sed -i '/<\/title>/a\    <link rel="stylesheet" href="/css/mobile-responsive.css">' "$file"
        echo "  ✓ Added CSS link after </title> tag"
        ((MODIFIED++))
    # Check if file has </head> tag
    elif grep -q "</head>" "$file" 2>/dev/null; then
        # Insert before </head> tag
        sed -i 's|</head>|    <link rel="stylesheet" href="/css/mobile-responsive.css">\n</head>|' "$file"
        echo "  ✓ Added CSS link before </head> tag"
        ((MODIFIED++))
    else
        echo "  ✗ No <head> section found - SKIPPED"
        ((SKIPPED++))
    fi

    # Check if file is missing viewport meta tag
    if ! grep -q "viewport" "$file" 2>/dev/null; then
        echo "  ⚠ WARNING: Missing viewport meta tag!"
        # Add viewport meta tag if </title> exists
        if grep -q "</title>" "$file" 2>/dev/null; then
            sed -i '/<\/title>/a\    <meta name="viewport" content="width=device-width, initial-scale=1.0">' "$file"
            echo "  ✓ Added viewport meta tag"
        fi
    fi

    echo ""
done

echo "=========================================="
echo "Summary"
echo "=========================================="
echo "Total files processed: $TOTAL_FILES"
echo "Modified: $MODIFIED"
echo "Already had CSS: $ALREADY_HAS_CSS"
echo "Skipped (no <head>): $SKIPPED"
echo ""
echo "Backup location: $BACKUP_DIR"
echo ""

if [ $MODIFIED -gt 0 ]; then
    echo "=========================================="
    echo "Testing Sample Files"
    echo "=========================================="
    echo ""

    # Test a few critical files to verify the changes
    TEST_FILES=(
        "how-it-works.html"
        "calculator/index.html"
        "30-day-free-pilot/index.html"
        "assessment/index.html"
    )

    for test_file in "${TEST_FILES[@]}"; do
        if [ -f "$test_file" ]; then
            echo "Verifying: $test_file"
            if grep -q "mobile-responsive.css" "$test_file" 2>/dev/null; then
                echo "  ✓ CSS link found"
            else
                echo "  ✗ CSS link NOT found!"
            fi
        fi
    done
    echo ""

    echo "=========================================="
    echo "Next Steps"
    echo "=========================================="
    echo "1. Review changes in a few sample pages"
    echo "2. Test on mobile devices (iPhone SE, iPhone 12, etc.)"
    echo "3. If everything looks good, commit changes:"
    echo "   git add ."
    echo "   git status"
    echo "   git commit -m \"Apply mobile-responsive.css to all pages\""
    echo "   git push"
    echo ""
    echo "4. If you need to rollback:"
    echo "   cp $BACKUP_DIR/* ./ (restore from backup)"
    echo ""
fi

echo "=========================================="
echo "Script Complete!"
echo "=========================================="
