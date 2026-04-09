#!/usr/bin/env node
/**
 * Generate bright illustrated /vs cover images matching the Paperclip site brand.
 * Style reference: hero-bg.jpg (blue water, pink birds, green landscape)
 *                  blog-header.jpg (blue sky, yellow paperclip, pink birds, flowers)
 *
 * Outputs SVGs to $TMPDIR, then uses ImageMagick to convert to WebP + JPG.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUT_DIR = process.env.TMPDIR || '/tmp';
const FINAL_DIR = path.join(__dirname, '..', 'public', 'vs');
const WIDTH = 1200;
const HEIGHT = 630;

// Brand palette extracted from hero-bg.jpg and blog-header.jpg
const PALETTE = {
  skyBlue: '#2E8BC0',
  deepBlue: '#1B4F8A',
  waterBlue: '#3BA3D9',
  lightBlue: '#7ECEF4',
  green: '#4CAF50',
  darkGreen: '#2E7D32',
  lightGreen: '#81C784',
  yellow: '#FFD54F',
  brightYellow: '#FFEB3B',
  pink: '#F06292',
  coral: '#FF8A80',
  hotPink: '#EC407A',
  orange: '#FF9800',
  cream: '#FFF9C4',
  white: '#FFFFFF',
  softPurple: '#CE93D8',
};

// Paperclip SVG path (stylized, matching the brand logo)
function paperclipShape(x, y, scale = 1, color = PALETTE.yellow, rotation = 0) {
  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation}) scale(${scale})">
      <path d="M-12,-45 C-12,-55 12,-55 12,-45 L12,30 C12,45 -18,45 -18,30 L-18,-20 C-18,-30 6,-30 6,-20 L6,20"
            fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
}

// Bird shape (simplified flying bird like the pink ones in reference)
function bird(x, y, scale = 1, color = PALETTE.pink) {
  return `
    <g transform="translate(${x}, ${y}) scale(${scale})">
      <path d="M-15,0 Q-8,-12 0,-5 Q8,-12 15,0" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
    </g>`;
}

// Flower shape
function flower(x, y, size = 12, petalColor = PALETTE.pink, centerColor = PALETTE.yellow) {
  const petals = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72) * Math.PI / 180;
    const px = Math.cos(angle) * size * 0.6;
    const py = Math.sin(angle) * size * 0.6;
    petals.push(`<circle cx="${px}" cy="${py}" r="${size * 0.45}" fill="${petalColor}" opacity="0.85"/>`);
  }
  return `
    <g transform="translate(${x}, ${y})">
      ${petals.join('\n')}
      <circle cx="0" cy="0" r="${size * 0.25}" fill="${centerColor}"/>
    </g>`;
}

// Cloud shape
function cloud(x, y, scale = 1, color = '#FFFFFF', opacity = 0.9) {
  return `
    <g transform="translate(${x}, ${y}) scale(${scale})" opacity="${opacity}">
      <ellipse cx="0" cy="0" rx="60" ry="25" fill="${color}"/>
      <ellipse cx="-35" cy="5" rx="35" ry="20" fill="${color}"/>
      <ellipse cx="30" cy="5" rx="40" ry="22" fill="${color}"/>
      <ellipse cx="-10" cy="-10" rx="40" ry="22" fill="${color}"/>
    </g>`;
}

// Rolling hills
function hills(y, color, height = 80) {
  return `<path d="M0,${y} Q150,${y - height} 300,${y} Q450,${y - height * 0.7} 600,${y} Q750,${y - height * 0.9} 900,${y} Q1050,${y - height * 0.6} 1200,${y} L1200,630 L0,630 Z" fill="${color}"/>`;
}

// Scattered dots/particles for texture
function dots(count, yMin, yMax, colors) {
  let result = '';
  // Use deterministic positions
  for (let i = 0; i < count; i++) {
    const x = (i * 137.5) % WIDTH;
    const y = yMin + ((i * 97.3) % (yMax - yMin));
    const r = 2 + (i % 4);
    const color = colors[i % colors.length];
    result += `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="0.5"/>`;
  }
  return result;
}

// ─── Hero Image ─────────────────────────────────────────────────
function generateHero() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${PALETTE.deepBlue}"/>
      <stop offset="50%" style="stop-color:${PALETTE.skyBlue}"/>
      <stop offset="100%" style="stop-color:${PALETTE.lightBlue}"/>
    </linearGradient>
    <linearGradient id="water" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${PALETTE.waterBlue}"/>
      <stop offset="100%" style="stop-color:${PALETTE.deepBlue}"/>
    </linearGradient>
  </defs>

  <!-- Sky -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sky)"/>

  <!-- Clouds -->
  ${cloud(200, 80, 1.2)}
  ${cloud(700, 50, 0.8)}
  ${cloud(1000, 100, 1.0)}

  <!-- Water / horizon -->
  <rect x="0" y="320" width="${WIDTH}" height="310" fill="url(#water)" opacity="0.6"/>

  <!-- Green landscape -->
  ${hills(420, PALETTE.darkGreen, 90)}
  ${hills(460, PALETTE.green, 70)}
  ${hills(500, PALETTE.lightGreen, 60)}

  <!-- Flowers scattered on the hills -->
  ${flower(80, 480, 14, PALETTE.pink, PALETTE.yellow)}
  ${flower(200, 510, 10, PALETTE.coral, PALETTE.brightYellow)}
  ${flower(350, 490, 12, PALETTE.hotPink, PALETTE.cream)}
  ${flower(500, 520, 11, PALETTE.orange, PALETTE.yellow)}
  ${flower(650, 485, 13, PALETTE.pink, PALETTE.brightYellow)}
  ${flower(800, 515, 10, PALETTE.softPurple, PALETTE.yellow)}
  ${flower(950, 495, 14, PALETTE.coral, PALETTE.cream)}
  ${flower(1100, 510, 11, PALETTE.hotPink, PALETTE.yellow)}
  ${flower(140, 540, 9, PALETTE.orange, PALETTE.brightYellow)}
  ${flower(420, 550, 10, PALETTE.pink, PALETTE.yellow)}
  ${flower(720, 545, 12, PALETTE.softPurple, PALETTE.cream)}
  ${flower(1020, 540, 9, PALETTE.coral, PALETTE.yellow)}

  <!-- Paperclips floating -->
  ${paperclipShape(150, 200, 1.2, PALETTE.yellow, -15)}
  ${paperclipShape(1050, 180, 0.8, PALETTE.brightYellow, 20)}
  ${paperclipShape(600, 150, 0.6, PALETTE.yellow, -5)}

  <!-- Birds -->
  ${bird(300, 120, 1.2, PALETTE.pink)}
  ${bird(350, 100, 0.9, PALETTE.hotPink)}
  ${bird(400, 130, 1.0, PALETTE.pink)}
  ${bird(800, 90, 1.1, PALETTE.coral)}
  ${bird(850, 110, 0.8, PALETTE.pink)}
  ${bird(750, 70, 0.7, PALETTE.hotPink)}

  <!-- Texture dots -->
  ${dots(30, 350, 450, [PALETTE.lightBlue, PALETTE.white])}
</svg>`;
}

// ─── Cover Image Template ───────────────────────────────────────
function generateCover(competitor, accentColor, secondaryColor, iconFn) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${PALETTE.skyBlue}"/>
      <stop offset="50%" style="stop-color:${PALETTE.lightBlue}"/>
      <stop offset="100%" style="stop-color:${accentColor}"/>
    </linearGradient>
    <linearGradient id="hill1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${PALETTE.green}"/>
      <stop offset="100%" style="stop-color:${PALETTE.darkGreen}"/>
    </linearGradient>
  </defs>

  <!-- Background gradient -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>

  <!-- Decorative circles / bubbles -->
  <circle cx="100" cy="100" r="180" fill="${secondaryColor}" opacity="0.12"/>
  <circle cx="1100" cy="530" r="200" fill="${accentColor}" opacity="0.15"/>
  <circle cx="600" cy="50" r="120" fill="${PALETTE.yellow}" opacity="0.1"/>
  <circle cx="900" cy="200" r="80" fill="${PALETTE.pink}" opacity="0.1"/>

  <!-- Clouds -->
  ${cloud(250, 60, 0.7, PALETTE.white, 0.7)}
  ${cloud(850, 40, 0.9, PALETTE.white, 0.6)}

  <!-- Bottom landscape -->
  ${hills(500, PALETTE.darkGreen, 60)}
  ${hills(530, PALETTE.green, 50)}
  ${hills(560, PALETTE.lightGreen, 40)}

  <!-- Flowers -->
  ${flower(100, 560, 11, PALETTE.pink, PALETTE.yellow)}
  ${flower(280, 575, 9, PALETTE.coral, PALETTE.brightYellow)}
  ${flower(450, 555, 12, PALETTE.hotPink, PALETTE.cream)}
  ${flower(620, 580, 10, PALETTE.orange, PALETTE.yellow)}
  ${flower(800, 560, 11, PALETTE.softPurple, PALETTE.brightYellow)}
  ${flower(970, 575, 10, PALETTE.pink, PALETTE.yellow)}
  ${flower(1130, 555, 9, PALETTE.coral, PALETTE.cream)}

  <!-- Left side: Paperclip brand -->
  ${paperclipShape(250, 260, 2.0, PALETTE.yellow, -10)}

  <!-- VS badge -->
  <g transform="translate(600, 270)">
    <circle cx="0" cy="0" r="35" fill="${PALETTE.white}" opacity="0.95"/>
    <text x="0" y="8" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="bold"
          fill="${PALETTE.deepBlue}" text-anchor="middle">vs</text>
  </g>

  <!-- Right side: Competitor icon -->
  ${iconFn(950, 260)}

  <!-- Birds -->
  ${bird(400, 100, 1.0, PALETTE.pink)}
  ${bird(450, 80, 0.8, PALETTE.hotPink)}
  ${bird(700, 60, 0.9, PALETTE.coral)}

  <!-- Small decorative paperclips -->
  ${paperclipShape(50, 400, 0.4, PALETTE.brightYellow, 30)}
  ${paperclipShape(1150, 130, 0.4, PALETTE.yellow, -25)}
</svg>`;
}

// Competitor icon generators
function multicaIcon(x, y) {
  // Multi-layered circle (representing multi-agent)
  return `
    <g transform="translate(${x}, ${y})">
      <circle cx="0" cy="0" r="55" fill="${PALETTE.white}" opacity="0.3"/>
      <circle cx="-15" cy="-10" r="30" fill="${PALETTE.coral}" opacity="0.7"/>
      <circle cx="15" cy="-10" r="30" fill="${PALETTE.hotPink}" opacity="0.7"/>
      <circle cx="0" cy="15" r="30" fill="${PALETTE.orange}" opacity="0.7"/>
    </g>`;
}

function cabinetIcon(x, y) {
  // File cabinet illustration
  return `
    <g transform="translate(${x}, ${y})">
      <rect x="-40" y="-60" width="80" height="120" rx="6" fill="${PALETTE.white}" opacity="0.9"/>
      <rect x="-32" y="-50" width="64" height="25" rx="3" fill="${PALETTE.lightBlue}"/>
      <rect x="-32" y="-18" width="64" height="25" rx="3" fill="${PALETTE.waterBlue}"/>
      <rect x="-32" y="14" width="64" height="25" rx="3" fill="${PALETTE.skyBlue}"/>
      <circle cx="0" cy="-37" r="4" fill="${PALETTE.deepBlue}"/>
      <circle cx="0" cy="-5" r="4" fill="${PALETTE.deepBlue}"/>
      <circle cx="0" cy="27" r="4" fill="${PALETTE.deepBlue}"/>
    </g>`;
}

function notionIcon(x, y) {
  // Page/document with sparkle (representing Notion)
  return `
    <g transform="translate(${x}, ${y})">
      <rect x="-35" y="-50" width="70" height="90" rx="5" fill="${PALETTE.white}" opacity="0.9"/>
      <rect x="-22" y="-35" width="44" height="5" rx="2" fill="${PALETTE.lightBlue}"/>
      <rect x="-22" y="-24" width="35" height="5" rx="2" fill="${PALETTE.lightBlue}"/>
      <rect x="-22" y="-13" width="40" height="5" rx="2" fill="${PALETTE.lightBlue}"/>
      <rect x="-22" y="-2" width="30" height="5" rx="2" fill="${PALETTE.lightBlue}"/>
      <rect x="-22" y="9" width="38" height="5" rx="2" fill="${PALETTE.lightBlue}"/>
      <!-- Sparkle -->
      <g transform="translate(30, -40)">
        <line x1="0" y1="-10" x2="0" y2="10" stroke="${PALETTE.brightYellow}" stroke-width="2"/>
        <line x1="-10" y1="0" x2="10" y2="0" stroke="${PALETTE.brightYellow}" stroke-width="2"/>
        <line x1="-7" y1="-7" x2="7" y2="7" stroke="${PALETTE.brightYellow}" stroke-width="1.5"/>
        <line x1="7" y1="-7" x2="-7" y2="7" stroke="${PALETTE.brightYellow}" stroke-width="1.5"/>
      </g>
    </g>`;
}

function linearIcon(x, y) {
  // Workflow/arrow diagram (representing Linear's project tracking)
  return `
    <g transform="translate(${x}, ${y})">
      <circle cx="0" cy="0" r="50" fill="${PALETTE.white}" opacity="0.3"/>
      <!-- Circular progress indicator like Linear's logo -->
      <circle cx="0" cy="0" r="38" fill="none" stroke="${PALETTE.white}" stroke-width="6" opacity="0.5"/>
      <path d="M0,-38 A38,38 0 1,1 -33,19" fill="none" stroke="${PALETTE.softPurple}" stroke-width="6" stroke-linecap="round"/>
      <!-- Arrow -->
      <polygon points="10,-5 22,0 10,5" fill="${PALETTE.white}" transform="translate(5, -20) rotate(30)"/>
    </g>`;
}

// ─── Generate all images ────────────────────────────────────────
const images = [
  { name: 'vs-hero', svg: generateHero() },
  { name: 'cover-multica', svg: generateCover('Multica', '#E8F5E9', PALETTE.coral, multicaIcon) },
  { name: 'cover-cabinet', svg: generateCover('Cabinet', '#E3F2FD', PALETTE.skyBlue, cabinetIcon) },
  { name: 'cover-notion-agents', svg: generateCover('Notion Agents', '#FFF3E0', PALETTE.orange, notionIcon) },
  { name: 'cover-linear-agents', svg: generateCover('Linear Agents', '#F3E5F5', PALETTE.softPurple, linearIcon) },
];

for (const img of images) {
  const svgPath = path.join(OUT_DIR, `${img.name}.svg`);
  const webpPath = path.join(FINAL_DIR, `${img.name}.webp`);
  const jpgPath = path.join(FINAL_DIR, `${img.name}.jpg`);

  // Write SVG
  fs.writeFileSync(svgPath, img.svg);
  console.log(`Written SVG: ${svgPath}`);

  // Convert to JPG (high quality)
  execSync(`magick -background none "${svgPath}" -resize ${WIDTH}x${HEIGHT}! -quality 85 "${jpgPath}"`);
  console.log(`Written JPG: ${jpgPath} (${(fs.statSync(jpgPath).size / 1024).toFixed(1)}KB)`);

  // Convert to WebP (optimized)
  execSync(`magick -background none "${svgPath}" -resize ${WIDTH}x${HEIGHT}! -quality 80 "${webpPath}"`);
  console.log(`Written WebP: ${webpPath} (${(fs.statSync(webpPath).size / 1024).toFixed(1)}KB)`);
}

console.log('\nAll images generated successfully!');
