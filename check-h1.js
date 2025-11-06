const fs = require('fs');

const testFile = 'about.html';
const content = fs.readFileSync(testFile, 'utf-8');

// Multi-line regex with dotall flag
const h1MultiLine = content.match(/<h1[\s\S]*?<\/h1>/gi) || [];
console.log('Multi-line regex matches:', h1MultiLine.length);

if (h1MultiLine.length > 0) {
  console.log('\nFound H1:');
  const preview = h1MultiLine[0].substring(0, 150).replace(/\n/g, ' ');
  console.log(preview);
}
