const https = require('https');
const fs = require('fs');
const path = require('path');

const key = process.env.GEMINI_API_KEY;
if (!key) { console.error('GEMINI_API_KEY not set'); process.exit(1); }
console.log('Key prefix:', key.substring(0, 10) + '...');

const data = JSON.stringify({
  contents: [{parts: [{text: 'Generate a minimalist abstract logo mark, a stylized paperclip in copper tones on concrete gray background, clean geometric lines, contemporary design, professional brand icon'}]}],
  generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: '/v1beta/models/gemini-3-pro-image-preview:generateContent?key=' + key,
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      if (json.error) {
        console.log('Error:', json.error.message);
        console.log('Code:', json.error.code);
        return;
      }
      const candidates = json.candidates || [];
      let found = false;
      for (const c of candidates) {
        for (const p of (c.content && c.content.parts || [])) {
          if (p.inlineData && p.inlineData.data) {
            const buf = Buffer.from(p.inlineData.data, 'base64');
            console.log('SUCCESS: Got image, size:', buf.length, 'bytes');
            fs.writeFileSync(path.join(__dirname, 'test-output.png'), buf);
            console.log('Saved test-output.png');
            found = true;
          }
          if (p.text) console.log('Text:', p.text.substring(0, 200));
        }
      }
      if (!found) console.log('No image found in response:', body.substring(0, 500));
    } catch(e) {
      console.log('Parse error:', e.message);
      console.log('Body:', body.substring(0, 300));
    }
  });
});
req.on('error', e => console.log('Request error:', e.message));
req.write(data);
req.end();
