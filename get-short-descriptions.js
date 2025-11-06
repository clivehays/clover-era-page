const fs = require('fs');
const path = require('path');

const files = [
  'Blog/workplace-quietly-cracking-under-pressure.html',
  'calculator/index.html',
  'early-adopter-program.html',
  'how-it-works.html',
  'hybrid-working-issues/index.html',
  'implementation-guide.html',
  'neuroscience-of-employee-engagement/index.html',
  'our-science.html',
  'pricing/index.html',
  'privacy-policy.html',
  'resources-hub/index.html',
  'tech-ceo-guide/index.html',
  'terms.html',
  'the-brain-chemistry-audit/index.html',
  'workplace-solutions/bad-bosses-transformation.html'
];

console.log('SHORT META DESCRIPTIONS:\n');

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    const match = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
    if (match) {
      const desc = match[1];
      console.log(`${file} (${desc.length} chars):`);
      console.log(`  "${desc}"`);
      console.log('');
    }
  } catch (e) {
    console.log(`${file}: ERROR - ${e.message}`);
  }
});
