import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'vs');

mkdirSync(join(OUT, 'screenshots'), { recursive: true });

// Brand palette
const DARK_BG = '#1a1a1a';
const DARK_MID = '#2d2a26';
const DARK_WARM = '#3d3830';
const BRAND_PINK = '#e87da0';
const BRAND_BLUE = '#4a90d9';
const BRAND_GREEN = '#6bb86b';
const BRAND_YELLOW = '#d4c057';
const BRAND_CREAM = '#f5f3f0';
const BRAND_SURFACE = '#f0ece7';

// Paperclip icon path (from favicon, scaled)
const paperclipPath = (x, y, scale = 1) => {
  const s = scale;
  return `<path d="M${x + 13*s} ${y + 5*s}a${6*s} ${6*s} 0 0 1 ${6*s} ${6*s}v${14*s}a${4*s} ${4*s} 0 0 1-${8*s} 0V${y + 11*s}a${2*s} ${2*s} 0 0 1 ${4*s} 0v${12*s}" stroke="currentColor" stroke-width="${2.5*s}" stroke-linecap="round" fill="none"/>`;
};

// Subtle noise texture overlay
const noiseFilter = `
  <filter id="noise">
    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
    <feBlend in="SourceGraphic" mode="overlay" result="blend"/>
    <feComponentTransfer>
      <feFuncA type="linear" slope="0.08"/>
    </feComponentTransfer>
    <feComposite in2="SourceGraphic" operator="in"/>
    <feBlend in2="SourceGraphic" mode="overlay"/>
  </filter>
`;

// Decorative dots pattern
const dotsPattern = (color, opacity = 0.15) => {
  let dots = '';
  for (let i = 0; i < 40; i++) {
    const cx = Math.floor(Math.random() * 100);
    const cy = Math.floor(Math.random() * 100);
    const r = 0.5 + Math.random() * 1.5;
    dots += `<circle cx="${cx}%" cy="${cy}%" r="${r}" fill="${color}" opacity="${opacity}"/>`;
  }
  return dots;
};

// Seed random for reproducibility
let seed = 42;
function seededRandom() {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}

function seededDots(color, opacity, count, width, height) {
  let dots = '';
  for (let i = 0; i < count; i++) {
    const cx = Math.floor(seededRandom() * width);
    const cy = Math.floor(seededRandom() * height);
    const r = 0.5 + seededRandom() * 2;
    dots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${opacity}"/>`;
  }
  return dots;
}

function seededLines(color, opacity, count, width, height) {
  let lines = '';
  for (let i = 0; i < count; i++) {
    const x1 = Math.floor(seededRandom() * width);
    const y1 = Math.floor(seededRandom() * height);
    const x2 = x1 + (seededRandom() - 0.5) * 80;
    const y2 = y1 + (seededRandom() - 0.5) * 80;
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="0.5" opacity="${opacity}"/>`;
  }
  return lines;
}

// ── Hero Image (1920x800) ──
async function generateHero() {
  seed = 42;
  const w = 1920, h = 800;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="heroBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${DARK_BG}"/>
      <stop offset="35%" stop-color="${DARK_MID}"/>
      <stop offset="65%" stop-color="${DARK_WARM}"/>
      <stop offset="100%" stop-color="${DARK_BG}"/>
    </linearGradient>
    <linearGradient id="glowPink" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${BRAND_PINK}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${BRAND_PINK}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="glowBlue" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${BRAND_BLUE}" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="${BRAND_BLUE}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="spotlight" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="${BRAND_CREAM}" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="${DARK_BG}" stop-opacity="0"/>
    </radialGradient>
    ${noiseFilter}
  </defs>

  <!-- Background -->
  <rect width="${w}" height="${h}" fill="url(#heroBg)"/>
  <rect width="${w}" height="${h}" fill="url(#spotlight)"/>

  <!-- Decorative grid lines -->
  <g opacity="0.06" stroke="${BRAND_CREAM}" stroke-width="0.5">
    ${Array.from({length: 8}, (_, i) => `<line x1="${240 * (i+1)}" y1="0" x2="${240 * (i+1)}" y2="${h}"/>`).join('')}
    ${Array.from({length: 4}, (_, i) => `<line x1="0" y1="${200 * (i+1)}" x2="${w}" y2="${200 * (i+1)}"/>`).join('')}
  </g>

  <!-- Floating dots texture -->
  <g>
    ${seededDots(BRAND_PINK, 0.12, 30, w, h)}
    ${seededDots(BRAND_BLUE, 0.08, 20, w, h)}
    ${seededDots(BRAND_YELLOW, 0.06, 15, w, h)}
  </g>

  <!-- Large paperclip motifs -->
  <g color="${BRAND_CREAM}" opacity="0.06" transform="translate(150, 100) scale(8)">
    ${paperclipPath(0, 0)}
  </g>
  <g color="${BRAND_PINK}" opacity="0.04" transform="translate(1500, 200) scale(6)">
    ${paperclipPath(0, 0)}
  </g>
  <g color="${BRAND_YELLOW}" opacity="0.05" transform="translate(900, 350) scale(5)">
    ${paperclipPath(0, 0)}
  </g>

  <!-- Abstract connection lines (representing agent coordination) -->
  <g stroke="${BRAND_CREAM}" stroke-width="1" opacity="0.08">
    <line x1="400" y1="200" x2="700" y2="350"/>
    <line x1="700" y1="350" x2="1100" y2="280"/>
    <line x1="1100" y1="280" x2="1400" y2="450"/>
    <line x1="700" y1="350" x2="900" y2="550"/>
    <line x1="1100" y1="280" x2="1300" y2="150"/>
    <circle cx="400" cy="200" r="4" fill="${BRAND_PINK}" opacity="0.3"/>
    <circle cx="700" cy="350" r="5" fill="${BRAND_BLUE}" opacity="0.3"/>
    <circle cx="1100" cy="280" r="4" fill="${BRAND_GREEN}" opacity="0.3"/>
    <circle cx="1400" cy="450" r="4" fill="${BRAND_YELLOW}" opacity="0.3"/>
    <circle cx="900" cy="550" r="3" fill="${BRAND_PINK}" opacity="0.2"/>
    <circle cx="1300" cy="150" r="3" fill="${BRAND_BLUE}" opacity="0.2"/>
  </g>

  <!-- Subtle bottom fade -->
  <rect y="${h - 200}" width="${w}" height="200" fill="url(#glowPink)"/>

  <!-- Noise overlay -->
  <rect width="${w}" height="${h}" filter="url(#noise)" opacity="0.5"/>
</svg>`;

  const buf = Buffer.from(svg);
  await sharp(buf).webp({ quality: 85 }).toFile(join(OUT, 'vs-hero.webp'));
  await sharp(buf).jpeg({ quality: 85 }).toFile(join(OUT, 'vs-hero.jpg'));
  console.log('✓ vs-hero.webp + .jpg');
}

// ── Competitor Cover Image (1200x630) ──
async function generateCover(slug, competitorName, accentColor, secondaryColor) {
  seed = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const w = 1200, h = 630;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="coverBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${DARK_BG}"/>
      <stop offset="40%" stop-color="${DARK_MID}"/>
      <stop offset="70%" stop-color="${DARK_WARM}"/>
      <stop offset="100%" stop-color="${DARK_BG}"/>
    </linearGradient>
    <linearGradient id="divider" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.4"/>
      <stop offset="50%" stop-color="${BRAND_CREAM}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="${secondaryColor}" stop-opacity="0.4"/>
    </linearGradient>
    <radialGradient id="glowL" cx="25%" cy="50%" r="35%">
      <stop offset="0%" stop-color="${BRAND_YELLOW}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="transparent" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowR" cx="75%" cy="50%" r="35%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="transparent" stop-opacity="0"/>
    </radialGradient>
    ${noiseFilter}
  </defs>

  <!-- Background -->
  <rect width="${w}" height="${h}" fill="url(#coverBg)"/>
  <rect width="${w}" height="${h}" fill="url(#glowL)"/>
  <rect width="${w}" height="${h}" fill="url(#glowR)"/>

  <!-- Grid texture -->
  <g opacity="0.04" stroke="${BRAND_CREAM}" stroke-width="0.5">
    ${Array.from({length: 5}, (_, i) => `<line x1="${240 * (i+1)}" y1="0" x2="${240 * (i+1)}" y2="${h}"/>`).join('')}
    ${Array.from({length: 3}, (_, i) => `<line x1="0" y1="${h/4 * (i+1)}" x2="${w}" y2="${h/4 * (i+1)}"/>`).join('')}
  </g>

  <!-- Scattered dots -->
  <g>
    ${seededDots(accentColor, 0.1, 25, w, h)}
    ${seededDots(BRAND_CREAM, 0.05, 15, w, h)}
  </g>

  <!-- Center divider -->
  <rect x="${w/2 - 1}" y="60" width="2" height="${h - 120}" fill="url(#divider)" rx="1"/>

  <!-- Left side: Paperclip -->
  <g color="${BRAND_CREAM}" opacity="0.08" transform="translate(120, 150) scale(4)">
    ${paperclipPath(0, 0)}
  </g>
  <g color="${BRAND_YELLOW}" opacity="0.15" transform="translate(200, 240) scale(6)">
    ${paperclipPath(0, 0)}
  </g>

  <!-- "vs" badge -->
  <rect x="${w/2 - 28}" y="${h/2 - 20}" width="56" height="40" rx="20" fill="${DARK_BG}" stroke="${BRAND_CREAM}" stroke-width="1" stroke-opacity="0.3"/>
  <text x="${w/2}" y="${h/2 + 7}" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="700" fill="${BRAND_CREAM}" text-anchor="middle" letter-spacing="0.08em" opacity="0.7">VS</text>

  <!-- Right side: competitor abstract shape -->
  <circle cx="${w * 0.75}" cy="${h * 0.45}" r="60" fill="none" stroke="${accentColor}" stroke-width="1.5" opacity="0.15"/>
  <circle cx="${w * 0.75}" cy="${h * 0.45}" r="40" fill="none" stroke="${secondaryColor}" stroke-width="1" opacity="0.1"/>
  <circle cx="${w * 0.75}" cy="${h * 0.45}" r="80" fill="none" stroke="${accentColor}" stroke-width="0.5" opacity="0.08" stroke-dasharray="4 6"/>

  <!-- Paperclip label -->
  <text x="${w * 0.25}" y="${h - 100}" font-family="'Instrument Serif', Georgia, serif" font-size="42" fill="${BRAND_CREAM}" text-anchor="middle" opacity="0.9">Paperclip</text>
  <text x="${w * 0.25}" y="${h - 68}" font-family="Inter, system-ui, sans-serif" font-size="14" fill="${BRAND_CREAM}" text-anchor="middle" opacity="0.4" letter-spacing="0.05em">AI Agent Orchestration</text>

  <!-- Competitor label -->
  <text x="${w * 0.75}" y="${h - 100}" font-family="'Instrument Serif', Georgia, serif" font-size="42" fill="${BRAND_CREAM}" text-anchor="middle" opacity="0.9">${competitorName}</text>

  <!-- Top badge -->
  <rect x="${w/2 - 100}" y="30" width="200" height="28" rx="14" fill="${BRAND_CREAM}" fill-opacity="0.06" stroke="${BRAND_CREAM}" stroke-width="0.5" stroke-opacity="0.1"/>
  <text x="${w/2}" y="49" font-family="Inter, system-ui, sans-serif" font-size="11" fill="${BRAND_CREAM}" text-anchor="middle" opacity="0.5" letter-spacing="0.08em" text-transform="uppercase">COMPARISON</text>

  <!-- Noise overlay -->
  <rect width="${w}" height="${h}" filter="url(#noise)" opacity="0.4"/>
</svg>`;

  const buf = Buffer.from(svg);
  await sharp(buf).webp({ quality: 85 }).toFile(join(OUT, `cover-${slug}.webp`));
  await sharp(buf).jpeg({ quality: 85 }).toFile(join(OUT, `cover-${slug}.jpg`));
  console.log(`✓ cover-${slug}.webp + .jpg`);
}

// ── Product Screenshots (1200x750) ──
async function generateScreenshot(name, title, subtitle) {
  seed = 123;
  const w = 1200, h = 750;

  // Simulate a dashboard UI
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="ssBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#faf9f7"/>
      <stop offset="100%" stop-color="${BRAND_SURFACE}"/>
    </linearGradient>
    <filter id="cardShadow" x="-4%" y="-4%" width="108%" height="112%">
      <feDropShadow dx="0" dy="2" stdDeviation="8" flood-color="#000" flood-opacity="0.06"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${w}" height="${h}" rx="12" fill="url(#ssBg)"/>

  <!-- Top bar -->
  <rect width="${w}" height="52" rx="12" fill="${DARK_BG}"/>
  <rect y="12" width="${w}" height="40" fill="${DARK_BG}"/>
  <circle cx="24" cy="26" r="6" fill="#ff5f57"/>
  <circle cx="44" cy="26" r="6" fill="#ffbd2e"/>
  <circle cx="64" cy="26" r="6" fill="#28c840"/>
  <text x="${w/2}" y="31" font-family="Inter, system-ui, sans-serif" font-size="13" fill="${BRAND_CREAM}" text-anchor="middle" opacity="0.7">paperclip.ing — ${title}</text>

  <!-- Sidebar -->
  <rect x="0" y="52" width="220" height="${h - 52}" fill="${DARK_BG}" fill-opacity="0.97"/>
  <g font-family="Inter, system-ui, sans-serif" font-size="13" fill="${BRAND_CREAM}">
    <text x="20" y="90" opacity="0.4" font-size="10" letter-spacing="0.08em">WORKSPACE</text>
    <rect x="12" y="102" width="196" height="32" rx="6" fill="${BRAND_CREAM}" fill-opacity="0.08"/>
    <text x="20" y="123" opacity="0.9">Dashboard</text>
    <text x="20" y="158" opacity="0.5">Agents</text>
    <text x="20" y="188" opacity="0.5">Issues</text>
    <text x="20" y="218" opacity="0.5">Projects</text>
    <text x="20" y="248" opacity="0.5">Goals</text>
    <text x="20" y="290" opacity="0.4" font-size="10" letter-spacing="0.08em">AGENTS</text>
    <circle cx="28" cy="312" r="8" fill="${BRAND_PINK}" opacity="0.6"/>
    <text x="44" y="317" opacity="0.7">CEO Agent</text>
    <circle cx="28" cy="342" r="8" fill="${BRAND_BLUE}" opacity="0.6"/>
    <text x="44" y="347" opacity="0.7">CTO Agent</text>
    <circle cx="28" cy="372" r="8" fill="${BRAND_GREEN}" opacity="0.6"/>
    <text x="44" y="377" opacity="0.7">Engineer Agent</text>
    <circle cx="28" cy="402" r="8" fill="${BRAND_YELLOW}" opacity="0.6"/>
    <text x="44" y="407" opacity="0.7">Designer Agent</text>
    <circle cx="28" cy="432" r="8" fill="#b07dd9" opacity="0.6"/>
    <text x="44" y="437" opacity="0.7">QA Agent</text>
  </g>

  <!-- Main content area -->
  <g transform="translate(244, 72)">
    <!-- Title bar -->
    <text font-family="'Instrument Serif', Georgia, serif" font-size="26" fill="${DARK_BG}" y="30">${subtitle}</text>
    <text font-family="Inter, system-ui, sans-serif" font-size="12" fill="#666" y="50">5 agents active · 12 tasks in progress · Last heartbeat 2m ago</text>

    <!-- Org chart cards -->
    <g transform="translate(0, 80)" filter="url(#cardShadow)">
      <!-- CEO card -->
      <rect x="310" y="0" width="180" height="70" rx="8" fill="white" stroke="${BRAND_PINK}" stroke-width="2"/>
      <circle cx="340" cy="35" r="14" fill="${BRAND_PINK}" opacity="0.2"/>
      <text x="340" y="39" font-family="Inter, system-ui, sans-serif" font-size="12" fill="${BRAND_PINK}" text-anchor="middle" font-weight="600">C</text>
      <text x="362" y="30" font-family="Inter, system-ui, sans-serif" font-size="13" fill="${DARK_BG}" font-weight="600">CEO Agent</text>
      <text x="362" y="47" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#888">Strategic planning</text>

      <!-- Connection lines -->
      <line x1="400" y1="70" x2="400" y2="100" stroke="#ddd" stroke-width="1.5"/>
      <line x1="200" y1="100" x2="600" y2="100" stroke="#ddd" stroke-width="1.5"/>
      <line x1="200" y1="100" x2="200" y2="120" stroke="#ddd" stroke-width="1.5"/>
      <line x1="400" y1="100" x2="400" y2="120" stroke="#ddd" stroke-width="1.5"/>
      <line x1="600" y1="100" x2="600" y2="120" stroke="#ddd" stroke-width="1.5"/>

      <!-- CTO card -->
      <rect x="110" y="120" width="180" height="70" rx="8" fill="white" stroke="${BRAND_BLUE}" stroke-width="2"/>
      <circle cx="140" cy="155" r="14" fill="${BRAND_BLUE}" opacity="0.2"/>
      <text x="140" y="159" font-family="Inter, system-ui, sans-serif" font-size="12" fill="${BRAND_BLUE}" text-anchor="middle" font-weight="600">T</text>
      <text x="162" y="150" font-family="Inter, system-ui, sans-serif" font-size="13" fill="${DARK_BG}" font-weight="600">CTO Agent</text>
      <text x="162" y="167" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#888">Architecture</text>

      <!-- Engineer card -->
      <rect x="310" y="120" width="180" height="70" rx="8" fill="white" stroke="${BRAND_GREEN}" stroke-width="2"/>
      <circle cx="340" cy="155" r="14" fill="${BRAND_GREEN}" opacity="0.2"/>
      <text x="340" y="159" font-family="Inter, system-ui, sans-serif" font-size="12" fill="${BRAND_GREEN}" text-anchor="middle" font-weight="600">E</text>
      <text x="362" y="150" font-family="Inter, system-ui, sans-serif" font-size="13" fill="${DARK_BG}" font-weight="600">Engineer Agent</text>
      <text x="362" y="167" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#888">Implementation</text>

      <!-- Designer card -->
      <rect x="510" y="120" width="180" height="70" rx="8" fill="white" stroke="${BRAND_YELLOW}" stroke-width="2"/>
      <circle cx="540" cy="155" r="14" fill="${BRAND_YELLOW}" opacity="0.2"/>
      <text x="540" y="159" font-family="Inter, system-ui, sans-serif" font-size="12" fill="${BRAND_YELLOW}" text-anchor="middle" font-weight="600">D</text>
      <text x="562" y="150" font-family="Inter, system-ui, sans-serif" font-size="13" fill="${DARK_BG}" font-weight="600">Designer Agent</text>
      <text x="562" y="167" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#888">UX &amp; Visual</text>

      <!-- Sub-connections from CTO -->
      <line x1="200" y1="190" x2="200" y2="220" stroke="#ddd" stroke-width="1"/>
      <rect x="110" y="220" width="180" height="56" rx="8" fill="white" stroke="#b07dd9" stroke-width="1.5"/>
      <circle cx="140" cy="248" r="12" fill="#b07dd9" opacity="0.2"/>
      <text x="140" y="252" font-family="Inter, system-ui, sans-serif" font-size="11" fill="#b07dd9" text-anchor="middle" font-weight="600">Q</text>
      <text x="160" y="244" font-family="Inter, system-ui, sans-serif" font-size="12" fill="${DARK_BG}" font-weight="600">QA Agent</text>
      <text x="160" y="259" font-family="Inter, system-ui, sans-serif" font-size="10" fill="#888">Testing &amp; Review</text>
    </g>

    <!-- Status panel -->
    <g transform="translate(0, 420)">
      <rect width="710" height="220" rx="8" fill="white" filter="url(#cardShadow)"/>
      <text x="20" y="30" font-family="Inter, system-ui, sans-serif" font-size="14" fill="${DARK_BG}" font-weight="600">Recent Heartbeats</text>
      <g font-family="'JetBrains Mono', monospace" font-size="11" fill="#555">
        <circle cx="20" cy="60" r="4" fill="${BRAND_GREEN}"/>
        <text x="34" y="64">CEO Agent completed PAP-142 "Strategic roadmap Q2"</text>
        <text x="620" y="64" fill="#aaa" font-size="10">2m ago</text>

        <circle cx="20" cy="88" r="4" fill="${BRAND_BLUE}"/>
        <text x="34" y="92">CTO Agent checked out PAP-198 "API rate limiting"</text>
        <text x="620" y="92" fill="#aaa" font-size="10">5m ago</text>

        <circle cx="20" cy="116" r="4" fill="${BRAND_GREEN}"/>
        <text x="34" y="120">Engineer Agent pushed 3 commits to feature/auth</text>
        <text x="620" y="120" fill="#aaa" font-size="10">8m ago</text>

        <circle cx="20" cy="144" r="4" fill="${BRAND_YELLOW}"/>
        <text x="34" y="148">Designer Agent updated UX spec for onboarding</text>
        <text x="620" y="148" fill="#aaa" font-size="10">12m ago</text>

        <circle cx="20" cy="172" r="4" fill="#b07dd9"/>
        <text x="34" y="176">QA Agent verified canary deploy for PAP-185</text>
        <text x="620" y="176" fill="#aaa" font-size="10">15m ago</text>
      </g>
    </g>
  </g>

  <!-- Border -->
  <rect width="${w}" height="${h}" rx="12" fill="none" stroke="#e0dcd6" stroke-width="1"/>
</svg>`;

  const buf = Buffer.from(svg);
  await sharp(buf).webp({ quality: 90 }).toFile(join(OUT, 'screenshots', `${name}.webp`));
  await sharp(buf).jpeg({ quality: 90 }).toFile(join(OUT, 'screenshots', `${name}.jpg`));
  console.log(`✓ screenshots/${name}.webp + .jpg`);
}

// Task coordination screenshot
async function generateTaskScreenshot() {
  seed = 456;
  const w = 1200, h = 750;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="ssBg2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#faf9f7"/>
      <stop offset="100%" stop-color="${BRAND_SURFACE}"/>
    </linearGradient>
    <filter id="cardShadow2" x="-4%" y="-4%" width="108%" height="112%">
      <feDropShadow dx="0" dy="2" stdDeviation="8" flood-color="#000" flood-opacity="0.06"/>
    </filter>
  </defs>

  <rect width="${w}" height="${h}" rx="12" fill="url(#ssBg2)"/>

  <!-- Top bar -->
  <rect width="${w}" height="52" rx="12" fill="${DARK_BG}"/>
  <rect y="12" width="${w}" height="40" fill="${DARK_BG}"/>
  <circle cx="24" cy="26" r="6" fill="#ff5f57"/>
  <circle cx="44" cy="26" r="6" fill="#ffbd2e"/>
  <circle cx="64" cy="26" r="6" fill="#28c840"/>
  <text x="${w/2}" y="31" font-family="Inter, system-ui, sans-serif" font-size="13" fill="${BRAND_CREAM}" text-anchor="middle" opacity="0.7">paperclip.ing — Task Board</text>

  <!-- Sidebar -->
  <rect x="0" y="52" width="220" height="${h - 52}" fill="${DARK_BG}" fill-opacity="0.97"/>
  <g font-family="Inter, system-ui, sans-serif" font-size="13" fill="${BRAND_CREAM}">
    <text x="20" y="90" opacity="0.4" font-size="10" letter-spacing="0.08em">WORKSPACE</text>
    <text x="20" y="115" opacity="0.5">Dashboard</text>
    <text x="20" y="145" opacity="0.5">Agents</text>
    <rect x="12" y="155" width="196" height="32" rx="6" fill="${BRAND_CREAM}" fill-opacity="0.08"/>
    <text x="20" y="176" opacity="0.9">Issues</text>
    <text x="20" y="211" opacity="0.5">Projects</text>
    <text x="20" y="241" opacity="0.5">Goals</text>
  </g>

  <!-- Main content: Kanban columns -->
  <g transform="translate(240, 70)">
    <text font-family="'Instrument Serif', Georgia, serif" font-size="24" fill="${DARK_BG}" y="24">Task Coordination</text>
    <text font-family="Inter, system-ui, sans-serif" font-size="12" fill="#666" y="44">Active sprint · 4 agents coordinating across 12 issues</text>

    <!-- Column headers -->
    <g transform="translate(0, 70)" font-family="Inter, system-ui, sans-serif">
      <!-- Todo column -->
      <g>
        <rect width="220" height="30" rx="6" fill="#f5f3f0"/>
        <text x="12" y="20" font-size="12" fill="#666" font-weight="600">TODO</text>
        <text x="190" y="20" font-size="11" fill="#aaa">3</text>

        <rect y="40" width="220" height="72" rx="8" fill="white" filter="url(#cardShadow2)"/>
        <text x="12" y="62" font-size="12" fill="${DARK_BG}" font-weight="500">Set up monitoring alerts</text>
        <circle cx="12" cy="78" r="5" fill="${BRAND_BLUE}" opacity="0.6"/>
        <text x="22" y="82" font-size="10" fill="#888">CTO · PAP-201</text>
        <rect x="150" y="72" width="56" height="18" rx="9" fill="#fef3cd" stroke="#f9c642" stroke-width="0.5"/>
        <text x="178" y="84" font-size="9" fill="#856404" text-anchor="middle">medium</text>

        <rect y="122" width="220" height="72" rx="8" fill="white" filter="url(#cardShadow2)"/>
        <text x="12" y="144" font-size="12" fill="${DARK_BG}" font-weight="500">Update API documentation</text>
        <circle cx="12" cy="160" r="5" fill="${BRAND_GREEN}" opacity="0.6"/>
        <text x="22" y="164" font-size="10" fill="#888">Engineer · PAP-205</text>
        <rect x="170" y="154" width="38" height="18" rx="9" fill="#e8f5e9" stroke="#66bb6a" stroke-width="0.5"/>
        <text x="189" y="166" font-size="9" fill="#2e7d32" text-anchor="middle">low</text>

        <rect y="204" width="220" height="72" rx="8" fill="white" filter="url(#cardShadow2)"/>
        <text x="12" y="226" font-size="12" fill="${DARK_BG}" font-weight="500">Design settings page</text>
        <circle cx="12" cy="242" r="5" fill="${BRAND_YELLOW}" opacity="0.6"/>
        <text x="22" y="246" font-size="10" fill="#888">Designer · PAP-210</text>
      </g>

      <!-- In Progress column -->
      <g transform="translate(240, 0)">
        <rect width="220" height="30" rx="6" fill="#e8f0fe"/>
        <text x="12" y="20" font-size="12" fill="${BRAND_BLUE}" font-weight="600">IN PROGRESS</text>
        <text x="190" y="20" font-size="11" fill="#aaa">4</text>

        <rect y="40" width="220" height="72" rx="8" fill="white" stroke="${BRAND_BLUE}" stroke-width="1.5" filter="url(#cardShadow2)"/>
        <text x="12" y="62" font-size="12" fill="${DARK_BG}" font-weight="500">API rate limiting impl</text>
        <circle cx="12" cy="78" r="5" fill="${BRAND_BLUE}" opacity="0.6"/>
        <text x="22" y="82" font-size="10" fill="#888">CTO · PAP-198</text>
        <rect x="150" y="72" width="56" height="18" rx="9" fill="#fde2e2" stroke="#e57373" stroke-width="0.5"/>
        <text x="178" y="84" font-size="9" fill="#c62828" text-anchor="middle">high</text>
        <circle cx="200" cy="52" r="4" fill="${BRAND_GREEN}"/>

        <rect y="122" width="220" height="72" rx="8" fill="white" stroke="${BRAND_GREEN}" stroke-width="1.5" filter="url(#cardShadow2)"/>
        <text x="12" y="144" font-size="12" fill="${DARK_BG}" font-weight="500">Auth middleware rewrite</text>
        <circle cx="12" cy="160" r="5" fill="${BRAND_GREEN}" opacity="0.6"/>
        <text x="22" y="164" font-size="10" fill="#888">Engineer · PAP-185</text>
        <rect x="150" y="154" width="56" height="18" rx="9" fill="#fde2e2" stroke="#e57373" stroke-width="0.5"/>
        <text x="178" y="166" font-size="9" fill="#c62828" text-anchor="middle">high</text>
        <circle cx="200" cy="134" r="4" fill="${BRAND_GREEN}"/>

        <rect y="204" width="220" height="72" rx="8" fill="white" stroke="${BRAND_PINK}" stroke-width="1.5" filter="url(#cardShadow2)"/>
        <text x="12" y="226" font-size="12" fill="${DARK_BG}" font-weight="500">Competitive /vs pages</text>
        <circle cx="12" cy="242" r="5" fill="${BRAND_PINK}" opacity="0.6"/>
        <text x="22" y="246" font-size="10" fill="#888">CEO · PAP-1238</text>

        <rect y="286" width="220" height="72" rx="8" fill="white" stroke="${BRAND_YELLOW}" stroke-width="1.5" filter="url(#cardShadow2)"/>
        <text x="12" y="308" font-size="12" fill="${DARK_BG}" font-weight="500">Onboarding flow redesign</text>
        <circle cx="12" cy="324" r="5" fill="${BRAND_YELLOW}" opacity="0.6"/>
        <text x="22" y="328" font-size="10" fill="#888">Designer · PAP-190</text>
      </g>

      <!-- In Review column -->
      <g transform="translate(480, 0)">
        <rect width="220" height="30" rx="6" fill="#fef3cd"/>
        <text x="12" y="20" font-size="12" fill="#856404" font-weight="600">IN REVIEW</text>
        <text x="190" y="20" font-size="11" fill="#aaa">2</text>

        <rect y="40" width="220" height="72" rx="8" fill="white" filter="url(#cardShadow2)"/>
        <text x="12" y="62" font-size="12" fill="${DARK_BG}" font-weight="500">Database migration v2</text>
        <circle cx="12" cy="78" r="5" fill="${BRAND_GREEN}" opacity="0.6"/>
        <text x="22" y="82" font-size="10" fill="#888">Engineer · PAP-176</text>
        <rect x="120" y="50" width="88" height="18" rx="9" fill="#e8f0fe" stroke="${BRAND_BLUE}" stroke-width="0.5"/>
        <text x="164" y="62" font-size="9" fill="${BRAND_BLUE}" text-anchor="middle">awaiting CTO</text>

        <rect y="122" width="220" height="72" rx="8" fill="white" filter="url(#cardShadow2)"/>
        <text x="12" y="144" font-size="12" fill="${DARK_BG}" font-weight="500">Canary deploy checks</text>
        <circle cx="12" cy="160" r="5" fill="#b07dd9" opacity="0.6"/>
        <text x="22" y="164" font-size="10" fill="#888">QA · PAP-182</text>
      </g>

      <!-- Done column -->
      <g transform="translate(720, 0)">
        <rect width="200" height="30" rx="6" fill="#e8f5e9"/>
        <text x="12" y="20" font-size="12" fill="#2e7d32" font-weight="600">DONE</text>
        <text x="170" y="20" font-size="11" fill="#aaa">3</text>

        <rect y="40" width="200" height="60" rx="8" fill="white" opacity="0.7"/>
        <text x="12" y="62" font-size="12" fill="#aaa" font-weight="500">Strategic roadmap Q2</text>
        <text x="12" y="78" font-size="10" fill="#ccc">CEO · PAP-142</text>

        <rect y="110" width="200" height="60" rx="8" fill="white" opacity="0.7"/>
        <text x="12" y="132" font-size="12" fill="#aaa" font-weight="500">CI pipeline setup</text>
        <text x="12" y="148" font-size="10" fill="#ccc">CTO · PAP-155</text>

        <rect y="180" width="200" height="60" rx="8" fill="white" opacity="0.7"/>
        <text x="12" y="202" font-size="12" fill="#aaa" font-weight="500">Landing page redesign</text>
        <text x="12" y="218" font-size="10" fill="#ccc">Designer · PAP-160</text>
      </g>
    </g>
  </g>

  <rect width="${w}" height="${h}" rx="12" fill="none" stroke="#e0dcd6" stroke-width="1"/>
</svg>`;

  const buf = Buffer.from(svg);
  await sharp(buf).webp({ quality: 90 }).toFile(join(OUT, 'screenshots', 'task-coordination.webp'));
  await sharp(buf).jpeg({ quality: 90 }).toFile(join(OUT, 'screenshots', 'task-coordination.jpg'));
  console.log('✓ screenshots/task-coordination.webp + .jpg');
}

// ── Run all ──
async function main() {
  console.log('Generating /vs visual assets...\n');

  await generateHero();

  await generateCover('multica', 'Multica', '#6b8cce', '#8b6bce');
  await generateCover('cabinet', 'Cabinet', '#ce8b6b', '#ce6b8c');
  await generateCover('notion-agents', 'Notion Agents', '#4a4a4a', '#888888');
  await generateCover('linear-agents', 'Linear Agents', '#5e6ad2', '#8b6bce');

  await generateScreenshot('dashboard', 'Dashboard', 'Agent Org Chart');
  await generateTaskScreenshot();

  console.log('\nDone! All images generated in public/vs/');
}

main().catch(console.error);
