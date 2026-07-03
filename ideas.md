# ICP Scraper Tool — Design Brainstorm

## Three Stylistic Approaches

### 1. Command Center (Probability: 0.07)
Dark, data-dense, terminal-meets-SaaS. Think Bloomberg Terminal but beautiful.

### 2. Precision Intelligence (Probability: 0.08)
Dark navy + electric gold. Authoritative, sharp, B2B intelligence platform feel.

### 3. Clean Operator (Probability: 0.06)
Off-white + deep charcoal + amber accent. Confident, no-fluff, built for people who get things done.

---

## Chosen Approach: **Precision Intelligence**

### Design Movement
Dark-mode B2B SaaS with editorial precision — inspired by intelligence platforms and financial data tools.

### Core Principles
1. Every element earns its place — no decoration for decoration's sake
2. Information hierarchy is king — the user always knows what to do next
3. Dark surfaces with high-contrast gold/amber accents signal authority and trust
4. Motion is purposeful — confirms actions, never distracts

### Color Philosophy
- Background: Deep slate `oklch(0.13 0.012 260)` — serious, focused
- Surface: `oklch(0.18 0.012 260)` — card backgrounds
- Primary Accent: Electric gold `oklch(0.78 0.18 85)` — ownable, memorable
- Secondary Accent: Electric blue `oklch(0.60 0.20 255)` — data, links, highlights
- Text: Near-white `oklch(0.92 0.005 260)` on dark, deep slate on light

### Layout Paradigm
Asymmetric split-panel layout. Left-heavy content column with right-side interactive panel. 
Hero uses full-bleed image with overlay. Tool section uses a 60/40 split.

### Signature Elements
1. Gold horizontal rule dividers between sections
2. Monospace font for code/query output blocks
3. Subtle grid dot pattern on dark backgrounds

### Interaction Philosophy
Every input triggers immediate visual feedback. The query builder updates in real-time as users type. 
Copy-to-clipboard confirms with a checkmark animation.

### Animation
- Entrance: fade-up at 200ms ease-out, staggered 60ms per item
- Button press: scale(0.97) at 160ms
- Query output: typewriter reveal effect
- Step transitions: slide-right 250ms

### Typography System
- Display: Syne (bold, geometric, authoritative)
- Body: Inter (clean, readable)
- Code: JetBrains Mono (technical credibility)

### Brand Essence
The sharpest prospecting tool for coaches and consultants who are done wasting time on bad leads. 
Adjectives: Precise. Relentless. No-fluff.

### Brand Voice
Direct, confident, zero filler. Headlines sound like a coach who's been in the trenches.
- Example headline: "Stop guessing. Start finding the people who actually need you."
- Example CTA: "Build My Query"

### Signature Brand Color
Electric gold `oklch(0.78 0.18 85)` — unmistakably this brand's.
