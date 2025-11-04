#!/bin/bash

# Script to fix duplicate </body></html> endings and header.js references

echo "=========================================="
echo "Fix Duplicate Endings Script"
echo "=========================================="
echo ""

cd "C:/Users/Administrator/clover-era-page" || exit 1

BACKUP_DIR="./backups/duplicate-fix-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Backup directory created: $BACKUP_DIR"
echo ""

FIXED=0

echo "Checking for duplicate endings..."
echo "=========================================="
echo ""

# Find all HTML files with duplicate </body></html>
for file in $(find . -name "*.html" -type f | grep -v node_modules | grep -v backups); do
    # Check if file has duplicate </body></html>
    BODY_COUNT=$(grep -c "</body>" "$file" 2>/dev/null || echo "0")
    HTML_COUNT=$(grep -c "</html>" "$file" 2>/dev/null || echo "0")

    if [ "$BODY_COUNT" -gt "1" ] || [ "$HTML_COUNT" -gt "1" ]; then
        echo "Processing: $file"
        echo "  Body tags: $BODY_COUNT, HTML tags: $HTML_COUNT"

        # Create backup
        backup_path="$BACKUP_DIR/$(dirname "$file")"
        mkdir -p "$backup_path"
        cp "$file" "$backup_path/"

        # Find the line number of FIRST </body>
        FIRST_BODY=$(grep -n "</body>" "$file" | head -1 | cut -d: -f1)

        if [ -n "$FIRST_BODY" ]; then
            # Keep only up to first </body> + 1 line (for </html>)
            KEEP_UNTIL=$((FIRST_BODY + 1))

            # Create temp file with content up to first closing tags
            head -n "$KEEP_UNTIL" "$file" > "${file}.tmp"

            # Check if we have </html> at the end
            if ! tail -1 "${file}.tmp" | grep -q "</html>"; then
                echo "</html>" >> "${file}.tmp"
            fi

            # Replace original
            mv "${file}.tmp" "$file"

            echo "  ✓ Fixed - removed duplicate endings"
            ((FIXED++))
        fi
        echo ""
    fi
done

echo "=========================================="
echo "Summary"
echo "=========================================="
echo "Fixed: $FIXED files"
echo "Backup location: $BACKUP_DIR"
echo ""

echo "=========================================="
echo "Verification"
echo "=========================================="
echo ""

# Verify a few key files
TEST_FILES=(
    "how-it-works.html"
    "resources-hub/index.html"
    "clover-framework.html"
)

for test_file in "${TEST_FILES[@]}"; do
    if [ -f "$test_file" ]; then
        BODY_COUNT=$(grep -c "</body>" "$test_file" 2>/dev/null || echo "0")
        HTML_COUNT=$(grep -c "</html>" "$test_file" 2>/dev/null || echo "0")
        echo "$test_file: </body> tags=$BODY_COUNT, </html> tags=$HTML_COUNT"
    fi
done
echo ""

echo "=========================================="
echo "Script Complete!"
echo "=========================================="
