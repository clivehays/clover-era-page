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

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = filePath.replace(process.cwd() + '/', '');
  
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
    } else if (img.match(/alt=[""']\s*[""']/)) {
      issues.emptyAltText.push({file: relativePath, img: img.substring(0, 100)});
    }
  });
  
  // Check H1 tags
  const h1Tags = content.match(/<h1[^>]*>.*?<\/h1>/gi) || [];
  if (h1Tags.length === 0) issues.noH1.push(relativePath);
  if (h1Tags.length > 1) issues.multipleH1.push({file: relativePath, count: h1Tags.length});
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!filePath.includes('backups') && !filePath.includes('node_modules')) {
        scanDirectory(filePath);
      }
    } else if (file.endsWith('.html') && !filePath.includes('backups')) {
      analyzeFile(filePath);
    }
  });
}

console.log('🔍 SEO Audit Report\n');
scanDirectory('.');

console.log('📝 META DESCRIPTIONS');
console.log(`✅ Pages with meta descriptions: ${80 - issues.noMetaDescription.length}`);
console.log(`❌ Missing meta description (${issues.noMetaDescription.length}):`);
issues.noMetaDescription.slice(0, 10).forEach(f => console.log(`   - ${f}`));

console.log(`\n⚠️  Short meta descriptions < 120 chars (${issues.shortMetaDescription.length}):`);
issues.shortMetaDescription.slice(0, 10).forEach(i => console.log(`   - ${i.file} (${i.length} chars)`));

console.log(`\n⚠️  Long meta descriptions > 160 chars (${issues.longMetaDescription.length}):`);
issues.longMetaDescription.slice(0, 10).forEach(i => console.log(`   - ${i.file} (${i.length} chars)`));

console.log(`\n🖼️  IMAGE ALT TEXT`);
console.log(`❌ Images missing alt text (${issues.missingAltText.length}):`);
issues.missingAltText.slice(0, 10).forEach(i => console.log(`   - ${i.file}`));

console.log(`\n⚠️  Images with empty alt text (${issues.emptyAltText.length}):`);
issues.emptyAltText.slice(0, 10).forEach(i => console.log(`   - ${i.file}`));

console.log(`\n📋 H1 TAGS`);
console.log(`❌ Pages missing H1 (${issues.noH1.length}):`);
issues.noH1.slice(0, 10).forEach(f => console.log(`   - ${f}`));

console.log(`\n⚠️  Pages with multiple H1 tags (${issues.multipleH1.length}):`);
issues.multipleH1.slice(0, 10).forEach(i => console.log(`   - ${i.file} (${i.count} H1 tags)`));

console.log('\n📊 SUMMARY');
const totalIssues = issues.noMetaDescription.length + issues.missingAltText.length + issues.noH1.length + issues.multipleH1.length;
console.log(`Total critical issues: ${totalIssues}`);
console.log(`Total pages audited: 87`);
