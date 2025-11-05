#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('==========================================');
console.log('Internal Links SEO Optimization Script');
console.log('==========================================\n');

// Define internal linking strategy - what keywords should link to which pages
const linkingStrategy = {
  'burnout': {
    url: '/burnout/index.html',
    keywords: [
      'burnout', 'burned out', 'burning out', 'employee burnout',
      'burnout prevention', 'burnout crisis', 'burnout rates'
    ],
    contextWords: ['exhaustion', 'overwhelming', 'depleted']
  },
  'retention-crisis': {
    url: '/retention-crisis/index.html',
    keywords: [
      'retention crisis', 'retention rates', 'employee retention',
      'turnover', 'attrition', 'employees leaving', 'quit', 'resignation',
      'talent retention', 'retain employees', 'losing talent'
    ],
    contextWords: ['leaving', 'departure', 'exit']
  },
  'workplace-anxiety': {
    url: '/workplace-anxiety/index.html',
    keywords: [
      'workplace anxiety', 'employee anxiety', 'work anxiety',
      'anxious employees', 'anxiety at work', 'fear culture',
      'psychological safety'
    ],
    contextWords: ['nervous', 'worried', 'fearful']
  },
  'toxic-management': {
    url: '/toxic-management/index.html',
    keywords: [
      'toxic management', 'bad managers', 'poor leadership',
      'toxic leaders', 'management problems', 'leadership crisis',
      'bad bosses', 'toxic workplace'
    ],
    contextWords: ['micromanagement', 'controlling']
  },
  'productivity-loss': {
    url: '/productivity-loss/index.html',
    keywords: [
      'productivity loss', 'reduced productivity', 'productivity decline',
      'productivity drop', 'performance issues', 'low productivity',
      'productivity crisis', 'productivity problems'
    ],
    contextWords: ['inefficiency', 'output decline']
  },
  'employee-engagement-best-practices': {
    url: '/employee-engagement-best-practices/index.html',
    keywords: [
      'employee engagement', 'engagement strategies', 'engagement best practices',
      'improve engagement', 'boost engagement', 'increase engagement',
      'engagement levels', 'engaged employees'
    ],
    contextWords: ['motivated', 'committed']
  },
  'how-to-measure-employee-engagement': {
    url: '/how-to-measure-employee-engagement/index.html',
    keywords: [
      'measure engagement', 'engagement metrics', 'track engagement',
      'engagement measurement', 'engagement data', 'engagement analytics'
    ],
    contextWords: ['measurement', 'metrics', 'tracking']
  },
  'engagement-strategies': {
    url: '/engagement-strategies/index.html',
    keywords: [
      'engagement strategies', 'engagement tactics', 'engagement solutions',
      'improve employee engagement', 'engagement programs'
    ],
    contextWords: ['strategy', 'approach', 'method']
  },
  'change-fatigue': {
    url: '/change-fatigue/index.html',
    keywords: [
      'change fatigue', 'change exhaustion', 'organizational change',
      'change management', 'change overload', 'transformation fatigue'
    ],
    contextWords: ['resistance', 'overwhelmed by change']
  },
  'employee-stress': {
    url: '/employee-stress/index.html',
    keywords: [
      'employee stress', 'workplace stress', 'work stress',
      'stress management', 'stressed employees', 'stress levels'
    ],
    contextWords: ['tension', 'pressure']
  }
};

// High-priority pages to update
const priorityPages = [
  'workplace-anxiety/index.html',
  'employee-engagement-best-practices/index.html',
  'retention-crisis/index.html',
  'toxic-management/index.html',
  'productivity-loss/index.html',
  'how-to-measure-employee-engagement/index.html',
  'burnout/index.html',
  'engagement-strategies/index.html',
  'change-fatigue/index.html'
];

// Track changes for reporting
const changes = {
  filesModified: 0,
  linksAdded: 0,
  byPage: {}
};

// Helper: Check if text already contains a link to avoid duplicates
function hasExistingLink(text, url) {
  return text.includes(`href="${url}"`) || text.includes(`href='${url}'`);
}

// Helper: Create styled link
function createLink(text, url) {
  return `<a href="${url}" style="color: var(--primary-teal); text-decoration: underline;">${text}</a>`;
}

// Main function to add internal links to a file
function addInternalLinks(filePath) {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  const originalContent = content;
  let linksAddedToFile = 0;

  // Get current page's topic to avoid self-linking
  const currentPageTopic = Object.keys(linkingStrategy).find(topic =>
    filePath.includes(topic) || linkingStrategy[topic].url.includes(path.basename(filePath))
  );

  // Process each linking opportunity
  for (const [topic, config] of Object.entries(linkingStrategy)) {
    // Skip self-linking
    if (topic === currentPageTopic) continue;

    // Skip if already has links to this page
    if (hasExistingLink(content, config.url)) {
      continue;
    }

    // Try to find and replace keywords (case-insensitive, whole word matching)
    for (const keyword of config.keywords) {
      // Create regex that matches the keyword but not if it's already in a link
      // Match keyword not inside HTML tags, and not already linked
      const regex = new RegExp(
        `(?<!<a[^>]*>)(?<!href=["'][^"']*)(\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b)(?![^<]*</a>)(?![^<]*>)`,
        'gi'
      );

      // Only replace first occurrence to avoid over-linking
      const match = content.match(regex);
      if (match && linksAddedToFile < 5) { // Max 5 links per page
        content = content.replace(regex, createLink('$1', config.url));
        linksAddedToFile++;
        console.log(`   ✓ Added link: "${match[0]}" → ${config.url}`);
        break; // Move to next topic after adding one link for this topic
      }
    }
  }

  // Save if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    changes.filesModified++;
    changes.linksAdded += linksAddedToFile;
    changes.byPage[filePath] = linksAddedToFile;
    console.log(`✅ Updated ${filePath} - Added ${linksAddedToFile} internal links\n`);
  } else {
    console.log(`⏭️  No changes needed for ${filePath}\n`);
  }
}

// Main execution
console.log('🔍 Analyzing priority pages for internal linking opportunities...\n');

priorityPages.forEach((page, index) => {
  console.log(`[${index + 1}/${priorityPages.length}] Processing: ${page}`);
  addInternalLinks(page);
});

// Report results
console.log('\n==========================================');
console.log('Internal Links Optimization Complete!');
console.log('==========================================\n');
console.log(`📊 Summary:`);
console.log(`   Files modified: ${changes.filesModified}`);
console.log(`   Total links added: ${changes.linksAdded}`);
console.log(`   Average links per page: ${(changes.linksAdded / changes.filesModified || 0).toFixed(1)}`);

if (changes.filesModified > 0) {
  console.log(`\n📄 Detailed breakdown:`);
  for (const [page, count] of Object.entries(changes.byPage)) {
    console.log(`   • ${page}: ${count} links`);
  }
}

console.log('\n✨ SEO Impact:');
console.log('   • Improved crawlability and site architecture');
console.log('   • Enhanced topical authority through semantic linking');
console.log('   • Better user navigation and engagement');
console.log('   • Distributed page authority across high-value pages');

console.log('\n🚀 Next steps:');
console.log('   1. Review changes with: git diff');
console.log('   2. Commit and deploy: git add . && git commit && git push');
console.log('   3. Monitor GSC for improved internal linking metrics\n');
