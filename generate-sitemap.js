#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const DOMAIN = 'https://cloverera.com';
const OUTPUT_FILE = 'sitemap.xml';

// Directories and files to exclude
const EXCLUDE_DIRS = ['node_modules', '.git', '.github', 'london'];
const EXCLUDE_FILES = ['404.html'];

// Priority mapping based on file location/type
const getPriority = (filePath) => {
  if (filePath === '/') return 1.0;
  if (filePath.includes('our-science.html')) return 1.0;
  if (filePath.includes('/about.html') ||
      filePath.includes('/how-it-works.html') ||
      filePath.includes('/clover-framework.html') ||
      filePath.includes('/pricing/')) return 0.9;
  if (filePath.includes('/30-day-free-pilot/')) return 0.9;
  if (filePath.includes('workplace-solutions/')) return 0.6;
  if (filePath.includes('resources-hub/') && !filePath.endsWith('resources-hub/')) return 0.7;
  if (filePath.includes('/privacy-policy.html') ||
      filePath.includes('/cookie-policy.html') ||
      filePath.includes('/terms.html') ||
      filePath.includes('/site-map/')) return 0.5;
  if (filePath.includes('/downloads/')) return 0.6;
  if (filePath.includes('/implementation-guide.html') ||
      filePath.includes('/mental-health-crisis-support.html') ||
      filePath.includes('/industry-benchmarks.html') ||
      filePath.includes('/quiet-cracking/') ||
      filePath.includes('/the-quiet-crack/') ||
      filePath.includes('/the-brain-chemistry-audit/')) return 0.7;
  // GEO/Location pages
  if (filePath.includes('/locations/') && filePath.endsWith('locations/')) return 0.8; // Main locations hub
  if (filePath.includes('/locations/') && !filePath.endsWith('locations/')) return 0.7; // Individual city pages
  return 0.8; // Default priority
};

// Recursively find all HTML files
const findHtmlFiles = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    // Skip excluded directories
    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.some(excl => filePath.includes(excl))) {
        findHtmlFiles(filePath, fileList);
      }
    } else if (file.endsWith('.html') && !EXCLUDE_FILES.includes(file)) {
      fileList.push(filePath);
    }
  });

  return fileList;
};

// Convert file path to URL
const filePathToUrl = (filePath) => {
  let url = filePath.replace(/\\/g, '/').replace('./', '');

  // Handle index.html - convert to directory URL
  if (url.endsWith('/index.html')) {
    url = url.replace('/index.html', '/');
  } else if (url === 'index.html') {
    url = '/';
  }

  return DOMAIN + (url.startsWith('/') ? url : '/' + url);
};

// Get last modified date
const getLastModified = (filePath) => {
  const stats = fs.statSync(filePath);
  return stats.mtime.toISOString().split('.')[0] + '+00:00';
};

// Generate sitemap
const generateSitemap = () => {
  console.log('🔍 Scanning for HTML files...');

  const htmlFiles = findHtmlFiles('.');
  console.log(`📄 Found ${htmlFiles.length} HTML files`);

  // Convert to URL objects with metadata
  const urls = htmlFiles.map(file => {
    const url = filePathToUrl(file);
    return {
      loc: url,
      lastmod: getLastModified(file),
      priority: getPriority(url)
    };
  });

  // Sort by priority (desc) then by URL (asc)
  urls.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.loc.localeCompare(b.loc);
  });

  // Generate XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  urls.forEach(({ loc, lastmod, priority }) => {
    xml += '<url>\n';
    xml += `<loc>${loc}</loc>\n`;
    xml += `<lastmod>${lastmod}</lastmod>\n`;
    xml += `<priority>${priority.toFixed(1)}</priority>\n`;
    xml += '</url>\n';
  });

  xml += '</urlset>\n';

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, xml);
  console.log(`✅ Sitemap generated successfully: ${OUTPUT_FILE}`);
  console.log(`📊 Total URLs: ${urls.length}`);

  // Summary by priority
  const priorityCounts = urls.reduce((acc, { priority }) => {
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📈 Priority distribution:');
  Object.keys(priorityCounts)
    .sort((a, b) => b - a)
    .forEach(priority => {
      console.log(`   ${priority}: ${priorityCounts[priority]} URLs`);
    });
};

// Run
try {
  generateSitemap();
} catch (error) {
  console.error('❌ Error generating sitemap:', error);
  process.exit(1);
}
