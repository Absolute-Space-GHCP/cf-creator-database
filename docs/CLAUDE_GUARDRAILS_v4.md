> **Version:** 1.0.0-clean | **Date:** 2026-01-28 | **Repo:** ai-agents-gmaster-build

---

## AI GOLDEN MASTER: REPOSITORY GUARDRAILS v1.0.0-clean

Last Updated: January 6, 2026
Author: Charley Scholz, JLAI
Co-author: Claude (Anthropic AI Assistant), Cursor (IDE)

---

This document defines the mission, constraints, and protocols for
all collaborators (human and AI) working within this repository
and on associated company AI initiatives.

---

1. The Core Mission
   The primary objective of this repository is to serve as a secure, scalable "Golden Master" environment for all company AI projects.

Core Principles:

Reproducibility: All projects must be fully reproducible via scripts (like requirements.txt or package.json) and clear documentation.

Scalability: Architectures should be designed to scale, favoring serverless (e.g., Cloud Run) and managed services (e.g., Vertex AI, Firestore) over bespoke, self-managed instances.

Security: Security is non-negotiable and the default posture for all code and infrastructure.

Process-Driven: We follow an "AI-First" methodology: Plan, Document, Build, Test, Iterate.

2. Approved Tech Stacks (The "Tools")
   All projects should, whenever possible, be built using the company's approved and supported technology stacks. Do not introduce new, unapproved services without a formal review.

Primary Environments: Python, Node.js

Primary Cloud: Google Cloud Platform (GCP)

Primary AI/LLMs: Google Gemini (via Vertex AI, AI Studio, or CLI)

Primary Data Stores: Firestore, Google Cloud Storage, Google Sheets, Google Drive

Primary Integrations: Slack, Gmail

3. Security & Change Protocol (The "Guardrails")
   These rules apply to all collaborators and all AI models.

Security:

NO TOKENS OR SECRETS: You will never write, display, or store API keys, secrets, passwords, or tokens in code, chat logs, or documents.

NO PII: You will not handle or display any real employee, customer, or user data. Use anonymized, placeholder data (e.g., "John Doe," "user@company.com").

USE .env: All code must load secrets from a .env file, and .env must be in the .gitignore file.

Change Control:

NO DEVIATION: You will not change a project's core mission, architecture, or tech stack without expressed confirmation from the project owner (Charley).

NO HALLUCINATION: If you are unsure about a step or a failure, state it clearly. Do not invent solutions. Reference the plan.

NO SURPRISES: Do not write code or suggest a new path without first outlining the plan for that step and getting approval. This is the "Plan, Then Build" model.

ONE TASK AT A TIME: You will only output the single, discrete task requested.

NO 'FINAL' FIXES: You will never state that a fix is "final" or "the last one." We determine what is complete together after a successful test.

PLAN FIRST, AVOID REGRESSION: Before implementing any change:

1. **Plan the change** - Outline what will be modified and why
2. **Identify dependencies** - What other code relies on this?
3. **Consider side effects** - Will this break existing functionality?
4. **Be critical of first output** - If it can be improved, improve it before outputting
5. **Avoid "fix one thing, breaks another"** - If uncertain, ask before implementing

PRE-COMMIT CODE REVIEW (MANDATORY): Before any `git commit`:

1. **Review all changed files** - Ensure edits didn't unintentionally delete code
2. **Verify complete functions** - No truncated or partial functions
3. **Check for lost imports** - All required imports still present
4. **Validate file integrity** - Compare before/after if needed
5. **Update CHANGELOG.md** - Every commit must have a corresponding changelog entry

6. Error & Oversight Protocol
   If you (or an AI assistant) make an error or oversight, do not apologize.

State the error.

State the optimal fix or correction.

Proceed.

5. Session & Debrief Protocol
   To ensure our "Golden Master" documents remain live and accurate, we must follow this protocol before any extended break (e.g., end of day, context switch).

5.1. Session Checkpoint: The project owner will declare a "Session Checkpoint" or "Debrief."

5.2. Cross-Check & Optimize: We will review the preceding steps, cross-checking successes, failures, and fixes. The "Optimal Fix" for any failure will be identified and agreed upon.

5.3. Document Update: The project PLAN.md will be updated to reflect these "Optimal Fixes" in a dedicated "Key Learnings" section. This ensures the plan document becomes a true "process template."

5.4. Session Summary: A SESSION*[DATE]*[VERSION].md file will be saved to the /docs directory for session continuity and auditing.

6. File & Context Protocol
   To prevent loops and version conflicts, we will adhere to the following file management protocol.

**"GitHub is Golden":** GitHub is the ultimate source of truth.

**Session Start Protocol (REQUIRED):**
Upon starting a new session or resuming a chat session:

1. **Parse Local Guardrails:** Read both `docs/CLAUDE_GUARDRAILS_v4.md` AND `docs/PROJECT_GUARDRAILS.md` to understand current protocols
2. **Parse TODO.md:** Review `docs/TODO.md` for pending tasks, context, and session handoff notes
3. **Parse Latest Session:** Read the most recent `docs/SESSION_*.md` file for session continuity
4. **Fresh Clone Check:** Ensure we are working from the latest clone from GitHub:
   - Local builds must be compressed and archived before pulling fresh clones
   - Fresh clones go into `/Users/charleymm/Projects/` folder
   - **NEVER edit or access any version other than the latest GitHub clone**
5. **GCP Auth Status Check:** Verify Google Cloud SDK authentication immediately:
   ```bash
   gcloud auth list
   ```

   - If no active account or expired, run `gcloud auth login` immediately
   - Do NOT wait until deployment fails - authenticate proactively at session start

**Pre-Work Verification:**

```bash
# Mac/Linux
cd /Users/charleymm/Projects/[PROJECT_NAME] && git fetch origin && git status && gcloud auth list
# If behind: git pull origin main
# If auth expired: gcloud auth login
```

**Authentication Protocol:**
âš ï¸ AI is **ALWAYS ALLOWED** to pop up authentication windows for:

- **Google Cloud (GCP):** Run `gcloud auth login` whenever auth is needed
- **GitHub:** Trigger browser-based OAuth/PAT authentication for git operations
- **Any other service:** Pop login windows as needed without asking permission

This is expected behavior - never hesitate to trigger auth prompts.

**Deployment Protocol:**
âœ… AI is **ALWAYS ALLOWED** to deploy to Google Cloud Run without asking permission:

- **Deploy command:** `gcloud run deploy [SERVICE_NAME] --source . --region us-central1 --platform managed --allow-unauthenticated --memory 512Mi --timeout 120`
- **Required permissions:** Always use `["all"]` permissions for gcloud commands to avoid sandbox restrictions
- **Project:** Use the project's configured GCP project ID
- **Region:** `us-central1` (default)

Deployment is a core part of our CI/CD workflow. Authentication windows may pop up during deploymentâ€”this is expected and allowed.

**âš ï¸ POST-DEPLOYMENT VERIFICATION:**
After every deployment, verify the service is healthy:

```bash
# 1. Check deployment status
gcloud run services describe [SERVICE_NAME] --region us-central1

# 2. Hit the health endpoint
curl -s "https://[SERVICE_URL]/"

# 3. Verify in logs
gcloud run services logs read [SERVICE_NAME] --region us-central1 --limit 10
```

Only consider deployment complete when service is confirmed healthy.

**Periodic Verification:** Check periodically during long sessions that we're still working from the correct repository.

"VS Code Exclusively": The user's local VS Code (Cursor) is the "Source of Truth" for all files.

Full File Updates (Internal): I (the AI) will perform "live" incremental updates to files in my internal memory during our session.

Full File Output (External): I will not output the full file for every single checkmark. I will only output a full, updated file upon request or at a "Session Checkpoint" debrief. This reduces token usage, cost, and confusion.

Version Bumping: All updates to PLAN.md must increment the version number.

Context Lock: Before proceeding, the AI must ask the user to confirm which version of the plan they are actively using.

7. Formatting Protocol
   To ensure clarity and reproducibility, all documentation must be clean.

Strict Markdown: All .md files will use strict, clean markdown formatting. This includes proper headers (e.g., ## Header), newlines between paragraphs, and correct list markers (\*, 1.) to prevent formatting issues.

File Naming: All files will use standard (non-em-dash) characters (e.g., ba-invoice-job-number-reconcile).

"Raw Text" Fallback: If a file block (```) fails to render for the user, I must stop, state the failure, and re-provide the content as raw text to break the loop.

8. Global Configuration Impact Analysis Protocol

---

Before executing any global configuration change (IAM, networking, security policies, API enablement), perform an impact analysis.

**Trigger Conditions:**
This protocol MUST be followed when modifying:

- IAM policies (adding/removing principals or roles)
- Network configurations (firewall rules, VPC settings)
- Security policies (authentication, authorization)
- Service configurations that affect multiple systems
- API enablement/disablement

**Required Steps:**

8.1. Identify Affected Systems

- List ALL services, integrations, and workflows that depend on the resource
- Consider internal systems AND external integrations (Slack, webhooks, third-party APIs)
- Check for service-to-service dependencies

  8.2. Assess Unintended Consequences

- What will STOP working if this change is applied?
- What authentication/authorization paths will be affected?
- Are there services that authenticate differently than the primary use case?
- Will any automated processes (CI/CD, scheduled jobs, webhooks) be impacted?

  8.3. Document Pros, Cons & Mitigations
  Present analysis in table format:

| Change            | Pros       | Cons        | Mitigation         |
| ----------------- | ---------- | ----------- | ------------------ |
| [Describe change] | [Benefits] | [Drawbacks] | [How to avoid/fix] |

8.4. Present Analysis BEFORE Action

- Output the full impact analysis to the user
- List all affected systems explicitly
- Get explicit approval AFTER consequences are understood
- Never proceed with global changes without user confirmation

**Impact Analysis Template:**

```
âš ï¸ GLOBAL CONFIGURATION CHANGE: [Description]

Affected Systems:
- [ ] Cloud Run services
- [ ] Slack integrations
- [ ] External webhooks/APIs
- [ ] CI/CD pipelines
- [ ] Scheduled jobs/Cloud Functions
- [ ] Other: [specify]

Intended Effects:
- âœ… [What should happen]

Potential Unintended Consequences:
- âš ï¸ [What might break] â†’ Mitigation: [solution]

Recommendation: [Proceed / Proceed with caution / Do not proceed]

Awaiting user confirmation before executing.
```

---

_Guardrails Version: 1.0.1_
_Updated: January 6, 2026_
