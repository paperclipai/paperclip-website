const https = require('https');
const fs = require('fs');
const path = require('path');

// Try OpenAI DALL-E first (from ~/.secrets), fall back to Gemini
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';

const variations = [
  {
    name: 'variation-1',
    label: 'Executive Suite',
    prompts: {
      hero: 'Abstract premium corporate background, deep navy blue and gold color scheme, clean geometric lines and subtle grid pattern, sophisticated luxury feel, minimalist design, suitable for a tech company website hero section, no text, no people, no logos, 4k quality',
      social: 'Professional abstract design for a tech company social media card, navy blue background with gold metallic accent lines, clean and minimal, geometric shapes suggesting organization and hierarchy, premium corporate identity, no text, no logos, no people',
      motif: 'Seamless abstract pattern with fine gold lines on dark navy background, geometric precision grid intersecting with flowing curves, premium corporate texture, luxurious and authoritative feel, tileable pattern, no text'
    }
  },
  {
    name: 'variation-2',
    label: 'Neon Terminal',
    prompts: {
      hero: 'Dark cyberpunk-style abstract background, pitch black with glowing neon green and cyan accent lines, futuristic terminal aesthetic, coding and technology theme, digital grid, no text, no people, no logos, 4k quality',
      social: 'Dark mode abstract tech visual for social media, black background with bright neon green glowing network nodes and connection lines, hacker aesthetic, digital grid, futuristic and technical, no text, no logos, no people',
      motif: 'Seamless dark pattern with subtle neon green circuit board traces on near-black background, digital technology texture, terminal and code aesthetic, subtle glowing lines, tileable, no text'
    }
  },
  {
    name: 'variation-3',
    label: 'Warm Craft',
    prompts: {
      hero: 'Warm minimalist abstract background, soft cream and terracotta color palette with sage green accents, organic flowing shapes, handcrafted artisanal quality, natural textures like linen or paper, cozy and inviting, no text, no people, no logos, 4k quality',
      social: 'Warm organic abstract design for social media, cream background with terracotta and sage green watercolor-style shapes, artisanal handmade feeling, natural and approachable, minimalist, no text, no logos, no people',
      motif: 'Seamless organic pattern with soft terracotta circles and sage green flowing lines on cream background, handcrafted warmth, natural paper texture, earthy and inviting, tileable, no text'
    }
  },
  {
    name: 'variation-4',
    label: 'Electric Pop',
    prompts: {
      hero: 'Bold vibrant abstract background, electric purple to hot pink gradient with geometric shapes, high-energy startup aesthetic, modern and dynamic, clean white overlapping forms, confident and disruptive, no text, no people, no logos, 4k quality',
      social: 'Bold gradient abstract for social media, vivid purple to pink gradient background with floating geometric shapes, energetic startup vibe, modern and bold, no text, no logos, no people',
      motif: 'Seamless modern pattern with overlapping geometric shapes in purple, pink and orange gradients on white background, bold startup energy, playful yet professional, tileable, no text'
    }
  },
  {
    name: 'variation-5',
    label: 'Zen System',
    prompts: {
      hero: 'Serene minimalist abstract background, soft off-white and deep teal color palette with mint green accents, zen garden inspired, concentric circles and clean grid lines, calm and systematic, maximum whitespace, no text, no people, no logos, 4k quality',
      social: 'Calm minimal abstract for social media, deep teal on light mint background, concentric circles suggesting systems and harmony, zen-like minimalism, clean and focused, no text, no logos, no people',
      motif: 'Seamless subtle pattern with thin teal lines forming a calm grid with occasional circles on off-white background, zen minimalism, systematic and ordered, meditative quality, tileable, no text'
    }
  }
];

function generateImage(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json'
    });

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.data && json.data[0] && json.data[0].b64_json) {
            resolve(Buffer.from(json.data[0].b64_json, 'base64'));
          } else if (json.error) {
            reject(new Error(`API error: ${json.error.message || JSON.stringify(json.error)}`));
          } else {
            reject(new Error(`Unexpected response: ${body.substring(0, 300)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message} - Body: ${body.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function generateVariation(variation) {
  const dir = path.join(__dirname, 'public', 'assets', variation.name);
  fs.mkdirSync(dir, { recursive: true });

  for (const [type, prompt] of Object.entries(variation.prompts)) {
    const filePath = path.join(dir, `${type}.png`);
    console.log(`  Generating ${variation.label} / ${type}...`);
    try {
      const imageBuffer = await generateImage(prompt);
      fs.writeFileSync(filePath, imageBuffer);
      console.log(`  ✓ Saved ${filePath} (${(imageBuffer.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.error(`  ✗ Failed ${type}: ${err.message}`);
    }
    // Small delay between requests to avoid rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }
}

async function main() {
  console.log('Paperclip Brand Kit - Image Generation (DALL-E 3)');
  console.log('==================================================\n');

  for (const variation of variations) {
    console.log(`\n[${variation.label}]`);
    await generateVariation(variation);
  }

  console.log('\n\nDone! Start the server with: node server.js');
}

main().catch(console.error);
