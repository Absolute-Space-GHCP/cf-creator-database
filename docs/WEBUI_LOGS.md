# Web UI Issue Log

Tracking web application UI errors, fixes, and design decisions for the CatchFire React SPA.

---

## Issue Log

### 2026-02-18: Critical - Styles Not Loading in Production

**Severity:** Critical  
**Status:** Fixed  
**Root Cause:** `index.css` was never imported in the build chain

**Symptoms:**
- Stats cards invisible (white on white)
- Quick Actions cards invisible
- Craft Distribution bars invisible
- Hero text nearly unreadable (faint light text on light background)
- Layout classes (`.section-dark`, `.section-light`, `.stats-grid`, `.creator-grid`) missing from bundle

**Details:**
The entry point `main.tsx` only imported `App` which only imported `tokens.css`. The global stylesheet `index.css` containing all layout/section styles was never imported anywhere, so none of those styles were included in the Vite production bundle.

Additionally, the `.stagger > *` animation sets `opacity: 0` initially, which combined with missing dark backgrounds made content completely invisible.

**Fix:**
1. Added `import './index.css'` to `main.tsx` (before App import)
2. Added `import './theme/tokens.css'` to `main.tsx` (proper import chain)
3. Added `@media (prefers-reduced-motion: reduce)` fallbacks in `index.css`

---

### 2026-02-18: Redesign - Full Dark Mode Overhaul

**Status:** Completed  
**Type:** Design overhaul

**Changes:**
- Replaced hybrid light/dark theme with full dark editorial aesthetic
- New font pairing: Playfair Display (headings) + Sora (body) replacing DM Serif Display + Outfit
- Warm gold accent (#c9a227) on deep black background (#0d0d0d)
- Added noise texture overlay for depth
- Glass-morphism header with blur backdrop
- Removed all `section-light` / `section-dark` alternating sections (entire app is dark)
- Rewrote all 10 CSS files for consistency

**Files Modified:**
- `web/src/theme/tokens.css` - Complete rewrite
- `web/src/index.css` - Complete rewrite
- `web/src/main.tsx` - Fixed import chain
- `web/src/App.tsx` - Removed tokens.css import (now in main.tsx)
- `web/src/components/layout/Header.css` - Dark glass header
- `web/src/components/layout/Footer.css` - Dark minimal footer
- `web/src/components/ui/ui.css` - All component styles
- `web/src/pages/Home.css` - Hero, stats, quick actions, craft bars
- `web/src/pages/CreatorBrowse.css` - Sidebar, cards, filters
- `web/src/pages/CreatorProfile.css` - Profile layout, details
- `web/src/pages/BriefMatch.css` - Brief form, match results
- `web/src/pages/SearchResults.css` - Search results grid
- `web/src/pages/Admin.css` - Table, toggles, model card
- `web/src/pages/Status.css` - Service grid, status dots
- `web/src/pages/Home.tsx` - Removed section-dark/light classes
- `web/src/pages/CreatorProfile.tsx` - Removed section-dark/light classes

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Full dark mode | Better contrast, modern aesthetic, matches creative industry expectations |
| Playfair Display + Sora | Distinctive serif/sans pair that avoids generic AI aesthetic (no Inter/Roboto) |
| Warm gold accent | Brand-aligned warmth against cool dark backgrounds |
| Noise texture overlay | Adds film-grain depth, aligns with cinematography/craft theme |
| Glass-morphism header | Modern, sophisticated feel with content visibility |

---

## Known Issues

_None currently tracked._

---

Author: Charley Scholz, JLAI
Co-authored: Claude Opus 4.5, Claude Code (coding assistant), Cursor (IDE)
Last Updated: 2026-02-18
