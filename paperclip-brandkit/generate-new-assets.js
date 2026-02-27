const https = require('https');
const fs = require('fs');
const path = require('path');

// Gemini API key from ~/.secrets
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL = 'gemini-3-pro-image-preview'; // image generation capable model

const newVariations = [
  {
    name: 'variation-6',
    label: 'Meridian (Contemporary Realism)',
    prompts: {
      hero: 'Architectural abstract background, warm concrete and copper tones, precise geometric lines forming a subtle grid, material textures like polished stone and brushed metal, contemporary realism aesthetic, grounded and tangible, no text, no people, no logos, 4k quality',
      social: 'Contemporary realist abstract for social media, warm gray concrete background with copper metallic accent lines, precise architectural geometry, material texture feel like real surfaces, clean and grounded, no text, no logos, no people',
      motif: 'Seamless architectural pattern with precise grid lines in warm gray and copper on cream background, material texture quality, contemporary realism, tileable, resembles blueprint or architectural drawing, no text'
    },
    logoPrompts: {
      'meridian-architectural': 'Minimal architectural logo for a tech company called Paperclip, contemporary realism style, a paperclip rendered as a precise architectural element like a steel beam or column, copper and graphite colors on white background, clean geometric lines, professional and grounded, no text',
      'meridian-copper': 'Modern logo mark for Paperclip tech company, a stylized paperclip icon in brushed copper metallic finish on dark charcoal background, contemporary realism, industrial design aesthetic, precise and tangible, no text',
      'meridian-grid': 'Grid-based logo for Paperclip technology company, a paperclip shape formed by precise grid intersections, architectural blueprint style, warm gray and copper colors, contemporary realist aesthetic, no text',
      'meridian-mono': 'Monoline paperclip logo, single continuous line forming a paperclip shape, precise and architectural, dark graphite on light concrete background, contemporary minimalist realism, professional, no text'
    }
  },
  {
    name: 'variation-7',
    label: 'Parallax (Futuristic Surrealism)',
    prompts: {
      hero: 'Futuristic surrealist abstract background, deep indigo and magenta with gold accents, layered impossible environments, dreamlike floating geometric structures, steampunk meets digital retrofuturism, ethereal depth and otherworldly atmosphere, no text, no people, no logos, 4k quality',
      social: 'Surrealist futuristic abstract for social media, deep purple void with floating impossible geometric forms, magenta and gold light sources, dreamlike layered environment, futuristic surrealism aesthetic, no text, no logos, no people',
      motif: 'Seamless surrealist pattern with impossible geometric shapes floating in deep indigo space, magenta and gold accents, layered depth effect, futuristic surrealism, dreamlike quality, tileable, no text'
    },
    logoPrompts: {
      'parallax-portal': 'Surrealist logo for Paperclip tech company, a paperclip forming a portal or gateway shape with concentric rings of light, deep indigo and magenta colors with gold accents, futuristic surrealism style, dreamlike and impossible, no text',
      'parallax-surreal': 'Futuristic surrealist logo mark for Paperclip, a paperclip shape that morphs into an impossible Escher-like structure, deep purple and magenta gradient, ethereal glow, surreal and dreamlike, no text',
      'parallax-dreamscape': 'Dreamscape logo for Paperclip company, a stylized paperclip floating in a surreal environment with layered depth rings, indigo to magenta gradient background, gold accent highlights, futuristic surrealism, no text',
      'parallax-impossible': 'Impossible geometry paperclip logo, the paperclip shape rendered as an optical illusion with contradicting perspectives, deep indigo and gold colors, futuristic surrealism aesthetic, mesmerizing and otherworldly, no text'
    }
  },
  {
    name: 'variation-8',
    label: 'Dissolve (Digital Impressionism)',
    prompts: {
      hero: 'Digital impressionist abstract background, soft blurred lavender and blush tones bleeding together, nothing in sharp focus, atmospheric color gradients, watercolor-like quality, gentle and atmospheric, painterly soft forms, no text, no people, no logos, 4k quality',
      social: 'Digital impressionist abstract for social media, soft unfocused forms in lavender, blush pink and pale blue, colors bleeding at edges like watercolor, atmospheric and suggestive, deliberately soft and blurry, no text, no logos, no people',
      motif: 'Seamless impressionist pattern with soft blurred circular forms in lavender and blush overlapping on pearl background, digital impressionism aesthetic, atmospheric color bleeding, deliberately soft focus, tileable, no text'
    },
    logoPrompts: {
      'dissolve-watercolor': 'Watercolor impressionist logo for Paperclip tech company, a paperclip shape rendered in soft blurred watercolor washes of lavender and blush pink, deliberately unfocused edges, painterly and atmospheric, digital impressionism, no text',
      'dissolve-mist': 'Misty impressionist logo for Paperclip, a paperclip emerging from soft fog-like gradients of lavender and blue, digital impressionism style, nothing in sharp focus, atmospheric and dreamy, no text',
      'dissolve-soft': 'Soft focus logo for Paperclip company, a paperclip icon with gaussian-blurred edges and soft color halos in lavender and rose, digital impressionism aesthetic, suggestive rather than defined, no text',
      'dissolve-bleed': 'Color bleed logo for Paperclip, a paperclip shape where colors bleed and merge at boundaries, lavender into blush into pale blue, impressionistic and painterly, soft atmospheric quality, no text'
    }
  },
  {
    name: 'variation-9',
    label: 'Theorem (Non-Brand Academia)',
    prompts: {
      hero: 'Minimalist academic abstract background, near-white paper texture with subtle mathematical notation and grid lines, single red accent element, scholarly and austere, lean typography aesthetic, non-brand academia style, no text content, no people, no logos, 4k quality',
      social: 'Academic minimalist abstract for social media, cream paper background with thin black rule lines forming a grid, single red dot accent, scholarly and stripped-down, non-brand academia aesthetic, functional and authoritative, no text, no logos, no people',
      motif: 'Seamless academic pattern with thin black grid lines and occasional red accent marks on off-white paper background, mathematical notation-inspired, non-brand academia style, austere and functional, tileable, no text'
    },
    logoPrompts: {
      'theorem-typographic': 'Minimal typographic logo for Paperclip tech company, scholarly serif font showing just the letter P with a small red period, academic journal aesthetic, near-black on cream paper background, non-brand academia style, austere and authoritative, no decorative elements',
      'theorem-minimal': 'Ultra-minimal logo for Paperclip, a thin-line paperclip rendered in black on white with a single small red accent dot, academic and scholarly feel, like a diagram in a research paper, non-brand academia, no text',
      'theorem-notation': 'Mathematical notation style logo for Paperclip, a paperclip shape rendered as if it were a mathematical symbol or set theory notation, black ink on cream paper, scholarly and rigorous, non-brand academia aesthetic, no text',
      'theorem-academic': 'Academic logo for Paperclip company, a paperclip rendered as a technical illustration with annotation marks and measurement lines, like a figure in an academic paper, black and red on white, scholarly, no text'
    }
  },
  {
    name: 'variation-10',
    label: 'Automata (Generative Art)',
    prompts: {
      hero: 'Generative art abstract background, algorithmic pattern emerging from a grid of cells, dark void background with bright green and orange cell activations, cellular automata aesthetic, emergent complexity from simple rules, computational beauty, no text, no people, no logos, 4k quality',
      social: 'Generative art abstract for social media, dark background with grid of glowing green cells forming emergent patterns, occasional orange pulse accents, cellular automata and algorithmic art aesthetic, computational and alive, no text, no logos, no people',
      motif: 'Seamless generative art pattern, cellular automata grid with cells in varying opacities of green and orange on near-black background, algorithmic and procedural feel, rule-based visual system, tileable, no text'
    },
    logoPrompts: {
      'automata-cellular': 'Cellular automata logo for Paperclip tech company, a paperclip shape formed by a grid of small illuminated cells in bright green on dark background, generative art aesthetic, some cells orange as accents, algorithmic and emergent, no text',
      'automata-emergent': 'Emergent pattern logo for Paperclip, cells and nodes forming a paperclip shape through algorithmic rules, green glow on dark teal background, generative art style, living system aesthetic, no text',
      'automata-procedural': 'Procedural art logo for Paperclip company, a paperclip rendered through rule-based generative processes, grid-based with green and orange cell activations, algorithmic beauty on dark background, no text',
      'automata-signal': 'Signal processing logo for Paperclip, a waveform or signal pattern that traces the shape of a paperclip, bright green signal on dark void background with orange pulse markers, generative art aesthetic, no text'
    }
  }
];

// Use Gemini API with imagen model
function generateImageGemini(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"]
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
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
            reject(new Error(`Gemini API error: ${json.error.message || JSON.stringify(json.error)}`));
            return;
          }
          // Look for inline image data in the response
          const candidates = json.candidates || [];
          for (const candidate of candidates) {
            const parts = (candidate.content && candidate.content.parts) || [];
            for (const part of parts) {
              if (part.inlineData && part.inlineData.data) {
                resolve(Buffer.from(part.inlineData.data, 'base64'));
                return;
              }
            }
          }
          reject(new Error(`No image in response: ${body.substring(0, 500)}`));
        } catch (e) {
          reject(new Error(`Parse error: ${e.message} - Body: ${body.substring(0, 300)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function generateVariationAssets(variation) {
  const assetDir = path.join(__dirname, 'public', 'assets', variation.name);
  const logoDir = path.join(assetDir, 'logos');
  fs.mkdirSync(logoDir, { recursive: true });

  // Generate hero, social, motif
  for (const [type, prompt] of Object.entries(variation.prompts)) {
    const filePath = path.join(assetDir, `${type}.png`);
    if (fs.existsSync(filePath)) {
      console.log(`  ⏭ ${variation.label} / ${type} — already exists, skipping`);
      continue;
    }
    console.log(`  ⏳ Generating ${variation.label} / ${type}...`);
    try {
      const imageBuffer = await generateImageGemini(prompt);
      fs.writeFileSync(filePath, imageBuffer);
      console.log(`  ✓ Saved ${type}.png (${(imageBuffer.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.error(`  ✗ Failed ${type}: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  // Generate logos
  for (const [name, prompt] of Object.entries(variation.logoPrompts)) {
    const filePath = path.join(logoDir, `${name}.png`);
    if (fs.existsSync(filePath)) {
      console.log(`  ⏭ ${variation.label} / logo: ${name} — already exists, skipping`);
      continue;
    }
    console.log(`  ⏳ Generating ${variation.label} / logo: ${name}...`);
    try {
      const imageBuffer = await generateImageGemini(prompt);
      fs.writeFileSync(filePath, imageBuffer);
      console.log(`  ✓ Saved ${name}.png (${(imageBuffer.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.error(`  ✗ Failed logo ${name}: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}

async function main() {
  console.log('Paperclip Brand Kit - New Variations Image Generation (Gemini)');
  console.log('================================================================\n');

  if (!GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY not set. Source ~/.secrets first.');
    process.exit(1);
  }

  for (const variation of newVariations) {
    console.log(`\n[${variation.label}]`);
    await generateVariationAssets(variation);
  }

  console.log('\n\nDone! Start/restart the server with: node server.js');
}

main().catch(console.error);
