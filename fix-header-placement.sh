#!/bin/bash

# Script to fix header.js placement - move from <head> to end of <body>

echo "=========================================="
echo "Header.js Placement Fix Script"
echo "=========================================="
echo ""

cd "C:/Users/Administrator/clover-era-page" || exit 1

# Create backup
BACKUP_DIR="./backups/header-fix-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Backup directory created: $BACKUP_DIR"
echo ""

MODIFIED=0
SKIPPED=0

echo "Processing files..."
echo "=========================================="

# Find all HTML files with header.js in <head> section (line 4)
for file in $(find . -name "*.html" -type f | grep -v node_modules | grep -v backups); do
    # Check if file has header.js on line 4 (in <head>)
    if sed -n '4p' "$file" | grep -q "header.js" 2>/dev/null; then
        echo "Processing: $file"

        # Create backup
        backup_path="$BACKUP_DIR/$(dirname "$file")"
        mkdir -p "$backup_path"
        cp "$file" "$backup_path/"

        # Remove header.js from line 4
        sed -i '4d' "$file"

        # Add header.js before </body> tag if not already there
        if ! grep -q "header.js" "$file" 2>/dev/null; then
            # Insert before closing </body> tag
            sed -i 's|</body>|    <script src="/js/header.js"></script>\n</body>|' "$file"
            echo "  ✓ Moved header.js from <head> to end of <body>"
            ((MODIFIED++))
        else
            echo "  ✓ Removed from <head> (already exists in body)"
            ((MODIFIED++))
        fi
        echo ""
    fi
done

# Also fix resources-hub/index.html which has it with indentation
if [ -f "resources-hub/index.html" ]; then
    if grep -q "^    <script src=\"/js/header.js\"></script>" "resources-hub/index.html"; then
        echo "Processing: resources-hub/index.html (special case)"
        backup_path="$BACKUP_DIR/resources-hub"
        mkdir -p "$backup_path"
        cp "resources-hub/index.html" "$backup_path/"

        # Remove from head (line with indentation)
        sed -i '/^    <script src="\/js\/header.js"><\/script>$/d' "resources-hub/index.html"

        # Add before </body> if not there
        if ! tail -20 "resources-hub/index.html" | grep -q "header.js"; then
            sed -i 's|</body>|    <script src="/js/header.js"></script>\n</body>|' "resources-hub/index.html"
            echo "  ✓ Moved header.js from <head> to end of <body>"
            ((MODIFIED++))
        fi
        echo ""
    fi
fi

echo "=========================================="
echo "Summary"
echo "=========================================="
echo "Modified: $MODIFIED"
echo "Skipped: $SKIPPED"
echo "Backup location: $BACKUP_DIR"
echo ""

echo "=========================================="
echo "Testing Critical Pages"
echo "=========================================="
echo ""

TEST_FILES=(
    "how-it-works.html"
    "resources-hub/index.html"
    "pricing/index.html"
)

for test_file in "${TEST_FILES[@]}"; do
    if [ -f "$test_file" ]; then
        echo "Verifying: $test_file"

        # Check if header.js is in head
        if head -10 "$test_file" | grep -q "header.js"; then
            echo "  ✗ Still in <head>!"
        else
            echo "  ✓ Not in <head>"
        fi

        # Check if header.js is near end of body
        if tail -20 "$test_file" | grep -q "header.js"; then
            echo "  ✓ Found near </body>"
        else
            echo "  ✗ Not found near </body>!"
        fi
    fi
done
echo ""

echo "=========================================="
echo "Script Complete!"
echo "=========================================="
