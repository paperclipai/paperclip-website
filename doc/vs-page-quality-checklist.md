# Competitive Comparison Page (/vs) — Publishing Quality Checklist

Use this checklist before publishing any new or updated `/vs` competitive comparison page. Every item must pass before the page goes live.

---

## 1. Cover Image

- [ ] **Index page header**: A branded hero image behind "How Paperclip Compares" (not just a CSS gradient)
- [ ] **Individual page cover image**: Each `/vs/[competitor]` page has a unique cover image that visually represents "Paperclip vs [Competitor]"
- [ ] Cover images use consistent dimensions (recommended: 1200x630 or 16:9 ratio)
- [ ] Cover images follow brand guidelines — must match the site's bright illustrated style (see `/hero-bg.jpg`, `/blog-header.jpg` for reference). No dark-mode or moody designs.
- [ ] Cover images are optimized for web (WebP with JPG fallback, <200KB)
- [ ] Cover images render correctly on both desktop and mobile viewports

## 2. Visual Design & Tables

- [ ] **Feature comparison table** uses visual indicators: checkmark icons for supported features, X marks for unsupported features (not plain text "Yes"/"No")
- [ ] Table has proper visual hierarchy — Paperclip column is visually distinguished (e.g., highlighted column header)
- [ ] Table is responsive and readable on mobile (horizontal scroll or stacked layout)
- [ ] Table rows have alternating or hover states for readability

## 3. Screenshots & Product Visuals

- [ ] **Real screenshots only** — every screenshot must be captured from the live Paperclip app (paperclip.ing). Never use fabricated, mocked, or AI-generated screenshots. If a real screenshot is not available, omit the image rather than invent one.
- [ ] At least one screenshot or product visual showing Paperclip's relevant UI/feature
- [ ] Screenshots are current (match the latest production UI)
- [ ] Screenshots have appropriate context (captions or surrounding copy that explains what the reader is seeing)
- [ ] Images have alt text for accessibility

## 4. Content Quality

- [ ] **Quick Take** section: 2-3 sentences, clear and balanced
- [ ] **What [Competitor] Does Well**: Honest, specific — not a strawman
- [ ] **Where Paperclip Differs**: Concrete differentiators with supporting detail
- [ ] **Feature Comparison Table**: Comprehensive, accurate, up-to-date
- [ ] **When to Choose [Competitor]**: Fair and honest recommendation
- [ ] **When to Choose Paperclip**: Specific use cases, not generic marketing
- [ ] No factual errors about the competitor's capabilities
- [ ] Copy is concise — no fluff, no jargon without explanation
- [ ] Grammar and spelling reviewed

## 5. SEO & Metadata

- [ ] Page title follows pattern: "Paperclip vs [Competitor] — AI Agent Coordination Compared"
- [ ] Meta description is unique and under 160 characters
- [ ] Frontmatter fields complete: `competitor`, `title`, `excerpt`, `date`, `order`, `coverImage`
- [ ] URL follows pattern: `/vs/[slug]`

## 6. CTA & Conversion

- [ ] CTA section present at bottom of page
- [ ] CTA links to GitHub repo and docs
- [ ] CTA copy is clear and action-oriented

## 7. Cross-Browser & Device QA

- [ ] Page renders correctly on Chrome, Firefox, Safari (latest)
- [ ] Page is fully responsive: mobile (375px), tablet (768px), desktop (1440px)
- [ ] No horizontal scroll issues on mobile (except intentional table scroll)
- [ ] Images load correctly on all viewports
- [ ] Navigation and back links work correctly

## 8. Index Page Integration

- [ ] New comparison appears in the `/vs` index grid
- [ ] Card displays correct competitor name, excerpt, and link
- [ ] Card ordering is correct (check `order` frontmatter field)
- [ ] Index page maintains consistent card layout with cover image thumbnails

## 9. Deployment & Verification

- [ ] Changes deployed to canary/staging first
- [ ] QA agent verifies canary deployment against this checklist
- [ ] All checklist items pass on canary before production merge
- [ ] Production deployment verified by QA

---

**Process**: CMO or Content Strategist reviews against this checklist before marking any `/vs` page as ready for QA. QA uses Section 7 and Section 9 for their verification pass. UX Designer owns Sections 1-3 deliverables.
