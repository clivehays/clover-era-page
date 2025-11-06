#!/bin/bash

echo "Fixing canonical tag issues..."
echo ""

# Fix trailing slashes on .html files (should NOT have trailing slash)
echo "1. Removing trailing slashes from .html canonical URLs..."

sed -i 's|<link rel="canonical" href="https://cloverera.com/how-it-works.html/">|<link rel="canonical" href="https://cloverera.com/how-it-works.html">|g' how-it-works.html
sed -i 's|<link rel="canonical" href="https://cloverera.com/clover-framework.html/">|<link rel="canonical" href="https://cloverera.com/clover-framework.html">|g' clover-framework.html
sed -i 's|<link rel="canonical" href="https://cloverera.com/implementation-guide.html/">|<link rel="canonical" href="https://cloverera.com/implementation-guide.html">|g' implementation-guide.html

sed -i 's|<link rel="canonical" href="https://cloverera.com/workplace-solutions/mental-health-support.html/">|<link rel="canonical" href="https://cloverera.com/workplace-solutions/mental-health-support.html">|g' workplace-solutions/mental-health-support.html
sed -i 's|<link rel="canonical" href="https://cloverera.com/workplace-solutions/leadership-training-programs.html/">|<link rel="canonical" href="https://cloverera.com/workplace-solutions/leadership-training-programs.html">|g' workplace-solutions/leadership-training-programs.html
sed -i 's|<link rel="canonical" href="https://cloverera.com/workplace-solutions/Employee-burnout-solutions.html/">|<link rel="canonical" href="https://cloverera.com/workplace-solutions/Employee-burnout-solutions.html">|g' workplace-solutions/Employee-burnout-solutions.html
sed -i 's|<link rel="canonical" href="https://cloverera.com/workplace-solutions/focus-optimization.html/">|<link rel="canonical" href="https://cloverera.com/workplace-solutions/focus-optimization.html">|g' workplace-solutions/focus-optimization.html
sed -i 's|<link rel="canonical" href="https://cloverera.com/workplace-solutions/employee-stress-management.html/">|<link rel="canonical" href="https://cloverera.com/workplace-solutions/employee-stress-management.html">|g' workplace-solutions/employee-stress-management.html
sed -i 's|<link rel="canonical" href="https://cloverera.com/workplace-solutions/toxic-workplace-culture.html/">|<link rel="canonical" href="https://cloverera.com/workplace-solutions/toxic-workplace-culture.html">|g' workplace-solutions/toxic-workplace-culture.html

echo "   ✓ Fixed 9 files with trailing slash issues"

# Fix WWW to non-WWW
echo "2. Fixing WWW to non-WWW..."

sed -i 's|<link rel="canonical" href="https://www.cloverera.com/mental-health-crisis-support.html">|<link rel="canonical" href="https://cloverera.com/mental-health-crisis-support.html">|g' mental-health-crisis-support.html
sed -i 's|<link rel="canonical" href="https://www.cloverera.com/quiet-cracking/">|<link rel="canonical" href="https://cloverera.com/quiet-cracking/">|g' quiet-cracking/index.html
sed -i 's|<link rel="canonical" href="https://www.cloverera.com/resources-hub/why-employee-engagement-matters.html">|<link rel="canonical" href="https://cloverera.com/resources-hub/why-employee-engagement-matters.html">|g' resources-hub/why-employee-engagement-matters.html

echo "   ✓ Fixed 3 files with www issues"

# Fix incorrect path for the-quiet-crack
echo "3. Fixing incorrect path for the-quiet-crack..."

sed -i 's|<link rel="canonical" href="https://www.cloverera.com/podcast/the-quiet-crack/">|<link rel="canonical" href="https://cloverera.com/the-quiet-crack/">|g' the-quiet-crack/index.html

echo "   ✓ Fixed 1 file with wrong path"

echo ""
echo "✅ All canonical tag issues fixed!"
echo ""
echo "Summary:"
echo "  - Removed trailing slashes from 9 .html file canonicals"
echo "  - Fixed www to non-www in 3 files"
echo "  - Corrected path for the-quiet-crack (podcast/the-quiet-crack → the-quiet-crack)"
echo "  - Total files modified: 13"
