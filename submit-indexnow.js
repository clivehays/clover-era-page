#!/usr/bin/env node

const fs = require('fs');
const https = require('https');

// Configuration
const DOMAIN = 'https://cloverera.com';
const SITEMAP_FILE = './sitemap.xml';
const KEY = '29e170e767b14e50acbf4d24e7c21d8c';

// IndexNow endpoint (Bing receives and shares with Yandex, Seznam, Naver)
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

console.log('==========================================');
console.log('IndexNow Submission Script');
console.log('==========================================\n');

// Read and parse sitemap (using regex - no external dependencies)
const readSitemap = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(SITEMAP_FILE, 'utf-8', (err, data) => {
      if (err) reject(err);

      // Extract URLs using regex
      const urlMatches = data.match(/<loc>(.*?)<\/loc>/g);
      if (!urlMatches) reject(new Error('No URLs found in sitemap'));

      const urls = urlMatches.map(match => match.replace(/<\/?loc>/g, ''));
      resolve(urls);
    });
  });
};

// Submit URLs to IndexNow
const submitToIndexNow = (urls) => {
  const payload = JSON.stringify({
    host: 'cloverera.com',
    key: KEY,
    keyLocation: `${DOMAIN}/${KEY}.txt`,
    urlList: urls
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(INDEXNOW_ENDPOINT, options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: responseData
        });
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
};

// Main execution
const run = async () => {
  try {
    console.log('📄 Reading sitemap.xml...');
    const urls = await readSitemap();
    console.log(`✅ Found ${urls.length} URLs\n`);

    console.log('📤 Submitting to IndexNow...');
    console.log(`   Endpoint: ${INDEXNOW_ENDPOINT}`);
    console.log(`   URLs: ${urls.length}\n`);

    const response = await submitToIndexNow(urls);

    console.log('==========================================');
    console.log('Response from IndexNow');
    console.log('==========================================');
    console.log(`Status Code: ${response.statusCode}`);

    if (response.statusCode === 200) {
      console.log('✅ SUCCESS: All URLs submitted to IndexNow!');
      console.log('\nSearch engines notified:');
      console.log('  • Microsoft Bing');
      console.log('  • Yandex');
      console.log('  • Seznam.cz');
      console.log('  • Naver');
      console.log('\n⏱️  Indexing typically completes within minutes to hours.');
    } else if (response.statusCode === 202) {
      console.log('✅ ACCEPTED: URLs received and queued for processing');
    } else {
      console.log(`⚠️  Unexpected status: ${response.statusCode}`);
      console.log('Response body:', response.body);
    }

    console.log('\n==========================================');
    console.log('Submission Complete!');
    console.log('==========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

run();
