const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBXiTp8p7o1p-rnxTify4xq-nxa8vowHmo';
const MODEL = 'gemini-3-pro-image-preview';

// Logo concepts — 2 per variation (rate limit is ~1 req/min)
const logoPrompts = [
  // ---- REGENCY (Variation 1) ----
  {
    dir: 'variation-1/logos',
    name: 'regency-icon-gold',
    prompt: 'Design a logo icon: a stylized paperclip rendered as a premium gold metallic 3D object on a deep navy blue background (#0b1120). The paperclip should look like a luxury brand monogram, clean minimal lines, dramatic studio lighting from above left, subtle reflection. No text. Centered composition.'
  },
  {
    dir: 'variation-1/logos',
    name: 'regency-monogram',
    prompt: 'Design a monogram logo: the letter P elegantly intertwined with a paperclip shape, rendered in antique gold on midnight navy blue. Serif typography, classical proportions, like a Cartier or Hermes monogram. Luxurious, refined, no text other than the letter. Clean background.'
  },
  {
    dir: 'variation-1/logos',
    name: 'regency-shield',
    prompt: 'Design a logo: a heraldic shield emblem containing a stylized paperclip motif. Gold and navy blue color scheme. Classic institutional feel like a university crest or private bank logo. Clean vector-style rendering, centered on solid dark navy background. No text.'
  },
  {
    dir: 'variation-1/logos',
    name: 'regency-minimal',
    prompt: 'Design a minimalist logo: a single continuous gold line forming a paperclip shape on white background. Hairline-thin strokes, extreme elegance and simplicity. Like a luxury jewelry brand mark. No text, centered.'
  },

  // ---- PHOSPHOR (Variation 2) ----
  {
    dir: 'variation-2/logos',
    name: 'phosphor-glow',
    prompt: 'Design a logo: a paperclip icon made of glowing neon green (#39ff85) light on pure black background. The paperclip appears to emit soft green phosphor glow like a CRT monitor. Slight bloom/halo effect around the lines. Retro-futuristic terminal aesthetic. No text.'
  },
  {
    dir: 'variation-2/logos',
    name: 'phosphor-circuit',
    prompt: 'Design a logo: a paperclip shape integrated into a circuit board pattern. Neon green traces on dark black-green background. The paperclip forms a node in the circuit. Cyberpunk aesthetic, technical, precise. PCB trace style lines. No text.'
  },
  {
    dir: 'variation-2/logos',
    name: 'phosphor-wireframe',
    prompt: 'Design a logo: a 3D wireframe paperclip rendered in cyan (#00c8ff) and green (#39ff85) glowing lines on black background. Like a 3D modeling viewport. Grid lines visible in background. Retro-futuristic computer graphics style. No text.'
  },
  {
    dir: 'variation-2/logos',
    name: 'phosphor-ascii',
    prompt: 'Design a logo: a paperclip shape made entirely of ASCII characters and code symbols, rendered in green monospace font on black terminal screen. Matrix/hacker aesthetic. The characters form the outline of a paperclip. Like a terminal art piece. Centered on screen.'
  },

  // ---- TERRACOTTA (Variation 3) ----
  {
    dir: 'variation-3/logos',
    name: 'terracotta-stamp',
    prompt: 'Design a logo: a paperclip icon that looks like a hand-carved rubber stamp print in terracotta red (#c15a3a) on cream textured paper (#f7f2ec). Slightly imperfect edges showing the handmade quality. Artisanal, warm, crafted feel. Like a pottery makers mark. No text.'
  },
  {
    dir: 'variation-3/logos',
    name: 'terracotta-botanical',
    prompt: 'Design a logo: a paperclip shape intertwined with delicate botanical line drawings — small leaves and vines growing around it. Drawn in terracotta red and sage green on cream background. Hand-illustrated feel, like a botanical print. Organic and warm. No text.'
  },
  {
    dir: 'variation-3/logos',
    name: 'terracotta-ceramic',
    prompt: 'Design a logo: a paperclip rendered as if it were a ceramic pottery piece — smooth terracotta clay texture, warm earthy tones, soft shadows suggesting 3D depth. On a natural linen-textured cream background. Handmade artisanal quality. No text.'
  },
  {
    dir: 'variation-3/logos',
    name: 'terracotta-watercolor',
    prompt: 'Design a logo: a paperclip shape painted in loose watercolor style. Terracotta red and sage green watercolor washes forming the paperclip outline. Soft, organic, with paint bleeding at edges. On white watercolor paper texture. Artistic, handmade feeling. No text.'
  },

  // ---- SUPERNOVA (Variation 4) ----
  {
    dir: 'variation-4/logos',
    name: 'supernova-gradient',
    prompt: 'Design a logo: a bold geometric paperclip icon with a vibrant gradient from electric purple (#8b5cf6) through hot pink (#ec4899) to orange (#f97316). Clean modern vector style on white background. The paperclip is thick, rounded, confident. Startup energy. No text.'
  },
  {
    dir: 'variation-4/logos',
    name: 'supernova-3d',
    prompt: 'Design a logo: a 3D rendered paperclip with a glossy purple-to-pink gradient surface, floating with a subtle shadow below it. Modern product rendering on white background. Bold, dynamic angle as if flying upward. Glass-like material. No text.'
  },
  {
    dir: 'variation-4/logos',
    name: 'supernova-neon',
    prompt: 'Design a logo: a paperclip shape as a vibrant neon sign, glowing purple and pink on dark charcoal background. Realistic neon tube rendering with glass tubes, warm glow, and light spill. Urban, exciting, bold. No text.'
  },
  {
    dir: 'variation-4/logos',
    name: 'supernova-abstract',
    prompt: 'Design a logo: an abstract geometric interpretation of a paperclip made of overlapping triangles and shapes in purple, pink, and orange. Low-poly style. Modern, dynamic composition. On clean white background. Like an abstract sculpture. No text.'
  },

  // ---- STILLWATER (Variation 5) ----
  {
    dir: 'variation-5/logos',
    name: 'stillwater-zen',
    prompt: 'Design a logo: a paperclip shape rendered with a single flowing brushstroke in deep teal (#0c3c3f) on off-white background. Japanese calligraphy zen style — one confident stroke that forms the paperclip curve. Wabi-sabi aesthetic, intentional imperfection. No text.'
  },
  {
    dir: 'variation-5/logos',
    name: 'stillwater-ripple',
    prompt: 'Design a logo: a paperclip shape at the center of concentric circles like ripples in still water. Deep teal and jade green (#2a9d8f) on soft mint (#d9eeeb) background. Minimalist, meditative, calm. Thin precise lines. The paperclip is the stone dropped in water. No text.'
  },
  {
    dir: 'variation-5/logos',
    name: 'stillwater-stone',
    prompt: 'Design a logo: a paperclip shape carved into a smooth stone surface — like a zen garden stone with a precise engraving. Teal tones, natural stone texture, soft shadows. Quiet, permanent, grounded. Photorealistic rendering. No text.'
  },
  {
    dir: 'variation-5/logos',
    name: 'stillwater-geometric',
    prompt: 'Design a logo: a paperclip shape constructed from minimal geometric elements — circles and straight lines only. Deep teal on white. Like a technical blueprint or architectural drawing. Grid guides visible but subtle. Mathematical precision. No text.'
  },
];

function generateImageRaw(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      method: 'POST',
      headers: {
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
          if (json.error) {
            const msg = json.error.message || JSON.stringify(json.error);
            const retryMatch = msg.match(/retry in ([\d.]+)s/i);
            const err = new Error(`API: ${msg}`);
            err.retryAfter = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) + 5 : 0;
            return reject(err);
          }
          const parts = json.candidates?.[0]?.content?.parts || [];
          for (const p of parts) {
            if (p.inlineData) {
              return resolve(Buffer.from(p.inlineData.data, 'base64'));
            }
          }
          reject(new Error('No image in response'));
        } catch (e) {
          reject(new Error(`Parse: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(data);
    req.end();
  });
}

async function generateImage(prompt, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateImageRaw(prompt);
    } catch (err) {
      if (err.retryAfter && attempt < maxRetries - 1) {
        const wait = err.retryAfter;
        process.stdout.write(`  rate-limited, waiting ${wait}s...`);
        await new Promise(r => setTimeout(r, wait * 1000));
        process.stdout.write(' retrying\n');
        continue;
      }
      throw err;
    }
  }
}

async function main() {
  console.log('Paperclip Logo Generation — Gemini 3 Pro');
  console.log('=========================================\n');

  let success = 0, fail = 0;

  for (let i = 0; i < logoPrompts.length; i++) {
    const { dir, name, prompt } = logoPrompts[i];
    const outDir = path.join(__dirname, 'public', 'assets', dir);
    fs.mkdirSync(outDir, { recursive: true });
    const filePath = path.join(outDir, `${name}.png`);

    // Skip if already generated
    if (fs.existsSync(filePath)) {
      console.log(`[${i + 1}/${logoPrompts.length}] ${name} — already exists, skipping`);
      success++;
      continue;
    }

    console.log(`[${i + 1}/${logoPrompts.length}] ${name}...`);
    try {
      const img = await generateImage(prompt);
      fs.writeFileSync(filePath, img);
      console.log(`  ✓ ${(img.length / 1024).toFixed(0)} KB`);
      success++;
    } catch (err) {
      console.error(`  ✗ ${err.message.substring(0, 120)}`);
      fail++;
    }

    // Wait between successful requests to avoid rate limits
    if (i < logoPrompts.length - 1) {
      const wait = 70;
      process.stdout.write(`  waiting ${wait}s...`);
      await new Promise(r => setTimeout(r, wait * 1000));
      process.stdout.write(' go\n');
    }
  }

  console.log(`\nDone: ${success} success, ${fail} failed`);
}

main().catch(console.error);
