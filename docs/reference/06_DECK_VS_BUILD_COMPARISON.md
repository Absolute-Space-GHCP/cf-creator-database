# Deck vs. Current Build — Comparison & Project Place in CatchFire

**Deck:** Project FKA Catchfire Creator Database, Update 2026.02.11  
**Build:** cf-influencer-matching-engine (Phases 0–2 complete, Phase 3 planned)  
**Date:** 2026-02-11

---

## 1. This project’s place in CatchFire deliverables

The deck’s **Database role** slide defines an end-to-end flow:

**Database system** → **Client brief** → **Creator ID & outreach** → **Creator briefing** → **Creator execution**

Inside the **Database system**, the deck calls out:

- **Scraper** — ingest  
- **Analyzer** — understand / sort  
- **Search engine** — find / match  

**Where we sit:** This repo (**cf-influencer-matching-engine**) is that **Database system**: we implement (or are building toward) Scraper (ingest), Analyzer (understand/sort), and Search engine (find/match). We expose that via REST API. The **Catchfire MVP** (Next.js) is the client-facing app that would collect the client brief, call our API for creator ID & matching, and drive Creator ID & outreach → Creator briefing → Creator execution. So we are the **backend engine**; the deck describes the broader product and taxonomy that the engine should support.

---

## 2. What aligns

| Deck | Current build | Notes |
|------|----------------|--------|
| “Find creator / maker from a brief” | `POST /api/v1/match` + scoring | Same outcome: brief in → ranked creators out. |
| Need to “understand / sort” creators | LLM categorization, style signature, positive/negative keywords | Analyzer role is in place. |
| “Find / match” | `rankCreators`, keyword extraction, (planned) semantic search | Search/match is implemented; semantic layer is Phase 3. |
| Ingest from external sources | Apify batch import, Firestore, planned scraping | Scraper/ingest path exists and is documented. |
| Hard fields: name, location, contact | Creator schema: name, handle, platform, contact (email, portfolio_url, location, etc.) | Core identity and contact are covered. |
| “Folksonomic” / tags describing oeuvre | `craft.styleSignature`, `craft.technicalTags`, `matching.positiveKeywords` | Tagging and style are present; taxonomy differs (see below). |
| Quality / vetting | `matching.qualityScore`, `isGoldenRecord` | Aligns with “match to the need of the moment” and quality control. |

---

## 3. What differs

### 3.1 Taxonomy: medium vs. craft vs. subject

- **Deck:**  
  - **Classification** = primary **medium**: STILL (photography, illustration, ai_imagery, art), VIDEO (film_narrative, commercial, social_platform, documentary, music_video, animation), AUDIO (podcast_spoken_word, music_composition, sound_design).  
  - **Subject matter** = food, beverage, automotive, fashion, beauty, lifestyle, portrait, product, sports, travel, tech, medical, architecture, nature, children, seniors, corporate, entertainment, luxury — with **subcategories** (e.g. under food: restaurant, packaged-goods, recipe, beverage).  
  - **Extractable tags:** subject matter, **approach**, **visual style**, **tone**, **platform fit** (from profiles/bios).

- **Current build:**  
  - **Craft** = role/skill: cinematographer, director, editor, colorist, vfx_artist, motion_designer, photographer, etc. (no explicit still/video/audio or film_narrative/commercial/documentary).  
  - **Platform** = where they appear (vimeo, behance, artstation, instagram, youtube, …).  
  - **No subject-matter taxonomy** (no food, automotive, fashion, beauty, etc.).  
  - **No subcategories** (e.g. packaged-goods, luxury-automotive).  
  - We have **styleSignature** and **technicalTags**; we do not have separate structured fields for “approach,” “tone,” or “platform fit.”

**Gap:** Deck is **medium + subject + extractable dimensions**; we are **craft + platform + style/keywords**. To align with the deck we’d need to add (or map into) primary medium, subject matter tags (and optionally subcategories), and consider approach / tone / platform fit (in schema or LLM output).

### 3.2 Hard fields

- **Deck:** name, **primary medium (still/video/audio)**, **budget tier**, location, contact info, **last active date**.  
- **Current build:** name, handle, platform, location, contact (email, portfolio_url, location, locationConstraints, rateRange, isHireable). We have **rateRange** but not **budget tier**; we do not have **last active date** or an explicit **primary medium** field.

**Gap:** Add or map: primary medium, budget tier, last active date.

### 3.3 Use cases (wording and emphasis)

- **Deck:**  
  (A) Creators **adjacent to a more famous artist** (e.g. “paints like Picasso’s Blue Period”).  
  (B) **Medium or platform** (e.g. “documentaries on YouTube”).  
  (C) **Topic expertise, POV, or mood** (e.g. “authentic and attractive to Gen Z, particularly when it comes to cars”).

- **Current build:**  
  We match on **brief text** → keyword extraction + scoring on craft, keywords, location, etc. We don’t explicitly model “style-adjacent to artist” or “POV/mood” as first-class use cases; we don’t yet have subject-matter or subcategory filters.

**Gap:** Use cases (B) and (C) are partially supported by brief text + scoring; (A) “style-adjacent to X” would benefit from style/similarity (e.g. Phase 3 semantic/lookalike). Making (A)–(C) explicit in product/API (e.g. filters, query types) would align with the deck.

### 3.4 Downstream flow (Creator ID → briefing → execution)

- **Deck:** Database feeds **Creator ID & outreach** → **Creator briefing** → **Creator execution**.  
- **Current build:** We do not implement outreach, briefing, or execution; we only output matched creators (and optional links to work/sources per future enhancements). That downstream flow belongs to the **Catchfire MVP** or other tools.

**No gap for this repo:** We are the Database system only; the rest is product/UX.

---

## 4. Insights from the deck

1. **Broader verticals:** The deck’s taxonomy is **ad-industry and vertical-friendly**: F&B (food, beverage, restaurant, packaged-goods), automotive (luxury/commercial/motorsport/lifestyle), fashion (high-fashion, commercial, streetwear, accessories), beauty, lifestyle, sports, travel, tech, medical, etc. Our current schema is **craft- and festival-oriented** (cinematography, Vimeo, Behance). Supporting the deck’s use cases (e.g. “Gen Z + cars”) will eventually require **subject matter and subcategories** (or a clear mapping from our keywords to their taxonomy).

2. **“Extractable” vs. “hard”:** The deck clearly separates **hard fields** (name, medium, budget tier, location, contact, last active) from **extractable tags** (subject matter, approach, visual style, tone, platform fit) from profiles/bios. We already do some of that via LLM (categorize, style signature); we could formalize “approach,” “tone,” and “platform fit” as explicit dimensions in schema and prompts.

3. **Folksonomic ladder:** The deck’s “terms that ladder up” (e.g. [culinary, tabletop food, F&B, …] → **food**) is a good fit for **normalizing scraped/bio text** into a controlled taxonomy. We could adopt or map to that subject (and subcategory) dictionary for ingestion and matching.

4. **“A working prototype?”:** Slide 19 frames the current state as a **prototype**. That matches our status: Phases 0–2 done (API, match, categorize, style, batch import, Golden Records); Phase 3 (semantic search, embeddings, lookalike) and taxonomy expansion would move the engine toward the full vision in the deck.

5. **Naming (“FKA Catchfire”):** “Project FKA Catchfire Creator Database” suggests the initiative may have been renamed or folded into a larger CatchFire program. Our repo name and docs can stay “CatchFire Matching Engine”; it’s useful to know the deck is the **Creator Database** view of that same initiative.

---

## 5. Recommended next steps (from this comparison)

1. **Schema / taxonomy:**  
   - Add or map: **primary medium** (still/video/audio), **budget tier**, **last active date**.  
   - Decide whether to introduce **subject matter** (and optionally **subcategory**) tags from the deck (e.g. food, automotive, fashion, …) into our creator schema and scoring, or to map our existing keywords/style to that taxonomy at query time.

2. **Extractable dimensions:**  
   - Consider adding **approach**, **tone**, **platform fit** (or equivalent) to LLM categorization and to the creator document (or to a separate search index) so matching can use them.

3. **Product/API:**  
   - Expose or document query types that mirror the three use cases: (A) style-adjacent to X, (B) medium/platform, (C) topic/POV/mood. Phase 3 semantic and lookalike will help (A); filters and taxonomy will help (B) and (C).

4. **Reference:**  
   - Keep the deck and this comparison in **docs/reference/** and cite them in PLAN.md and TASKS.md when adding taxonomy or use-case work.

---

## 6. One-line summary

**This project is the Database system in the deck (Scraper + Analyzer + Search engine).** We already do brief-in → ranked-creators-out and LLM-backed understanding/sorting; the main gaps are **taxonomy** (medium, subject matter, subcategories, extractable dimensions) and **hard fields** (primary medium, budget tier, last active), plus explicit support for the three use cases (style-adjacent, medium/platform, topic/POV/mood) in schema and API.

---

_CatchFire — Finding craft, not clout._
