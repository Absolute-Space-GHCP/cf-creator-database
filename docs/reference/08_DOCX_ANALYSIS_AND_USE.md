# Docx Prototype Bundle — Analysis & Use for the Engine

**Source:** Project FKA Catchfire — JL Creator Database Prototype (Complete Documentation Bundle v1.2, February 2026)  
**Extracted text:** `07_DOCX_PROTOTYPE_BUNDLE_2026-02.txt`  
**Original file:** `Project FKA Catchfire_ JL Creator Database Prototype.docx`  
**Date:** 2026-02-11

---

## 1. Is This Duplicate Info?

**No.** The docx is **not** a duplicate of the deck or of our current docs. It is **more detailed and implementation-ready**:

| Dimension | Deck (pptx) | Docx (Prototype Bundle) | Our build |
|-----------|--------------|--------------------------|-----------|
| Schema | High-level (medium, subject, extractable) | **Full Tier 1/2/3** with field names, types, enums, max items | Craft + platform + style/keywords |
| Taxonomy | Mentioned (folksonomy, subcategories) | **Complete Synonym Normalization Map** (200+ tags, 10 categories, canonical ← variants) | No canonical map |
| “It’s like…” | Luminaries Reference Library (concept) | **100+ decomposed profiles** with “When Someone Says X-like They Mean” | Not implemented |
| Query → DB | Not specified | **Search Query Translation Guide** (natural language → tag resolution examples) | Brief text → keyword extraction only |
| AI / vision | Analyzer POC | **Image Analysis Tool spec** (input/output, confidence 0–1, thresholding for review) | No Tier 3 / image analysis |
| Sources | — | **Source Extraction Rules** (14 sources, extraction logic); **Tag Extraction Priority Matrix** | Apify/sources listed elsewhere |

So: **deck = product/vision; docx = spec + reference data.** The docx gives us the exact vocabulary, schema, and translation patterns we can implement.

---

## 2. How We Can Use It to Improve the Engine

### 2.1 Query validity and match accuracy

- **Synonym Normalization Map (Section 3)**  
  - **Use:** Normalize both **brief text** and **creator bios/tags** to the same canonical tags before scoring.  
  - **Effect:** “food photography” and “culinary, F&B, gastronomy” all map to `food`; “docu-style” and “verité” map to `documentary`. Reduces missed matches and noisy keyword matches.  
  - **Implementation:** Add a config/dictionary (JSON or TS) of `canonical ← [variants]`; in match flow, run brief and creator text through it, then score on canonical tags.

- **Search Query Translation Guide (Section 5)**  
  - **Use:** Treat these as **golden examples** of natural language → structured filters.  
  - **Effect:** Enables “Spielberg but for social video” → `output:video + platform:social + tone:wonder + style:reaction-shots + lighting:warm`, improving **query intent** capture.  
  - **Implementation:** (1) Use examples for few-shot LLM prompt to turn natural-language briefs into structured tag combinations. (2) Optionally add an explicit “query translation” step before `POST /api/v1/match` so the engine receives both raw brief and resolved tags.

- **Luminaries Reference Library (Section 4)**  
  - **Use:** When the brief (or translated query) mentions a luminary (e.g. “Annie Leibovitz energy”, “Wes Anderson vibes”), resolve to the docx’s **Visual Signatures**, **Tonal Attributes**, **Color Tendency**, and “When Someone Says X-like They Mean” bullets.  
  - **Effect:** Converts vague “like X” into concrete attributes (e.g. theatrical staging, conceptual celebrity, warm golden light) so scoring and filters align with creative intent.  
  - **Implementation:** Store luminaries as structured records (name, visual_signatures[], tonal_attributes[], color_tendency, when_someone_says[]). In match flow, detect luminary references → expand to tags (approach_style, visual_style, tone, etc.) and optionally `comparable_to` for ranking.

### 2.2 Confidence and reliability

- **Image Analysis Tool spec (Section 6)**  
  - **Confidence score (0–1)** per analysis; **Confidence Thresholding:** flag low-confidence analyses for human review.  
  - **Use:** When we add Tier 3 (AI-derived attributes from portfolio images), store `analysis_confidence` and `images_analyzed`; expose confidence in API or UI so users know how reliable the AI tags are.  
  - **Effect:** Improves **trust** in AI-populated fields and makes it clear when a human should verify.

- **Tag Extraction Priority Matrix (Appendix)**  
  - **Use:** When we score or display “where this tag came from,” weight by source reliability (e.g. directory categorization and self-declared specialties = high; hashtags = medium; AI visual analysis = variable).  
  - **Effect:** We can surface “high-confidence” vs “low-confidence” tag sources and optionally down-weight low-reliability tags in matching.

- **Match response confidence (future)**  
  - The docx doesn’t define a single “match confidence” score, but we can derive one: e.g. fraction of brief dimensions covered by canonical tags, overlap with luminary-expanded attributes, and (when Tier 3 exists) consistency with image analysis. Documenting this in TASKS or PLAN would align “confidence” in API responses with the docx’s emphasis on reliability.

### 2.3 Schema and API alignment

- **Tier 1 (Hard Fields)**  
  - Docx: `primary_output`, `output_subtype`, `budget_tier`, `last_active`, `contact_method`, `rep_name`, `rep_contact`, `source_url`, etc.  
  - **Use:** Adopt or map these in `src/schemas.ts` and Firestore so we align with the doc’s “required filterable” fields (see TASKS §6.2).

- **Tier 2 (Extractable Tags)**  
  - Docx: `subject_matter`, `subject_subcategory`, `approach_style`, `visual_style`, `tone`, `technical_capability`, `platform_usage`, `industry_vertical`, `illustration_style` (with max items per field).  
  - **Use:** Feeds directly into TASKS §6.1 (subject matter + subcategory taxonomy) and §6.3 (approach, tone, platform fit). Populate from LLM and scrapers using the Synonym Map so only canonical tags are stored.

- **Tier 3 (AI-Derived)**  
  - Docx: `color_analysis`, `composition_analysis`, `lighting_analysis`, `comparable_to[]` (with reference_type, reference_name, reference_aspect, confidence), `analysis_confidence`, `images_analyzed`, `last_analyzed`.  
  - **Use:** When we add image analysis, this is the target schema; confidence and thresholding come from Section 6.

---

## 3. Recommended Next Steps (for TASKS / roadmap)

1. **Add docx-derived tasks to TASKS.md**  
   - **Synonym Normalization:** Implement canonical tag map (from Section 3) and use it in brief + creator normalization before scoring.  
   - **Luminaries expansion:** Add Luminaries Reference Library as data (e.g. `docs/reference/luminaries.json` or in-code) and use it in match flow when “X-like” is detected.  
   - **Query translation:** Add a step (LLM or rules) to resolve natural-language briefs to structured tag combinations using Section 5 examples.  
   - **Confidence:** When Tier 3 exists, store and expose `analysis_confidence`; consider a “match confidence” or “tag reliability” signal in match API response.

2. **Store docx in repo**  
   - ✅ **Done:** `Project FKA Catchfire_ JL Creator Database Prototype.docx` is in `docs/reference/`.  
   - Keep `07_DOCX_PROTOTYPE_BUNDLE_2026-02.txt` as the flattened text for search and codegen.

3. **Optional: one-page “docx vs deck vs build”**  
   - Either extend `06_DECK_VS_BUILD_COMPARISON.md` with a short “Docx adds” subsection, or add a pointer here: the docx is the **authoritative spec** for schema and taxonomy; the deck is the **product narrative**; our build is implementing toward both.

---

## 4. Summary

| Question | Answer |
|----------|--------|
| **Duplicate?** | No. Docx is the detailed spec; deck is high-level; we didn’t have the full taxonomy or luminaries. |
| **Improve validity?** | Yes. Synonym map + query translation + luminaries expansion make brief intent and creator tags comparable on the same vocabulary. |
| **Improve confidence?** | Yes. Per-analysis confidence (Tier 3), priority matrix for tag source reliability, and optional match-level confidence. |
| **Improve accuracy?** | Yes. Canonical tags reduce noise; “X-like” → concrete attributes improves relevance; structured filters improve recall. |

Using the docx as the **reference spec** for schema, taxonomy, and query translation will directly improve engine functionality and query response validity, confidence, and accuracy.
