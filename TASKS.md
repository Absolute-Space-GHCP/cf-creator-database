# CatchFire Matching Engine — Tasks

**Repo:** cf-influencer-matching-engine  
**Last updated:** 2026-02-11

**Source of truth:** This file replaces `docs/TODO.md` for task tracking. Prefer TASKS.md over TODO.md so tasks can be broken into subtasks and assigned to specialist subagents or agents as needed.

---

## How we use TASKS.md

- **One place for work:** All actionable work lives here; break large items into subtasks under the parent task.
- **Break into smaller tasks:** Under any task, add a `Subtasks:` list when the work can be split (e.g. by file, by API, by phase).
- **Assign as warranted:** Use `Assignee:` or `Agent hint:` to suggest ownership (e.g. Backend, Docs, Security, Full-stack, or a specialist agent). Omit if unassigned.
- **Status:** Use 📋 Open | 🔄 In progress | ✅ Done | ⏸️ Blocked | ❓ Needs clarification.

---

## 1. Template adoption & customization

*(Converted from docs/TODO.md — AI Golden Master customization checklist.)*

### 1.1 Update `package.json` with project name

- **Status:** ✅ Done (project name: cf-influencer-matching-engine)

### 1.2 Configure application settings

- **Status:** 📋 Open (use `.env` from `.env.example`; `src/config.js` if used)
- **Subtasks:** Copy `.env.example` → `.env`; set GCP project, region, Gemini model, Firestore collection; document in SETUP.md.
- **Agent hint:** DevOps / setup

### 1.3 Update `docs/PLAN.md` with architecture

- **Status:** ✅ Done (CatchFire PLAN.md in place)

### 1.4 Update project requirements doc

- **Status:** 📋 Open (create or update `docs/PROJECT_REQUIREMENTS.md` with scope and requirements)
- **Agent hint:** Docs / PM

### 1.5 Customize `public/dashboard.html` branding

- **Status:** 📋 Open (CatchFire branding, org name, links)
- **Subtasks:** Replace template branding; add CatchFire logo/copy; ensure health and analytics links match this project.
- **Agent hint:** Frontend / Design

### 1.6 Add and maintain business logic in `src/`

- **Status:** 🔄 In progress (match, creators, categorize, scoring, LLM in place; Phase 3 and hardening pending)
- **Subtasks:** See PLAN.md Phase 3; security middleware (helmet, cors, rate-limit); full @google/genai migration.
- **Agent hint:** Backend / Full-stack

---

## 2. Template capabilities (verify / maintain)

| Capability           | Status   | Task / note |
| -------------------- | -------- | ----------- |
| Gemini 2.5 Flash     | ✅ Ready | LLM in use (categorize, style signature) |
| Google Drive API     | 📋 Verify | Confirm if CatchFire needs Drive; add task to integrate or remove from scope. |
| Google Sheets API    | 📋 Verify | Same as Drive — needed for CatchFire or template-only? |
| Express Server       | ✅ Ready | `src/index.js` |
| Web Dashboard        | ✅ Ready | `public/dashboard.html` — customize per 1.5 |
| Notifications        | 📋 Verify | Slack/Gmail — needed for CatchFire? Add task or mark N/A. |
| Config template      | ✅ Ready | `src/config.template.js` / `.env.example` |

- **Meta-task:** Decide which template features are in scope for CatchFire; create concrete tasks for any “Verify” row and mark others N/A.
- **Agent hint:** PM / Architect

---

## 3. Documentation and commands

### 3.1 Keep key docs in sync

- **Status:** 📋 Open
- **Subtasks:** Ensure `docs/PLAN.md`, `docs/PROJECT_GUARDRAILS.md`, `docs/SETUP.md`, `docs/CLAUDE_GUARDRAILS_v4.md` (or equivalent) exist and are updated when architecture or process changes.
- **Agent hint:** Docs

### 3.2 Document getting started and quick commands

- **Status:** 📋 Open
- **Subtasks:** README or SETUP.md: clone, install, configure (.env), run (`npm start`), deploy (Cloud Run); document `gcloud run deploy` and logs command for this project.
- **Agent hint:** Docs

### 3.3 Update README and CHANGELOG roadmaps to match actual progress

- **Status:** ✅ Done (2026-02-11)
- **Done:** README Phase 1–2 marked complete, Phase 3 set as current; CHANGELOG v0.2–v0.3 marked complete, v0.4 set as current.
- **Agent hint:** Docs

---

## 4. Open / needs clarification

### 4.1 After-query: “Dive deeper” — other subjects, styles, sources

- **Status:** ❓ Needs clarification

After query responses (e.g. match results), ask the end user whether they’d like to see **different combinations of other subjects, styles, etc. from various other sources** — to increase curiosity and help the end user learn and dive deeper if they want to.

- **Intent:** Post-response prompt (e.g. “Explore more?”) offering related or alternate angles: other subjects, styles, or sources.
- **Clarification needed:** Exact placement; what “combinations” means; how to source “other subjects/styles”; single toggle vs. multiple choices.
- *Once clarified, break into subtasks and link from PLAN.md / Future Enhancements.*

---

## 5. Loose / other repo to-dos (consolidated)

*(From PLAN.md Open Questions, HANDOFF, CLAUDE security checklist, and roadmap items.)*

### 5.1 Security middleware (CLAUDE checklist)

- **Status:** ✅ Done (2026-02-11)
- **Done:** Installed and wired `helmet`, `cors`, `express-rate-limit` in `src/index.js`; optional env `CORS_ORIGIN`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` in `.env.example`. Zod remains for input validation.
- **Agent hint:** Backend / Security

### 5.2 PLAN open questions

- **Status:** 📋 Open
- **Subtasks:** Confirm Apify actor selection per platform; define Golden Records criteria with Creative; Platform ToS review for scraping; rate limiting strategy for API; Catchfire MVP integration timeline.
- **Agent hint:** PM / Architect

### 5.3 Phase 3 (PLAN.md) — Search & Discovery

- **Status:** 📋 Open
- **Subtasks:** 3.1 Embeddings generation; 3.2 Semantic search endpoint (“Find similar to X”); 3.3 Lookalike model on Golden Records (500+ vetted); 3.4 Weekly auto-scan (Cloud Scheduler); 3.5 Catchfire MVP REST integration.
- **Agent hint:** Backend / Full-stack

### 5.4 HANDOFF open questions

- **Status:** 📋 Open
- **Subtasks:** Confirm embedding model (text-embedding-004 vs gecko); vector storage (Firestore vs Pinecone vs Vertex Matching Engine); Apify actor selection for Vimeo/Behance/ArtStation; CatchFire MVP integration timeline.
- **Agent hint:** Architect

---

## 6. Deck-derived (most → least valuable)

*(From docs/reference/05_DECK_DIGEST and 06_DECK_VS_BUILD_COMPARISON. Ordered by impact for this repo.)*

### 6.1 [MOST] Subject matter + subcategory taxonomy (deck alignment)

- **Status:** ✅ Done (2026-02-11: schema, taxonomy config, scoring, API filters, CLAUDE.md, ingest/categorize population via LLM + fallback)
- **Source:** Deck slides 5–7, 16–18; comparison §3.1.
- **What:** Introduce or map to the deck’s **subject matter** tags and **subcategories**. Enables use cases like “Gen Z + cars” and aligns engine with ad-industry verticals.
- **Subtasks (concrete):**
  1. **Schema:** In `src/schemas.ts`, add to creator (e.g. new top-level or under `craft`): `subjectMatterTags: z.array(z.string()).optional().default([])` (parent tags: food, beverage, automotive, fashion, beauty, lifestyle, portrait, product, sports, travel, tech, medical, architecture, nature, children, seniors, corporate, entertainment, luxury) and `subjectSubcategoryTags: z.array(z.string()).optional().default([])` (e.g. restaurant, packaged-goods, luxury-automotive, high-fashion). Export constants `SUBJECT_MATTER_TAGS` and `SUBJECT_SUBCATEGORY_TAGS` (or a single dict mapping subcategory → parent) for validation.
  2. **Dictionary/config:** Add `docs/reference/SUBJECT_TAXONOMY.json` (or `config/subject-taxonomy.json`) with deck’s parent tags and subcategories (and optional “ladder” synonyms). Reference in 6.5 when implementing ladder normalization.
  3. **Scoring:** In `src/scoring.ts`, add subject-matter and subcategory overlap between brief-derived keywords and creator’s `subjectMatterTags` / `subjectSubcategoryTags` (e.g. boost score when brief mentions “cars” and creator has `automotive` or `luxury-automotive`).
  4. **Ingest/categorize:** In batch import or POST /categorize flow, populate `subjectMatterTags` and optionally `subjectSubcategoryTags` from LLM and/or dictionary lookup (bio/caption text → tags). Depends on 6.5 for full “ladder” normalization.
  5. **API filters:** Allow `GET /api/v1/creators` and match request to filter by `subjectMatter` and/or `subjectSubcategory` (query params or body).
  6. **Docs:** Update CLAUDE.md “Creator Database Schema” with new fields; add a line in PLAN.md or docs that subject taxonomy is from deck (docs/reference/05_DECK_DIGEST).
- **Agent hint:** Backend / Data model

### 6.2 [HIGH] Primary medium + hard fields (budget tier, last active date)

- **Status:** 🔄 In progress (2026-02-11: schema + match filters + CLAUDE.md done; migration/backfill note pending)
- **Source:** Deck slide 5; comparison §3.2.
- **What:** Add **primary medium** (still/video/audio), deck **classification** types, **budget tier**, and **last active date** to creator schema.
- **Subtasks (concrete):**
  1. **Schema — primary medium:** In `src/schemas.ts`, add `PRIMARY_MEDIA = ['still', 'video', 'audio'] as const` and `primaryMedium: z.enum(PRIMARY_MEDIA).optional()` to creator (top-level or under `craft`).
  2. **Schema — classification (deck):** Add `CLASSIFICATION_TYPES` (deck values): STILL → photography, illustration, ai_imagery, art; VIDEO → film_narrative, commercial, social_platform, documentary, music_video, animation; AUDIO → podcast_spoken_word, music_composition, sound_design. Add `classification: z.string().optional()` (or `z.enum([...])`) to creator; optional if you prefer to derive from `primaryMedium` + free-form tag.
  3. **Schema — budget tier:** Add `budgetTier: z.string().optional()` to `contact` or top-level (e.g. "tier_1", "tier_2", "tier_3" or "low" / "mid" / "high" — decide with PM). We already have `rateRange`; either rename/alias or keep both (rateRange = free text, budgetTier = normalized).
  4. **Schema — last active date:** Add `lastActiveDate: z.string().datetime().optional().or(z.string())` (ISO date or YYYY-MM-DD) or `lastActive: z.string().datetime().optional()` to creator (top-level). Use for “freshness” in scoring or filters.
  5. **Migration:** Existing Firestore docs can omit new fields (optional). Add a short note in docs or a script to backfill `primaryMedium` from existing `craft.primary` / `platform` (e.g. cinematographer → video, photographer → still).
  6. **Docs:** Update CLAUDE.md “Creator Database Schema” with `primaryMedium`, `classification`, `budgetTier`, `lastActiveDate`; reference deck slide 5.
- **Agent hint:** Backend / Data model

### 6.3 [HIGH] Extractable dimensions: approach, tone, platform fit

- **Status:** 📋 Open
- **Source:** Deck slides 7, 18; comparison §3.1, §5 recommended next steps.
- **What:** Formalize **approach**, **tone**, and **platform fit** as explicit dimensions (schema and/or LLM output) so matching can use them. Deck defines extractable tags as “subject matter, approach, visual style, tone, and platform fit” from profiles/bios.
- **Subtasks:** Add fields or structured LLM output; extend categorize/style pipeline; use in scoring or filters.
- **Agent hint:** Backend / LLM

### 6.4 [MEDIUM] Three use-case query types (API/product)

- **Status:** 📋 Open
- **Source:** Deck slide 4; comparison §3.3.
- **What:** Expose or document query types that mirror deck use cases: (A) **style-adjacent to X** (e.g. “like Picasso’s Blue Period”), (B) **medium/platform** (e.g. “documentaries on YouTube”), (C) **topic/POV/mood** (e.g. “authentic to Gen Z, cars”). Phase 3 semantic/lookalike helps (A); filters and taxonomy help (B) and (C).
- **Subtasks:** API params or query shape; docs; optional Catchfire MVP UX.
- **Agent hint:** Backend / PM

### 6.5 [MEDIUM] Folksonomic “ladder” dictionary for ingestion

- **Status:** 📋 Open
- **Source:** Deck slides 6–7; comparison insight #3.
- **What:** Adopt or map to the deck’s “terms that ladder up” (e.g. [culinary, tabletop food, F&B, …] → **food**) to normalize scraped/bio text into controlled subject (and subcategory) tags during ingest.
- **Subtasks:** Store dictionary (e.g. docs or config); use in batch import / LLM categorization.
- **Agent hint:** Backend / Data

### 6.6 [LOW / informational] “Working prototype” framing

- **Status:** N/A (no task)
- **Source:** Deck slide 19.
- **What:** Deck asks “A working prototype?” — aligns with our status: Phases 0–2 done, Phase 3 and taxonomy expansion move toward full deck vision. No action; use for stakeholder comms.

---

## 7. Deck build progress vs our progress

### 7.1 What the deck shows

- **Agenda (slide 2):** 01 Database role, 02 Use cases, 03 Database structure, 04 Analyzer proof of concept, **05 Build progress**.
- **Slide 19:** “A WORKING PROTOTYPE?” — implies current state is at or near prototype.
- **Limitation:** The actual **Build progress** slide content (e.g. checklist or status bullets for “05. Build progress”) was **not fully captured** in our deck digest (slides 8–18 were mostly taxonomy repeats). So we cannot do a point-by-point comparison with the deck’s own progress checklist.

### 7.2 Our status (per PLAN.md)

- **Phase 0:** ✅ Done (foundation, GCP, config, deps, server).
- **Phase 1:** ✅ Done (Firestore, creator schema, CRUD, GET/POST creators, batch, scoring, POST /match).
- **Phase 2:** ✅ Done (POST /categorize, style signature, positive/negative keyword scoring, Golden Records import, batch processing with LLM).
- **Phase 3:** 📋 Pending (embeddings, semantic search, lookalike model, auto-scan, Catchfire MVP integration).

### 7.3 Where it diverges

- **Deck “Build progress” content unknown:** We don’t have the deck’s own progress checklist, so we can’t say if their “05. Build progress” matches our Phase 0–2 completion.
- **README and CHANGELOG:** Were stale; **task 3.3 is done** — README and CHANGELOG now show Phase 1–2 and v0.2–v0.3 complete, Phase 3 / v0.4 as current.
- **Deck “Analyzer proof of concept” (04):** We have a working Analyzer (categorize, style, keywords). If the deck’s “04” was a POC milestone, we are at or past it; again, without the build slide we can’t confirm.

---

## 8. Future enhancements (consolidated)

*(From PLAN.md §10, CHANGELOG Future, README, and deck comparison.)*

- **End-user option: links to work, refs, and sources** — Ask whether to show links to specific work (portfolio/reel), references (festivals, awards), and discovery sources; API support (e.g. `includeWorkLinks` / `includeSourceLinks`); schema fields for per-creator work/source URLs. *(Already in PLAN.md and CHANGELOG; tracked in TASKS as enhancement.)*
- **Dive deeper (after-query):** Optional “explore more?” for other subjects, styles, sources. *(In §4.1; needs clarification.)*
- **Semantic search + lookalike + auto-scan** — Phase 3. *(In §5.3.)*
- **Taxonomy and use-case alignment with deck** — Subject matter, subcategories, primary medium, hard fields, extractable dimensions, three query types. *(In §6.1–6.5.)*

---

## 9. Docx-derived (Prototype Bundle v1.2)

*(From docs/reference/07_DOCX_PROTOTYPE_BUNDLE_2026-02.txt and 08_DOCX_ANALYSIS_AND_USE.md. The docx is the detailed spec: full schema, Synonym Normalization Map, Luminaries Reference Library, Search Query Translation Guide, Image Analysis Tool, Source Extraction Rules.)*

### 9.1 Synonym Normalization Map in match flow

- **Status:** 📋 Open
- **Source:** Docx Section 3 (200+ canonical tags, 10 categories).
- **What:** Normalize brief text and creator bios/tags to **canonical tags** before scoring so “food photography”, “F&B”, “culinary” all map to `food`; “docu-style”, “verité” to `documentary`. Improves validity and accuracy.
- **Subtasks:** Add config/dictionary (e.g. `canonical ← [variants]`); run brief and creator text through it in match flow; score on canonical tags. Can share dictionary with 6.5 (ladder).
- **Agent hint:** Backend / Data

### 9.2 Luminaries Reference Library for “X-like” queries

- **Status:** 📋 Open
- **Source:** Docx Section 4 (100+ decomposed profiles: Visual Signatures, Tonal Attributes, “When Someone Says X-like They Mean”).
- **What:** When a brief mentions a luminary (e.g. “Annie Leibovitz energy”, “Wes Anderson vibes”), resolve to concrete attributes and use in scoring/filters. Improves query intent and match accuracy.
- **Subtasks:** Store luminaries as structured data (e.g. `docs/reference/luminaries.json` or in-code); in match flow detect luminary references → expand to approach_style, visual_style, tone, etc.; optionally `comparable_to` for ranking.
- **Agent hint:** Backend / LLM

### 9.3 Query translation (natural language → structured tags)

- **Status:** 📋 Open
- **Source:** Docx Section 5 (Search Query Translation Guide: natural language → tag resolution examples).
- **What:** Add a step to resolve natural-language briefs to structured tag combinations (e.g. “Spielberg but for social video” → output:video + platform:social + tone:wonder + style:reaction-shots + lighting:warm). Improves validity of what we match against.
- **Subtasks:** Use Section 5 examples as few-shot LLM prompt or rule set; optional explicit “query translation” step before POST /match; API can accept raw brief + optional resolved tags.
- **Agent hint:** Backend / LLM

### 9.4 Confidence scoring (AI tagging and optional match confidence)

- **Status:** 📋 Open
- **Source:** Docx Section 6 (Image Analysis: confidence 0–1, thresholding for human review); Appendix (Tag Extraction Priority Matrix).
- **What:** (1) When Tier 3 / image analysis is added: store `analysis_confidence`, flag low-confidence for review. (2) Optionally weight tags by source reliability (priority matrix). (3) Optional “match confidence” or “tag reliability” in match API response.
- **Subtasks:** Document in schema/API when Tier 3 is implemented; add analysis_confidence, images_analyzed; consider match-level confidence metric.
- **Agent hint:** Backend / Data

---

## 10. Superseding docs/TODO.md

- **Decision:** TASKS.md is the single source of truth. `docs/TODO.md` is a redirect to this file.
- **Loose to-dos** from README, CHANGELOG, PLAN open questions, HANDOFF, and CLAUDE have been consolidated into §3.3, §5, §6, and §8.

---

_CatchFire — Finding craft, not clout._
