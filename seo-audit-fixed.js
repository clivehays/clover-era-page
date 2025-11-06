#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const issues = {
  noMetaDescription: [],
  shortMetaDescription: [],
  longMetaDescription: [],
  missingAltText: [],
  emptyAltText: [],
  noH1: [],
  multipleH1: []
};

const EXCLUDE_DIRS = ['node_modules', '.git', 'backups', 'deprecated', 'old', 'archive', 'test'];

function shouldSkip(filePath) {
  return EXCLUDE_DIRS.some(dir => filePath.includes(`${path.sep}${dir}${path.sep}`) || filePath.includes(`${path.sep}${dir}`));
}

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    if (shouldSkip(filePath)) return;
    
    if (fs.statSync(filePath).isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = filePath.replace(process.cwd() + path.sep, '');
  
  // Check meta description
  const metaDescMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  if (!metaDescMatch) {
    issues.noMetaDescription.push(relativePath);
  } else {
    const desc = metaDescMatch[1];
    if (desc.length < 120) issues.shortMetaDescription.push({file: relativePath, length: desc.length});
    if (desc.length > 160) issues.longMetaDescription.push({file: relativePath, length: desc.length});
  }
  
  // Check images for alt text
  const imgTags = content.match(/<img[^>]*>/gi) || [];
  imgTags.forEach(img => {
    if (!img.includes('alt=')) {
      issues.missingAltText.push({file: relativePath, img: img.substring(0, 100)});
    } else if (img.match(/alt=["']\s*["']/)) {
      issues.emptyAltText.push({file: relativePath, img: img.substring(0, 100)});
    }
  });
  
  // Check H1 tags
  const h1Tags = content.match(/<h1[sS]*?</h1>/gi) || [];
  if (h1Tags.length === 0) issues.noH1.push(relativePath);
  if (h1Tags.length > 1) issues.multipleH1.push({file: relativePath, count: h1Tags.length});
}

console.log('\n🔍 SEO AUDIT REPORT\n' + '='.repeat(50) + '\n');

const htmlFiles = findHtmlFiles(process.cwd());
console.log(`📄 Total HTML files found: ${htmlFiles.length}\n`);

htmlFiles.forEach(analyzeFile);

// Results
console.log('📝 META DESCRIPTIONS');
console.log(`✅ Pages with meta descriptions: ${htmlFiles.length - issues.noMetaDescription.length}`);
if (issues.noMetaDescription.length > 0) {
  console.log(`❌ Missing meta description (${issues.noMetaDescription.length} pages):`);
  issues.noMetaDescription.forEach(f => console.log(`   - ${f}`));
}

if (issues.shortMetaDescription.length > 0) {
  console.log(`\n⚠️  Short meta descriptions < 120 chars (${issues.shortMetaDescription.length} pages):`);
  issues.shortMetaDescription.forEach(item => console.log(`   - ${item.file} (${item.length} chars)`));
}

if (issues.longMetaDescription.length > 0) {
  console.log(`\n⚠️  Long meta descriptions > 160 chars (${issues.longMetaDescription.length} pages):`);
  issues.longMetaDescription.forEach(item => console.log(`   - ${item.file} (${item.length} chars)`));
}

console.log('\n🖼️  IMAGE ALT TEXT');
if (issues.missingAltText.length === 0 && issues.emptyAltText.length === 0) {
  console.log('✅ All images have alt text');
} else {
  if (issues.missingAltText.length > 0) {
    console.log(`❌ Missing alt text (${issues.missingAltText.length} images):`);
    issues.missingAltText.slice(0, 5).forEach(item => console.log(`   - ${item.file}`));
  }
  if (issues.emptyAltText.length > 0) {
    console.log(`❌ Empty alt text (${issues.emptyAltText.length} images):`);
    issues.emptyAltText.slice(0, 5).forEach(item => console.log(`   - ${item.file}`));
  }
}

console.log('\n📋 H1 TAGS');
if (issues.noH1.length > 0) {
  console.log(`❌ Pages missing H1 (${issues.noH1.length} pages):`);
  issues.noH1.forEach(f => console.log(`   - ${f}`));
}

if (issues.multipleH1.length > 0) {
  console.log(`\n⚠️  Pages with multiple H1 tags (${issues.multipleH1.length} pages):`);
  issues.multipleH1.forEach(item => console.log(`   - ${item.file} (${item.count} H1s)`));
} else {
  console.log('✅ No pages with multiple H1 tags');
}

const criticalIssues = issues.noMetaDescription.length + issues.noH1.length;
console.log('\n📊 SUMMARY');
console.log(`Total critical issues: ${criticalIssues}`);
console.log(`Total pages audited: ${htmlFiles.length}`);
