# CatchFire Creator Database - Project Brief

> **Source:** Requestor-provided context document  
> **Received:** 2026-01-28

---

## Mission

We are mobilizing a cross-functional squad to build CatchFire's most valuable asset: a proprietary database of the world's best up and coming storytellers. With a specific focus on **craft storytelling skills vs audience size**.

## The End Goal

A structured dataset that we will eventually plug into Claude Code to create an automated Matching Engine. The vision is that in 3 months, we can feed a client brief into our system, and it will recommend the perfect creators based on **style, passion and location**.

To get there, we need to build the foundation manually and methodically. We have a **$5k budget** to make this happen.

---

## 1. The Squad & Responsibilities

We are assigning roles based on department strengths to run in parallel.

### A. Social Media Strategy Team (Hunters)

- **Role:** Define where we look. We are not looking for influencers; we are looking for craft.
- **Specific Task:** Build the "Source List" for IT to scrape. This includes:
  - **Festivals:** All American High School Film Fest (AAHSFF), NFFTY, FilmFreeway (identifying specific niche festivals like "Sci-Fi London" or "Brooklyn Horror").
  - **Platforms:** Vimeo Staff Picks, Behance (for motion design), Tumblr/Pinterest (for curators/aesthetes), and Reddit communities (r/videography, r/cinematography).
  - **Keywords:** A technical tag list (e.g., #bmpcc6k, #aftereffects, #stopmotion).

### B. IT / Technology (Architects)

- **Role:** Build the scraping infrastructure and the future ML pipeline.
- **Specific Task:**
  - Deploy Claude Code + Apify to scrape the "Source List" provided by Strategy.
  - **The "Categorization Bot":** Write a script that uses an LLM (Claude/OpenAI) to read a creator's bio and recent captions to auto-tag them (e.g., "Is this person a Vlogger or a Filmmaker?").
  - Set up the Airtable/Database Schema to house the data.

### C. Creative & Design (Taste Makers)

- **Role:** Quality Control and Categorization.
- **Specific Task:**
  - **The "Golden Records":** Identify the first 20 "perfect" CatchFire creators. These will serve as the benchmark for the database.
  - **Visual Vetting:** Review the IT-generated lists to ensure the aesthetic meets our high bar.

### D. Production (Realists)

- **Role:** Feasibility and Contact.
- **Specific Task:**
  - Verify if these creators are "hireable." (Do they have email contacts? Are they active?)
  - Flag location and production constraints (e.g., "This creator is amazing but lives in rural Indonesia; good for digital assets, bad for on-site shoots").

### E. Project Management (Conductor)

- **Role:** Manage the timeline, the $5k budget, and the various workshops throughout.

---

## 2. The Phased Workflow

### Phase 1: Dragnet & Categorization (Week 1)

- **Action:** Social Strategy delivers the Source List. IT begins the broad scrapers. Creative & Design finds best in class examples/creates categorization. Production establishes required criteria for creator engagement.

- **Categorization Refinement (Milestone Meeting):**
  - **Who:** All Leads.
  - **Agenda:** We review the first 50 potential candidates together.
  - **Goal:** Define the exact tags we will use for the Matching Database.
  - **Outcome:** A set of tags that IT will program into the database fields.

### Phase 2: The Build & Refine (Weeks 2-3)

- **Action:**
  - IT runs the scrapers at scale (targeting AAHSFF alumni, FilmFreeway winners, etc.).
  - Creative & Design enters Selection Mode, reviewing batches of 100 incoming profiles to Approve/Reject based on the example benchmarks.
  - Production begins data enrichment (finding emails/rates/locations etc for approved creators).

### Phase 3: The CatchFire Engine (Month 2 - Future State)

- This is where we leverage Machine Learning.
- **The Lookalike Model:** Once we have 500 vetted creators, IT uses their profiles to train a custom GPT/Claude agent.
- **Automation:** We set up a script to auto-scan the web weekly.
  - Command: "Find me 10 new creators who have a visual style similar to [Creator A] but are located in [Chicago]."
- **Result:** The database grows itself.

---

## 3. Budget Allocation ($5,000 Total)

| Category | Amount | Tools |
|----------|--------|-------|
| **Scraping & Data Tools** | $1,500 | Apify ($500), Clay.com/Hunter.io ($1,000) |
| **Infrastructure** | $500 | Airtable Business / Notion AI |
| **TBD Fund** | $3,000 | Budget for additional needs (offshoring, etc.) |

---

## 4. Immediate Next Steps

1. **PM:** Make any suggested updates to this document. Appoint department leads. Confirm timeline.
2. **Social Strategy:** Begin compiling the list of festival winners (AAHSFF, NFFTY) and subreddits.
3. **IT:** Research best tools to use and configure Claude Code environment.
4. **Creative & Design:** Find example creators for various styles.
5. **Production/BA:** Details required to make contact and engage creators.

---

*Original document provided by CatchFire project stakeholders.*
