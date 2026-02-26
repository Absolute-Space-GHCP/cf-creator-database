# CatchFire: AI Leadership Meeting -- Talking Points

**Prepared for:** Charley Scholz
**Meeting:** AI Leadership Discussion
**Date:** February 26, 2026
**Context:** Following PM catch-up with Charlie Williams (CatchFire PM)

---

## Background

Charlie Williams has joined CatchFire as product manager and presented a three-phase framework for the project:

| Phase | Focus | Charlie W's View |
|-------|-------|------------------|
| **Prototype** | Behavioral validation | Beautiful front-end, lightweight backend, manual processes, no AI |
| **Foundation** | Full product build | Robust CMS, admin controls, scalable architecture |
| **Sophistication** | AI + Automation | Agentic matching, brand self-service, full automation |

His prototype vision prioritizes the **maker experience** -- a premium, exclusive-feeling platform with WebGL animations, access codes, mission briefs, and content submission. He explicitly proposed deferring all agentic AI and the creator matching engine to later phases.

The matching engine (built by Charley with Dan over the past 3+ months) is a separate system that discovers and matches creators to briefs using AI-powered scraping, semantic search, embeddings, and scoring. It is operational and ready for testing.

---

## The Core Question

> Are we testing whether creators will upload videos for prize money?
> Or are we testing whether AI can find the *right* creators based on craft?

These are two different hypotheses. The first is interesting but not novel. The second is the entire basis of Leo's vision and the project's long-term value.

---

## Where Charlie W Is Right

**Acknowledge these points -- they are valid and demonstrate strong product thinking:**

1. **Behavioral validation first is sound PM practice.** If creators won't engage with a gamified prize system regardless of how they're matched, nothing else matters. Testing that assumption early is smart.

2. **The front-end experience must be premium.** CatchFire is an invitation-only creative network. If the first interaction doesn't feel special and exclusive, participation will suffer. WebGL, smooth animations, and polished craft are not vanity -- they are the product.

3. **Manual processes reveal pain points.** Doing creator matching by hand for the first test run forces the team to understand exactly what the AI will eventually need to automate. You learn what matters by doing it yourself first.

4. **Scope discipline protects timelines.** Charlie W's instinct to strip features that don't directly serve the prototype's hypothesis is good PM. A bloated prototype that tries to do everything often proves nothing.

---

## Where the Approach Carries Risk

**These are the points to make -- framed as risk reduction, not pushback:**

### 1. The Matching Engine Is the Hypothesis, Not a Feature

Leo's original thesis is not "will creators submit content for prizes" -- it's "can we build a system that discovers and matches creators based on craft, not clout." If the prototype strips out AI matching entirely, we're testing a content submission portal, not CatchFire.

The matching engine doesn't compete with the front-end experience. It *feeds* it. It determines who gets the invitation in the first place.

**Talking point:** "The matching engine answers the harder, more valuable question: can AI find the right creators? Manual matching during the prototype tells us nothing about whether the AI works. Running both in parallel gives us twice the learnings in the same timeframe."

### 2. "Intentionally Non-Scalable" Has a Hidden Cost

The matching engine backend already exists. It's deployed, tested (119+ automated tests), and integrated with 14 scrapers across festival and platform sources. It has:

- 37 creator profiles in Firestore with semantic embeddings
- 11 Golden Record benchmark creators
- AI-powered brief-to-creator matching with quality scoring
- Automated scraping from Ciclope, Motionographer, Behance, Vimeo, and more
- A full testing dashboard and web UI (now secured with Google Cloud IAP)

Building a throwaway prototype with manual matching, then rebuilding for the Foundation phase, means paying for the same capability three times: once for the manual prototype, once to integrate the existing engine, and once to scale it.

**Talking point:** "I've already built the scalable version. Turning it off to do things manually, then turning it back on later, costs more than keeping it running in the background. The backend is invisible to makers -- it only determines who gets invited."

### 3. Without the Engine, CatchFire Looks Like Every Other Platform

There are plenty of content submission platforms with prize incentives (Tongal, Zooppa, creative contests on Behance). What makes CatchFire different is the AI-driven discovery of craft storytellers -- people who aren't influencers, who don't have massive followings, but whose technical work is exceptional.

If the prototype doesn't use the matching engine to find these creators, we're hand-picking from our personal networks, which defeats the entire premise.

**Talking point:** "The prototype should demonstrate what CatchFire can do that no human curator can: find a brilliant DP in Zagreb who won a Camerimage student award but has 200 Instagram followers. That's the story that sells this to brands."

### 4. Running in Parallel Is Free

Charlie W himself said the matching engine "can run in parallel." The infrastructure is already deployed on Google Cloud Run. The cost is negligible. There is no reason to pause it.

The proposal: let Charlie W build the beautiful front-end experience. Let the matching engine run behind the scenes, selecting which creators get access codes. Makers never see the AI. They see the premium WebGL experience. But the data from AI-matched vs. hand-picked creators is gold for the Foundation phase.

**Talking point:** "I'm not asking to add scope. I'm asking to keep what's already built running in the background so we get data from it during the prototype. If we turn it off and rebuild later, we lose months of calibration and waste the investment already made."

---

## Proposed Path Forward

| Workstream | Owner | Timeline | Notes |
|------------|-------|----------|-------|
| **Front-end experience** | Charlie W's team | 4-6 weeks | WebGL briefcase, access codes, submission flow, premium UX |
| **Matching engine** | Charley / Dan | Parallel | Already operational. Continues refining with Golden Records data |
| **Creator selection for prototype** | Matching engine (AI) + human review | Pre-launch | AI suggests top candidates; team reviews and sends invitations |
| **Behavioral data collection** | Charlie W | During test run | Survey creators, track submissions, measure engagement |
| **Matching accuracy data** | Charley | During test run | Compare AI match scores vs. actual submission quality |

This approach gives the team two datasets from one test run:
1. **Behavioral data**: Do creators engage? (Charlie W's question)
2. **Matching accuracy data**: Did the AI pick the right creators? (Leo's question)

---

## The One-Liner

> "The matching engine and the maker experience are complementary, not competing. Let Charlie build the beautiful front-end. Let the matching engine run behind the scenes. Test both hypotheses at once. We've already built it -- turning it off costs more than keeping it on."

---

## Current System Status (for reference)

| Component | Status |
|-----------|--------|
| Matching Engine API | Online, 13 endpoints, Cloud Run |
| Creator Database | 37 profiles, Firestore |
| Semantic Search | Operational (768d embeddings) |
| Scraper Pipeline | 14 scrapers integrated |
| Web UI | React 19 + Vite, 7 pages |
| Security | IAP-secured, Google SSO, domain-restricted |
| Test Suite | 119 tests passing |
| Golden Records | 11 benchmarks (need 20+) |

---

## Key Quotes from the Conversation (for context)

**Charlie W, on the prototype's purpose:**
> "We are trying to prove that there is value in creators coming in. They are going to be incentivized to make great work. They're going to do that work within guidelines with the incentive of getting the prize pot and they're going to submit it on time."

**Charlie W, on running in parallel:**
> "I mean that piece can run in parallel."

**Charlie W, on what he wants to see:**
> "I would love to see what we've built and kind of understand what's gone into backend functionality in particular."

**Charley, on the technical reality:**
> "In order to get what Dan wanted in the prototype, I had to do complex reasoning, analytical, fuzzy logic, all kinds of crazy stuff to actually get this thing to go out, scrape, parse, and return results correctly."

**Charley, on scale:**
> "That's antithetical to the way I do development for JL. I do everything to scale. I could give it minimal functionality but not building in scale I think would be a big mistake."

---

## Action Items from PM Catch-up

- [ ] Send Charlie W the staging link (now IAP-secured: `https://cf-matching-engine.34.54.144.178.nip.io`)
- [ ] Send Charlie W the latest status report
- [ ] Charlie W to speak with Dan and Leo about alignment
- [ ] Charlie W to share wireframe deck
- [ ] Schedule follow-up demo of matching engine for Charlie W
- [ ] Discuss at AI Leadership meeting: parallel workstream proposal

---

Author: Charley Scholz, JLAI
Co-authored: Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
Last Updated: 2026-02-26
