const fs = require('fs');

const files = [
  'active-employee-engagement-management/index.html',
  'burnout/index.html',
  'locations/birmingham/index.html',
  'locations/glasgow/index.html',
  'locations/london/index.html',
  'locations/newcastle/index.html',
  'quiet-cracking/index.html',
  'research/2026-employee-experience-reality.html',
  'research/clover-framework-neuroscience.html',
  'research/daily-checkins-vs-annual-surveys.html',
  'research/index.html',
  'research/uk-employee-engagement-statistics.html',
  'resources-hub/why-employee-engagement-matters.html',
  'the-quiet-crack/index.html',
  'workplace-solutions/change-management.html'
];

console.log('LONG META DESCRIPTIONS (>160 chars):\n');

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
    console.log(`${file}: ERROR`);
  }
});
