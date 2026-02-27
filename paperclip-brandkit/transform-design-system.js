#!/usr/bin/env node
/**
 * Transform script: Adds DESIGN.md-style design system documentation
 * sections to each brand variation in the brand kit presentation.
 */
const fs = require('fs');
const path = require('path');

// Design system content for all 10 variations
const designSystems = {
  1: {
    bgColor: '#0b1120', textColor: '#f4f1eb', accentColor: '#b8962e', mutedColor: '#5a6a82',
    sectionClass: 'v1-ds',
    atmosphere: `Hushed opulence meets institutional gravity. The visual density is deliberately restrained — every element exists because it earned its place. Think the lobby of a Swiss private bank: dark wood paneling, gold-leafed serif lettering, air thick with implied wealth. Color temperature runs cold-warm — a navy abyss punctuated by bullion gold that catches light like a signet ring. The parchment surfaces recall aged vellum, hand-pressed and heavy.`,
    colorRoles: [
      { name: 'Midnight Abyss', hex: '#0b1120', role: 'Primary background, the deep void that commands attention through absence' },
      { name: 'Bullion Gold', hex: '#b8962e', role: 'Primary accent, action elements, rule dividers — the mark of authority' },
      { name: 'Aged Parchment', hex: '#f4f1eb', role: 'Primary surface, text-on-dark, the paper everything is printed on' },
      { name: 'Pewter Mist', hex: '#5a6a82', role: 'Secondary text, annotations, the quiet voice beneath the headline' },
      { name: 'Admiral Depth', hex: '#1c2d4a', role: 'Secondary background, card surfaces on dark contexts' },
      { name: 'Antique Linen', hex: '#d4c9a8', role: 'Borders, subtle dividers, the frame around the frame' },
    ],
    typography: `<strong>Display:</strong> Cormorant Garamond Light (300) — a high-contrast transitional serif with aristocratic bone structure. Used at enormous scale (clamp 4–8rem) with tight letter-spacing (-0.03em). The thin strokes disappear at small sizes, which is intentional: this font is meant to command a room, not fill a form.<br><br><strong>Body:</strong> Libre Franklin (400) — clean, neutral, never competing with the display. Set at 16px/1.65 line-height with 300–700 weight range. The anonymity is the point: it lets the serif do the talking.`,
    buttons: {
      primary: { label: 'Primary Action', bg: '#b8962e', text: '#0b1120', radius: '100px', border: 'none', desc: 'Pill-shaped, solid bullion gold with dark text. Weight and warmth signal commitment.' },
      secondary: { label: 'Secondary', bg: 'transparent', text: '#b8962e', radius: '100px', border: '1px solid #b8962e', desc: 'Outlined gold on dark ground. Present but deferential.' },
      ghost: { label: 'Ghost Action', bg: 'transparent', text: '#5a6a82', radius: '0', border: 'none', textDecoration: 'underline', desc: 'Pewter text with subtle underline. Barely there — for navigation, not calls to action.' },
    },
    card: { bg: '#1c2d4a', border: 'none', radius: '12px', shadow: '0 4px 24px rgba(11,17,32,0.3)', desc: 'Deep admiral-blue surfaces with generous padding (2rem+), no visible border. Elevation implied by warm-toned, diffused shadow. The card recedes; the content advances.' },
    input: { bg: 'transparent', border: 'none', borderBottom: '1px solid #b8962e', radius: '0', text: '#f4f1eb', placeholder: '#5a6a82', desc: 'Underline-only. Thin gold bottom-border, no box. The restraint says "we trust you to find the field."' },
    depth: `Minimal and intentional. Flat surfaces dominate — elevation is implied through color contrast (dark-on-darker) rather than shadows. When shadows appear, they are whisper-soft (0 4px 24px) and warm-toned, never blue-black. The deepest elements are the darkest; proximity to the viewer is measured in luminosity, not lift.`,
    layout: `Asymmetric two-column grid with a dominant left column. Generous margins (120px+ on desktop). Content breathes — white space is a luxury good, and this brand can afford it. Information hierarchy communicates through typographic scale (8rem headlines → 0.85rem body) rather than density. Sections are separated by single gold rules, never stacked cards.`,
  },
  2: {
    bgColor: '#0a0e14', textColor: '#e2e8f0', accentColor: '#39ff85', mutedColor: '#4a5568',
    sectionClass: 'v2-ds',
    atmosphere: `Cold and electric. Information density is high — packed data fields against pitch-black void, lit by the green phosphor glow of CRT monitors circa 1983. Everything feels rendered in real-time by a terminal emulator. Scanlines scroll vertically. A cursor blinks. The air hums with static. This is the aesthetic of systems that never sleep — monitoring dashboards at 3am, SSH sessions into distant servers.`,
    colorRoles: [
      { name: 'Terminal Void', hex: '#0a0e14', role: 'Primary background, the pitch-black screen before the first character appears' },
      { name: 'Phosphor Green', hex: '#39ff85', role: 'Primary accent, active states, the signal that means "alive"' },
      { name: 'Cold Silver', hex: '#e2e8f0', role: 'Primary text, high-priority data — bright enough to read through scanlines' },
      { name: 'Zinc Smoke', hex: '#4a5568', role: 'Secondary text, comments, the faded characters on old terminals' },
      { name: 'Panel Dark', hex: '#141a24', role: 'Card/panel backgrounds, slightly lighter than void — like a raised terminal window' },
      { name: 'Wire Blue', hex: '#1a2332', role: 'Borders, dividers, the structural wiring beneath the interface' },
    ],
    typography: `<strong>Display:</strong> Darker Grotesque (900) — an ultra-black condensed sans that feels stamped into the screen. Used at maximum weight for headlines with tight letter-spacing (-0.04em). The extreme weight creates the illusion of text burning into phosphor.<br><br><strong>Mono:</strong> JetBrains Mono (400) — the working font. Everything that isn't a headline is monospaced. Set at 14px/1.8 line-height. Code blocks, labels, body text — all mono. This isn't a design choice, it's a worldview.`,
    buttons: {
      primary: { label: 'Execute', bg: '#39ff85', text: '#0a0e14', radius: '2px', border: 'none', desc: 'Squared-off (2px radius), solid phosphor green with void text. Sharp and immediate — like pressing Enter.' },
      secondary: { label: 'Configure', bg: 'transparent', text: '#39ff85', radius: '2px', border: '1px solid #39ff85', desc: 'Outlined green on black. The border glows faintly on hover. Present but not presumptuous.' },
      ghost: { label: 'cancel_', bg: 'transparent', text: '#4a5568', radius: '0', border: 'none', desc: 'Zinc text, monospaced, with trailing underscore as blinking cursor. Barely visible until needed.' },
    },
    card: { bg: '#141a24', border: '1px solid #1a2332', radius: '6px', shadow: 'none', desc: 'Terminal window panels. Dark background slightly lighter than void, thin wire-blue border. Header bar with traffic-light dots (red/yellow/green). No shadows — elevation through border luminosity.' },
    input: { bg: '#0a0e14', border: '1px solid #1a2332', borderBottom: '', radius: '2px', text: '#39ff85', placeholder: '#4a5568', desc: 'Monospaced green text on void background. Wire-blue border. Cursor blinks phosphor green. Feels like typing into a terminal prompt.' },
    depth: `Flat by doctrine. No shadows exist in this world — there is no light source, only phosphor emission. Elevation is conveyed through border luminosity: brighter borders (#39ff85) signal active/focused states, dimmer borders (#1a2332) signal resting state. Occasional glow effects (box-shadow with green, 0 0 8px) indicate "power on" status.`,
    layout: `Dense three-column grid with tight 12px gutters. Information-rich: this interface packs data like a terminal multiplexer. Padding within panels is compact (1–1.5rem). Content width fills the viewport. No decorative whitespace — every pixel shows data or structure.`,
  },
  3: {
    bgColor: '#f7f2ec', textColor: '#3d2e22', accentColor: '#c15a3a', mutedColor: '#a0876c',
    sectionClass: 'v3-ds',
    atmosphere: `Sun-warmed and handmade. Low density with generous breathing room. The visual world is an artisan workshop — clay, linen, dried herbs hanging from wooden beams. The cross-stitch texture pattern underneath everything suggests needlework and patience. Colors are pulled from earth and plant: terracotta clay, sage leaves, raw cream cotton. Nothing feels manufactured; every element has the slight imperfection of something made by hand.`,
    colorRoles: [
      { name: 'Raw Cotton', hex: '#f7f2ec', role: 'Primary background, the unbleached fabric everything sits upon' },
      { name: 'Kiln-Fired Clay', hex: '#c15a3a', role: 'Primary accent, warmth source, the heat that gives life to form' },
      { name: 'Walnut Heartwood', hex: '#3d2e22', role: 'Primary text, grounded and warm, like ink from a walnut hull' },
      { name: 'Dried Sage', hex: '#a0876c', role: 'Secondary text, quiet labels, the herbaceous middle note' },
      { name: 'Pressed Linen', hex: '#ebe5dc', role: 'Card borders, subtle dividers, the weave visible at the edges' },
      { name: 'Porcelain White', hex: '#ffffff', role: 'Card surfaces, elevated elements, the glazed face of fired ceramic' },
    ],
    typography: `<strong>Display:</strong> Lora (400) — an old-style serif with gentle bracketed serifs and moderate contrast. It reads like handset type from a small press. Used at comfortable scale (clamp 4–7rem) with minimal letter-spacing (-0.02em). The warmth is built into the letterforms.<br><br><strong>Body:</strong> Nunito Sans (400) — rounded, friendly, never clinical. Set at 16px/1.65 line-height. The soft terminals pair naturally with Lora's organic serifs. Together they feel like a handwritten letter from someone who cares.`,
    buttons: {
      primary: { label: 'Craft This', bg: '#c15a3a', text: '#f7f2ec', radius: '100px', border: 'none', desc: 'Pill-shaped, solid terracotta with cream text. Warm and inviting — like a ceramic button on a cardigan.' },
      secondary: { label: 'Learn More', bg: 'transparent', text: '#c15a3a', radius: '100px', border: '1px solid #c15a3a', desc: 'Outlined in clay on cotton ground. The border has organic weight — 1px but feels hand-drawn.' },
      ghost: { label: 'Continue', bg: 'transparent', text: '#a0876c', radius: '0', border: 'none', textDecoration: 'underline', desc: 'Sage text with gentle underline. Quiet as dried herbs.' },
    },
    card: { bg: '#ffffff', border: '1px solid #ebe5dc', radius: '14px', shadow: '0 2px 12px rgba(61,46,34,0.06)', desc: 'Porcelain-white surfaces with pressed-linen borders. Generously rounded corners (14px) — nothing sharp. Soft warm shadow like actual paper elevated off a wooden desk. Generous padding (2rem).' },
    input: { bg: '#ffffff', border: '1px solid #ebe5dc', borderBottom: '', radius: '10px', text: '#3d2e22', placeholder: '#a0876c', desc: 'Rounded, cream background, warm linen border. Feels like writing in a handbound journal. No harsh focus states — the border warms to clay on focus.' },
    depth: `Light and diffused. Soft shadows with warm-brown tint (rgba(61,46,34,0.06)) — like the shadow of an actual piece of paper on a wooden table. Shadows are always warm, never blue-gray. Elevation is gentle: nothing floats aggressively; everything rests comfortably.`,
    layout: `Single-column prose sections (max-width 600px) mixed with three-column card grids. Wide margins, generous line-height (1.65+). Content flows like a letter — paragraphs of prose before grids of cards. The rhythm is conversational, not dashboard-like.`,
  },
  4: {
    bgColor: '#09090b', textColor: '#fafafa', accentColor: '#8b5cf6', mutedColor: '#a1a1aa',
    sectionClass: 'v4-ds',
    atmosphere: `Explosive confidence contained within clean geometry. The three-color gradient (purple → pink → orange) dominates like a perpetual sunrise — the primary visual element around which everything orbits. White elements float above the gradient like stars against an aurora. On neutral ground, the brand relaxes into clean tech minimalism. The tension between gradient maximalism and structural restraint creates something memorable.`,
    colorRoles: [
      { name: 'Void Black', hex: '#09090b', role: 'Dark background, the night sky behind the aurora' },
      { name: 'Violet Surge', hex: '#8b5cf6', role: 'Primary accent start, buttons, interactive elements — the ignition point' },
      { name: 'Hot Magenta', hex: '#ec4899', role: 'Gradient midpoint, warmth injection, the core of the explosion' },
      { name: 'Solar Flare', hex: '#f97316', role: 'Gradient endpoint, energy peak — used sparingly for maximum impact' },
      { name: 'Snow Surface', hex: '#fafafa', role: 'Light backgrounds, card surfaces, the calm ground beneath the fireworks' },
      { name: 'Smoke Gray', hex: '#a1a1aa', role: 'Secondary text, annotations, the residual quiet after the burst' },
    ],
    typography: `<strong>Display:</strong> Syne (800) — a geometric sans with high x-height and sharp personality. Extra-bold weight at enormous scale (clamp 4–8rem) with tight letter-spacing (-0.04em). The round, confident letterforms mirror the bold gradients.<br><br><strong>Body:</strong> Outfit (400) — a clean geometric sans with optical sizing. Set at 16px/1.65 line-height. Neutral enough to let the color do the work. The geometric construction pairs with Syne's geometry.`,
    buttons: {
      primary: { label: 'Launch Now', bg: 'linear-gradient(135deg, #8b5cf6, #ec4899)', text: '#ffffff', radius: '12px', border: 'none', desc: 'Rounded (12px), gradient fill from violet to magenta. The button itself is a miniature supernova. Text is white, weight 600.' },
      secondary: { label: 'Explore', bg: '#ffffff', text: '#8b5cf6', radius: '12px', border: '1px solid #e4e4e7', desc: 'White surface with violet text. Clean and corporate — the calm version of the brand.' },
      ghost: { label: 'Details', bg: 'transparent', text: '#a1a1aa', radius: '0', border: 'none', textDecoration: 'underline', desc: 'Smoke gray text with underline. Disappears into the background. For tertiary actions only.' },
    },
    card: { bg: '#ffffff', border: '1px solid #e4e4e7', radius: '16px', shadow: '0 4px 20px rgba(0,0,0,0.06)', desc: 'Snow-white surfaces with subtle gray border. Medium rounded corners (16px). Clean drop shadow. On gradient backgrounds: slight glass-morphism with backdrop-blur.' },
    input: { bg: '#ffffff', border: '1px solid #e4e4e7', borderBottom: '', radius: '10px', text: '#09090b', placeholder: '#a1a1aa', desc: 'White background, light gray border, rounded (10px). Focus state replaces border with violet-to-magenta gradient outline — the supernova sparks on interaction.' },
    depth: `Moderate and purposeful. Drop shadows on white elements over gradient backgrounds create clear elevation. Shadows are lightly colored — picking up the gradient beneath (rgba with purple tint). On neutral ground, shadows are minimal and gray.`,
    layout: `Full-bleed gradients with contained content areas (max-width 1200px). Three-column for equal-weight items, centered layout. Generous padding within containers (3rem+). The gradient is the stage; the content is the performer.`,
  },
  5: {
    bgColor: '#f6f8f7', textColor: '#1a1a2e', accentColor: '#2a9d8f', mutedColor: '#7c8f8c',
    sectionClass: 'v5-ds',
    atmosphere: `Contemplative silence. Extreme restraint where every element is placed with the deliberation of a Zen garden stone. Maximum whitespace is the primary design element — it's not empty, it's breathing. Color comes in small, meaningful doses: a teal accent here, a serif word there. The visual temperature is cool but not cold, like early morning mist over still water.`,
    colorRoles: [
      { name: 'Morning Mist', hex: '#f6f8f7', role: 'Primary background, the quiet gray-green of pre-dawn' },
      { name: 'Deep Tidal', hex: '#0c3c3f', role: 'Dark background variant, the deep water beneath the calm surface' },
      { name: 'Patina Teal', hex: '#2a9d8f', role: 'Primary accent, the single point of color in a monochrome world' },
      { name: 'Weathered Sage', hex: '#7c8f8c', role: 'Secondary text, quiet annotations, the moss on a stone' },
      { name: 'Celadon Wash', hex: '#d9eeeb', role: 'Subtle backgrounds, tinted surfaces, the lightest touch of color' },
      { name: 'Ink Depth', hex: '#1a1a2e', role: 'Primary text, headlines — dark enough to anchor without heaviness' },
    ],
    typography: `<strong>Display:</strong> Fraunces (300) — a variable optical-size serif with soft, organic terminals. Light weight at large scale (clamp 4–7rem) creates an effect like calligraphy rendered in morning fog. The optical sizing shifts character shapes between display and text sizes.<br><br><strong>Body:</strong> Manrope (400) — a clean, slightly rounded sans-serif. Set at 16px/1.65 line-height. The gentle rounding echoes Fraunces' organic quality without competing. Together they whisper rather than speak.`,
    buttons: {
      primary: { label: 'Begin', bg: '#2a9d8f', text: '#f6f8f7', radius: '10px', border: 'none', desc: 'Softly rounded (10px). Solid teal with mist text. A single, definitive point of action in an otherwise still field.' },
      secondary: { label: 'Explore', bg: 'transparent', text: '#2a9d8f', radius: '10px', border: '1px solid #2a9d8f', desc: 'Outlined teal. Barely present — the border is thin and the teal is calm. For secondary paths.' },
      ghost: { label: 'Learn more', bg: 'transparent', text: '#7c8f8c', radius: '0', border: 'none', desc: 'Sage text, no decoration at all. So quiet it might be mistaken for body text. That restraint is the point.' },
    },
    card: { bg: '#ffffff', border: '1px solid #d1d5db', radius: '14px', shadow: 'none', desc: 'Off-white on near-white, barely-there borders. The card exists as a whisper of structure — you sense its edges more than see them. Extreme padding (2.5rem). No shadow.' },
    input: { bg: 'transparent', border: 'none', borderBottom: '1px solid #2a9d8f', radius: '0', text: '#1a1a2e', placeholder: '#7c8f8c', desc: 'Underline-only. Thin teal bottom-border. No box, no background. The field is defined by the single line beneath it. Placeholder is sage — present but impermanent.' },
    depth: `Nearly absent by philosophical choice. Flat surfaces with tonal variation create the only "depth" — darker teal (#0c3c3f) for "deeper" elements, celadon wash (#d9eeeb) for surfaces. No shadows. The flatness is zen: there is no foreground or background, only different densities of the same calm.`,
    layout: `Maximum whitespace. Single-column or sparse two-column. Content is always centered. Margins are enormous (150px+ on desktop). Typography carries the entire hierarchy — no decorative elements compete. Sections are separated by emptiness, not lines.`,
  },
  6: {
    bgColor: '#2a2a2a', textColor: '#e8e4df', accentColor: '#c17f59', mutedColor: '#998f84',
    sectionClass: 'v6-ds',
    atmosphere: `Architectural precision. Medium density with strict grid alignment — every element snaps to an invisible 80px grid like a CAD drawing. The materiality is concrete, copper, and glass. You can almost feel the texture of brushed metal beneath your fingertips. Nothing is decorative; every line serves a structural purpose. The warmth of copper prevents the precision from feeling clinical.`,
    colorRoles: [
      { name: 'Poured Concrete', hex: '#e8e4df', role: 'Primary background, the raw material everything is built from' },
      { name: 'Architectural Graphite', hex: '#2a2a2a', role: 'Primary text, dark surfaces — the structural steel' },
      { name: 'Brushed Copper', hex: '#c17f59', role: 'Primary accent, action elements — the warmth in the machine' },
      { name: 'Morning Fog', hex: '#b0aca6', role: 'Secondary text, annotations, the haze between structures' },
      { name: 'Gypsum Plaster', hex: '#f5f3f0', role: 'Light surfaces, card backgrounds, the smooth interior finish' },
      { name: 'Volcanic Basalt', hex: '#5a534c', role: 'Borders, structural lines, the geological foundation' },
    ],
    typography: `<strong>Display:</strong> Newsreader (300) — a transitional serif with architectural precision. Light weight at scale (clamp 4–7.5rem) with -0.03em tracking. The thin strokes echo structural lines on a blueprint. The variable optical sizing adapts gracefully across headline and caption sizes.<br><br><strong>Body:</strong> Figtree (400) — a clean geometric sans with no pretension. Set at 16px/1.65 line-height. Every letterform is efficient, nothing ornamental. Like well-spec'd documentation.`,
    buttons: {
      primary: { label: 'Build', bg: '#c17f59', text: '#2a2a2a', radius: '4px', border: 'none', desc: 'Sharp squared edges (4px). Solid copper with graphite text. Industrial and immediate — like pressing a fabrication switch.' },
      secondary: { label: 'Spec Sheet', bg: 'transparent', text: '#2a2a2a', radius: '4px', border: '1px solid #2a2a2a', desc: 'Outlined in graphite. Clean and architectural — a structural element, not a decorative one.' },
      ghost: { label: 'Details', bg: 'transparent', text: '#998f84', radius: '0', border: 'none', textDecoration: 'underline 1px', desc: 'Fog-gray text with 1px underline. Barely-visible navigation. Functional, not decorative.' },
    },
    card: { bg: '#f5f3f0', border: '1px solid #b0aca6', radius: '8px', shadow: 'none', desc: 'Plaster-white surfaces with fog-gray borders. Sharp corners (8px). Zero shadow — elevation is conveyed through border weight and background contrast. Like a panel in an architectural model.' },
    input: { bg: 'transparent', border: 'none', borderBottom: '1px solid #c17f59', radius: '0', text: '#2a2a2a', placeholder: '#998f84', desc: 'Thin copper bottom-border only. No box, no background. Label above in small caps. The field is a line on a blueprint — nothing more.' },
    depth: `Flat. Zero shadows. Depth is created through layering: grid lines (visible at 0.12 opacity), border prominence (thicker = closer), and tonal weight (darker = closer). Like a blueprint — everything exists on the same plane, with hierarchy conveyed through line weight.`,
    layout: `Strict 8-column grid visible as background pattern. Asymmetric two-column (1fr 1fr) with generous 4rem gaps. Content width is narrow and controlled. Margins are precisely measured. Every element aligns to the grid.`,
  },
  7: {
    bgColor: '#0d0520', textColor: '#e8d5f0', accentColor: '#e040a0', mutedColor: '#9b6fd4',
    sectionClass: 'v7-ds',
    atmosphere: `Dreamlike and bottomless. Dense with visual layers — multiple radial gradients stacked at different depths, shapes drifting at different speeds suggesting infinite parallax. The indigo-to-void gradient creates the sensation of peering through a portal into deep space. Gold accents spark like distant stars. Magenta pulses like bioluminescence in an alien ocean. Nothing is static; everything breathes and drifts.`,
    colorRoles: [
      { name: 'Void Indigo', hex: '#0d0520', role: 'Primary background, the infinite depth behind everything' },
      { name: 'Portal Magenta', hex: '#e040a0', role: 'Primary accent, CTAs, the gateway energy — the invitation to step through' },
      { name: 'Star Gold', hex: '#d4a84f', role: 'Secondary accent, labels, section markers — distant starlight' },
      { name: 'Nebula Purple', hex: '#6b2fa0', role: 'Secondary background, gradient midtone, the atmospheric layer between void and surface' },
      { name: 'Stardust Lavender', hex: '#e8d5f0', role: 'Primary text, the light that reaches us from across the void' },
      { name: 'Deep Space', hex: '#1a0a3e', role: 'Card backgrounds, panels — one layer above void, one layer below surface' },
    ],
    typography: `<strong>Display:</strong> Bodoni Moda (900) — ultra-high contrast serif pushed to maximum weight. The hairline strokes disappear against the gradient, leaving only the thick verticals — letters emerging from darkness like pillars in a dream. Used at clamp(4–8rem) with dramatic text-shadow in magenta.<br><br><strong>Body:</strong> Lexend (400) — designed for readability, its open letterforms ensure legibility even against complex gradient backgrounds. Set at 16px/1.65 line-height. Clean and modern against the maximalist display.`,
    buttons: {
      primary: { label: 'Step Through', bg: 'linear-gradient(135deg, #e040a0, #d4a84f)', text: '#ffffff', radius: '14px', border: 'none', desc: 'Rounded (14px). Magenta-to-gold gradient. The button is a portal — inviting, warm, and slightly glowing.' },
      secondary: { label: 'Observe', bg: 'rgba(107,47,160,0.2)', text: '#e8d5f0', radius: '14px', border: '1px solid rgba(155,111,212,0.3)', desc: 'Translucent nebula-purple with glass-morphism. Subtle glow on hover. Present but ethereal.' },
      ghost: { label: 'Drift deeper', bg: 'transparent', text: '#9b6fd4', radius: '0', border: 'none', desc: 'Nebula-purple text. No decoration. The words seem to float in space, connected to nothing.' },
    },
    card: { bg: 'rgba(107,47,160,0.12)', border: '1px solid rgba(155,111,212,0.15)', radius: '16px', shadow: '0 0 20px rgba(224,64,160,0.1)', desc: 'Translucent nebula glass with subtle magenta glow at edges. Glass-morphism blur effect. The card seems to float in the void, emitting its own faint light. Corners are generously rounded (16px).' },
    input: { bg: 'rgba(13,5,32,0.6)', border: '1px solid rgba(155,111,212,0.2)', borderBottom: '', radius: '12px', text: '#e8d5f0', placeholder: '#9b6fd4', desc: 'Dark translucent background with faint purple border that glows magenta on focus. Rounded (12px). Text appears to glow faintly against the void.' },
    depth: `Maximum depth. Multiple layered radial gradients at different z-depths create genuine visual parallax. Glass-morphism panels float above the gradient field. Box-shadows are colored and pulsing (magenta-tinted, animated). Three distinct depth zones: void (background gradients), atmosphere (cards/panels), and surface (text/actions).`,
    layout: `Full-bleed atmospheric backgrounds with no visible grid. Content floats within the depth field. Three-column for portal cards. Generous padding (2rem+) within each card to let the glow breathe. Shapes drift independently — the layout itself has depth and motion.`,
  },
  8: {
    bgColor: '#585068', textColor: '#585068', accentColor: '#d4a0a0', mutedColor: '#8070b0',
    sectionClass: 'v8-ds',
    atmosphere: `Atmospheric and impressionistic. Low density with maximum softness — nothing has a hard edge anywhere. Colors bleed into each other like watercolors on wet paper. The entire visual field feels like looking through frosted glass or the warm haze of a summer afternoon. The blur is intentional and philosophical: this brand trusts you to see the shape without needing the outline.`,
    colorRoles: [
      { name: 'Lavender Haze', hex: '#e0d8ef', role: 'Primary background tint, the dominant atmospheric color — purple haze before clarity' },
      { name: 'Rose Blush', hex: '#d4a0a0', role: 'Primary accent, warmth source, the flush of color in an otherwise cool palette' },
      { name: 'Morning Mist', hex: '#c8d4e0', role: 'Secondary background, the cool complement to lavender — sky reflected in still water' },
      { name: 'Pearl Ground', hex: '#f8f6f4', role: 'Card surfaces, the lightest layer — almost white but with enough warmth to feel alive' },
      { name: 'Deep Iris', hex: '#8070b0', role: 'Secondary text, interactive elements, the color that focuses within the blur' },
      { name: 'Twilight Dusk', hex: '#585068', role: 'Primary text, the single element allowed to be sharp and definite' },
    ],
    typography: `<strong>Display:</strong> Crimson Pro Light Italic (300i) — italic is the primary voice, not the emphasis. The flowing italic forms mirror the watercolor aesthetic: letters that don't stand rigid but lean into each other like paint strokes. Used at clamp(4–7.5rem) with soft text-shadow.<br><br><strong>Body:</strong> Karla (400) — a humanist sans with warm, slightly irregular proportions. Set at 16px/1.7 line-height (extra generous). The subtle imperfections complement the impressionistic blur. Nothing about this typography is mechanical.`,
    buttons: {
      primary: { label: 'Immerse', bg: '#d4a0a0', text: '#ffffff', radius: '100px', border: 'none', desc: 'Pill-shaped, soft rose blush with white text and diffused shadow. The button seems to exhale warmth.' },
      secondary: { label: 'Explore', bg: 'rgba(224,216,239,0.4)', text: '#8070b0', radius: '100px', border: '1px solid rgba(128,112,176,0.2)', desc: 'Translucent lavender with glass-morphism. Nearly transparent. The iris text provides the only sharp element.' },
      ghost: { label: 'Continue', bg: 'transparent', text: '#8070b0', radius: '0', border: 'none', desc: 'Iris text, no decoration. Intentionally soft — the text itself seems slightly impressionistic.' },
    },
    card: { bg: 'rgba(248,246,244,0.6)', border: '1px solid rgba(128,112,176,0.1)', radius: '20px', shadow: '0 8px 40px rgba(88,80,104,0.06)', desc: 'Translucent pearl-ground with glass-morphism blur (backdrop-filter: blur(8px)). Borders are whispers of iris. Corners are very round (20px). Enormous diffused shadow that barely registers. The card is more a suggestion of containment than a box.' },
    input: { bg: 'rgba(248,246,244,0.4)', border: '1px solid rgba(128,112,176,0.15)', borderBottom: '', radius: '14px', text: '#585068', placeholder: '#8070b0', desc: 'Rounded, nearly transparent background. The thinnest possible iris border that dissolves into the surroundings. Focus state warms the border to blush.' },
    depth: `Soft and atmospheric. No hard shadows anywhere. Everything uses diffused, large-radius box-shadows (0 8px 40px) with very low opacity. Glass-morphism blur (backdrop-filter: blur(8px)) is the primary depth mechanism — layers are distinguished by how much blur they carry, not by how high they float.`,
    layout: `Loose, organic flow. Single-column prose sections (max-width 640px) transition into soft card grids. Margins are generous but not mathematically strict — more like the borders of a watercolor where the paint naturally stops rather than where a rule was drawn. Content areas breathe asymmetrically.`,
  },
  9: {
    bgColor: '#fafaf8', textColor: '#1a1a1a', accentColor: '#c0392b', mutedColor: '#777777',
    sectionClass: 'v9-ds',
    atmosphere: `Academic austerity. Deliberately plain — the visual language is borrowed wholesale from LaTeX documents, academic journals, and mathematical proofs. Nearly monochrome with a single vermillion accent used sparingly, like a professor's red pen circling a key insight. There is no decoration. The beauty is in the rigor of the typography, the precision of the margins, and the honesty of presenting information without embellishment.`,
    colorRoles: [
      { name: 'Archival Paper', hex: '#fafaf8', role: 'Primary background, the acid-free paper of a preserved document' },
      { name: 'Printer\'s Ink', hex: '#1a1a1a', role: 'Primary text, headings — the only color needed when the words carry weight' },
      { name: 'Professor\'s Vermillion', hex: '#c0392b', role: 'The single accent. Used for key insights, active elements, and the periodic mark of human judgment in a sea of logic' },
      { name: 'Pencil Annotation', hex: '#777777', role: 'Secondary text, marginalia, footnotes — the handwritten notes in the margins' },
      { name: 'Ruled Margin', hex: '#e8e6e2', role: 'Borders, horizontal rules — the faint lines that organize but never dominate' },
      { name: 'Footnote Dark', hex: '#333333', role: 'Emphasis text, code blocks — slightly lighter than ink for visual hierarchy' },
    ],
    typography: `<strong>Display & Body:</strong> Source Serif 4 (400) — a single variable serif for everything. The academic tradition uses one typeface family; the hierarchy comes from size and weight, not font-switching. Variable optical sizing (8–60) automatically adjusts character proportions between display and body. Set at generous 1.75 line-height for body text — scholarly reading comfort.<br><br><strong>Annotations:</strong> IBM Plex Mono (400) — for code, references, figure labels, and footnotes. The monospace suggests precision and computation. Used at 14px, always smaller than body text.`,
    buttons: {
      primary: { label: 'Submit', bg: '#c0392b', text: '#fafaf8', radius: '4px', border: 'none', desc: 'Squared-off (4px). Solid vermillion with archival text. The only saturated element on the page. Used extremely sparingly — one per view maximum.' },
      secondary: { label: 'Reference', bg: 'transparent', text: '#1a1a1a', radius: '4px', border: '1px solid #1a1a1a', desc: 'Outlined in ink. No fill. Looks like a bordered box in a printed document.' },
      ghost: { label: 'See §3.', bg: 'transparent', text: '#777777', radius: '0', border: 'none', textDecoration: 'underline', desc: 'Annotation-gray text with underline. Styled like a cross-reference in an academic paper. The red period after is the only color.' },
    },
    card: { bg: '#fafaf8', border: '1px solid #e8e6e2', radius: '2px', shadow: 'none', desc: 'No rounded corners (2px max). Thin ruled-margin borders — or no borders at all, just horizontal rules above and below. Paper background. The "card" is really just a section with generous line-spacing and a rule divider.' },
    input: { bg: 'transparent', border: 'none', borderBottom: '1px solid #1a1a1a', radius: '0', text: '#1a1a1a', placeholder: '#777777', desc: 'Academic and austere. Thin ink bottom-border. Monospace placeholder text. No box, no background. Looks like a fill-in-the-blank in an exam.' },
    depth: `Absent by design. This is flat, deliberately two-dimensional — like a printed page. There are no shadows because there is no light source; this is ink on paper. Hierarchy comes from type size, weight, and the strategic use of vermillion — never from elevation.`,
    layout: `Single-column, narrow measure (max-width: 640px). Left-aligned, never centered. Generous margins — the academic tradition of wide margins for marginalia. Line-height is 1.75 for body text. Sections separated by horizontal rules with generous spacing above and below (3rem+). Footnote-style annotations with superscript numbers.`,
  },
  10: {
    bgColor: '#0a0a0f', textColor: '#d0ffe8', accentColor: '#00e5a0', mutedColor: '#5a8a7a',
    sectionClass: 'v10-ds',
    atmosphere: `Computational and alive. Medium-high density — the 24px grid is visible underneath everything, like a circuit board or cellular automata field. The dark void background is punctuated by signal-green and pulse-orange cells that seem to follow algorithmic rules. The brand feels procedurally generated — a living system where simple rules produce emergent complexity. You're not looking at a design; you're looking at the output of a system.`,
    colorRoles: [
      { name: 'Computational Void', hex: '#0a0a0f', role: 'Primary background, the empty state before the algorithm begins' },
      { name: 'Signal Green', hex: '#00e5a0', role: 'Primary accent, active cells, "alive" state — the signal that means a rule fired' },
      { name: 'Pulse Orange', hex: '#ff6b35', role: 'Secondary accent, mutations, exceptions — the rare cell that breaks the pattern' },
      { name: 'Circuit Teal', hex: '#1e3a3a', role: 'Secondary background, panel bases — the substrate on which cells activate' },
      { name: 'Phosphor Glow', hex: '#d0ffe8', role: 'Primary text, the afterimage of signal green at lower intensity' },
      { name: 'Deep Matrix', hex: '#162020', role: 'Card backgrounds, the slightly raised surface above void' },
    ],
    typography: `<strong>Display:</strong> Azeret Mono (700) — a monospaced display face pushed to bold weight. The fixed-width characters reinforce the grid system — every letter occupies its cell. Used at clamp(3.5–7rem) with tight tracking (-0.04em). Text-shadow in green creates the "glow" of active cells.<br><br><strong>Body:</strong> Rubik (400) — a rounded sans-serif that softens the computational edge. Set at 16px/1.65 line-height. The gentle curves are the human element in an otherwise algorithmic system. A reminder that someone wrote the rules.`,
    buttons: {
      primary: { label: 'Execute', bg: '#00e5a0', text: '#0a0a0f', radius: '2px', border: 'none', desc: 'Squared-off (2px). Solid signal green with void text. The button is a cell that fired — active, definitive, computational.' },
      secondary: { label: 'Configure', bg: 'transparent', text: '#00e5a0', radius: '2px', border: '1px solid #1e3a3a', desc: 'Outlined in circuit-teal with green text. The structure is visible but the cell hasn\'t fired yet.' },
      ghost: { label: 'inspect', bg: 'transparent', text: '#5a8a7a', radius: '0', border: 'none', desc: 'Muted teal text. Lowercase, monospaced. Looks like a system command — typed, not designed.' },
    },
    card: { bg: '#162020', border: '1px solid #1e3a3a', radius: '4px', shadow: 'none', desc: 'Sharp corners (4px max). Dark matrix background with circuit-teal borders. Feels like a system panel or monitoring widget. No shadow — the grid pattern behind creates implied depth through its regularity.' },
    input: { bg: '#0a0a0f', border: '1px solid #1e3a3a', borderBottom: '', radius: '2px', text: '#00e5a0', placeholder: '#5a8a7a', desc: 'Void background, circuit-teal border. Signal-green text — input is active data entering the system. Monospaced placeholder. Feels like a terminal prompt.' },
    depth: `Minimal and electronic. No traditional shadows. Depth is conveyed through border luminosity (brighter green border = more prominent), background lightness gradients, and the visible grid that provides spatial reference. Active elements glow faintly green (box-shadow: 0 0 8px rgba(0,229,160,0.15)).`,
    layout: `Tight grid-based layout aligned to 24px grid (visible as background pattern). Three-column with narrow 12px gutters. Dense but organized — the density of a system monitoring dashboard. Information panels rather than decorative cards. Content fills available space.`,
  },
};

function buildDesignSection(v, num) {
  const bgColor = v.bgColor;
  const textColor = v.textColor;
  const accentColor = v.accentColor;
  const mutedColor = v.mutedColor;
  const lightBg = ['#f7f2ec','#fafafa','#fafaf8','#e8e4df','#f8f6f4','#f6f8f7'].includes(bgColor);

  const sectionBg = lightBg ? bgColor : bgColor;
  const sectionText = lightBg ? textColor : v.textColor;

  return `
        <!-- DESIGN SYSTEM DOCUMENTATION -->
        <section class="design-doc" style="background:${sectionBg}; color:${sectionText};">
          <div class="design-doc-inner">
            <div class="design-doc-header">
              <span class="label-sm" style="color:${accentColor};">Design System</span>
              <h2 class="design-doc-title" style="color:${textColor};">DESIGN.md</h2>
            </div>

            <div class="design-doc-block">
              <h3 class="design-doc-h3" style="color:${accentColor};">1. Visual Theme & Atmosphere</h3>
              <p class="design-doc-prose" style="color:${mutedColor};">${v.atmosphere}</p>
            </div>

            <div class="design-doc-block">
              <h3 class="design-doc-h3" style="color:${accentColor};">2. Color Palette & Functional Roles</h3>
              <div class="color-roles-grid">
                ${v.colorRoles.map(c => `
                <div class="color-role-item">
                  <div class="color-role-swatch" style="background:${c.hex};${c.hex === '#fafaf8' || c.hex === '#f7f2ec' || c.hex === '#f8f6f4' || c.hex === '#f6f8f7' || c.hex === '#fafafa' || c.hex === '#ffffff' || c.hex === '#e8e4df' || c.hex === '#e0d8ef' || c.hex === '#d9eeeb' || c.hex === '#e8e6e2' || c.hex === '#ebe5dc' || c.hex === '#c8d4e0' || c.hex === '#d4c9a8' || c.hex === '#d0ffe8' || c.hex === '#e8d5f0' || c.hex === '#d4a0a0' || c.hex === '#b0aca6' || c.hex === '#f5f3f0' ? ' border:1px solid rgba(0,0,0,0.1);' : ''}"></div>
                  <div class="color-role-info">
                    <span class="color-role-name" style="color:${textColor};">${c.name}</span>
                    <code class="color-role-hex" style="color:${mutedColor};">${c.hex}</code>
                    <p class="color-role-desc" style="color:${mutedColor};">${c.role}</p>
                  </div>
                </div>`).join('')}
              </div>
            </div>

            <div class="design-doc-block">
              <h3 class="design-doc-h3" style="color:${accentColor};">3. Typography Rules</h3>
              <p class="design-doc-prose" style="color:${mutedColor};">${v.typography}</p>
            </div>

            <div class="design-doc-block">
              <h3 class="design-doc-h3" style="color:${accentColor};">4. Component Stylings</h3>
              <div class="comp-grid">
                <div class="comp-demo-block">
                  <h4 class="comp-label" style="color:${textColor};">Buttons</h4>
                  <div class="comp-button-row">
                    <button class="comp-btn" style="background:${v.buttons.primary.bg}; color:${v.buttons.primary.text}; border-radius:${v.buttons.primary.radius}; border:${v.buttons.primary.border || 'none'};">${v.buttons.primary.label}</button>
                    <button class="comp-btn" style="background:${v.buttons.secondary.bg}; color:${v.buttons.secondary.text}; border-radius:${v.buttons.secondary.radius}; border:${v.buttons.secondary.border || 'none'};">${v.buttons.secondary.label}</button>
                    <button class="comp-btn" style="background:${v.buttons.ghost.bg || 'transparent'}; color:${v.buttons.ghost.text}; border-radius:${v.buttons.ghost.radius || '0'}; border:${v.buttons.ghost.border || 'none'}; ${v.buttons.ghost.textDecoration ? 'text-decoration:'+v.buttons.ghost.textDecoration+';' : ''}">${v.buttons.ghost.label}</button>
                  </div>
                  <p class="comp-desc" style="color:${mutedColor};"><strong>Primary:</strong> ${v.buttons.primary.desc}<br><strong>Secondary:</strong> ${v.buttons.secondary.desc}<br><strong>Ghost:</strong> ${v.buttons.ghost.desc}</p>
                </div>

                <div class="comp-demo-block">
                  <h4 class="comp-label" style="color:${textColor};">Cards & Containers</h4>
                  <div class="comp-card-demo" style="background:${v.card.bg}; border:${v.card.border}; border-radius:${v.card.radius}; box-shadow:${v.card.shadow};">
                    <p class="comp-card-title" style="color:${textColor};">Agent Status</p>
                    <p class="comp-card-body" style="color:${mutedColor};">3 agents running, 1 idle. All heartbeats nominal.</p>
                  </div>
                  <p class="comp-desc" style="color:${mutedColor};">${v.card.desc}</p>
                </div>

                <div class="comp-demo-block">
                  <h4 class="comp-label" style="color:${textColor};">Inputs & Forms</h4>
                  <input class="comp-input" style="background:${v.input.bg}; ${v.input.borderBottom ? 'border:none; border-bottom:'+v.input.borderBottom : 'border:'+v.input.border}; border-radius:${v.input.radius}; color:${v.input.text};" placeholder="Agent name" />
                  <p class="comp-desc" style="color:${mutedColor};">${v.input.desc}</p>
                </div>
              </div>
            </div>

            <div class="design-doc-block">
              <h3 class="design-doc-h3" style="color:${accentColor};">5. Depth & Elevation</h3>
              <p class="design-doc-prose" style="color:${mutedColor};">${v.depth}</p>
            </div>

            <div class="design-doc-block">
              <h3 class="design-doc-h3" style="color:${accentColor};">6. Layout Principles</h3>
              <p class="design-doc-prose" style="color:${mutedColor};">${v.layout}</p>
            </div>
          </div>
        </section>
`;
}

// Read the HTML
const htmlPath = path.join(__dirname, 'public', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// For each variation, insert the design system section before the palette section
for (let i = 1; i <= 10; i++) {
  const ds = designSystems[i];
  const section = buildDesignSection(ds, i);

  // Find the palette section for this variation
  const marker = `<section class="v${i}-palette-section">`;
  const idx = html.indexOf(marker);
  if (idx === -1) {
    console.error(`Could not find palette section for v${i}`);
    continue;
  }

  html = html.slice(0, idx) + section + '\n        ' + html.slice(idx);
  console.log(`✓ Inserted design system section for variation ${i}`);
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('\nDone! HTML updated with DESIGN.md sections for all 10 variations.');
