> **Version:** 1.0.0-clean | **Date:** 2026-01-28 | **Repo:** ai-agents-gmaster-build

# GitHub Onboarding & Security Guide

**Version:** 1.0.0-clean  
**Last Updated:** 2025-12-10  
**Applies To:** ai-agents-gmaster-build repository  
**Maintainer:** Charley (@cmscholz222)

---

## Overview

This guide documents how to securely add team members to the repository while enforcing a strict contribution workflow. Team members can view and clone the repository but cannot push changes directly—all changes must go through a Pull Request (PR) review process.

### Security Model

| Role                   | Clone/View | Push to Main | Create PR     | Approve/Merge PRs |
| ---------------------- | ---------- | ------------ | ------------- | ----------------- |
| **Maintainer** (Owner) | ✅         | ✅           | ✅            | ✅                |
| **Team Member** (Read) | ✅         | ❌           | ✅ (via fork) | ❌                |

---

## Part 1: For Maintainers

### 1.1 Adding Team Members

**Step 1: Navigate to Repository Settings**

```
https://github.com/Absolute-Space-GHCP/ai-agents-gmaster-build/settings/access
```

Or: Repository → Settings → Collaborators and teams

**Step 2: Invite Collaborator**

1. Click **"Add people"** or **"Add teams"**
2. Search for the team member's GitHub username
3. Select **"Read"** permission level
4. Click **"Add [username] to this repository"**

**Step 3: Team Member Accepts Invite**

- They'll receive an email invitation
- They must accept to gain access
- Verify they appear in the collaborators list

### 1.2 Permission Levels Explained

| Permission   | What They Can Do                                            |
| ------------ | ----------------------------------------------------------- |
| **Read**     | Clone, fork, view code, open issues, create PRs from forks  |
| **Triage**   | Read + manage issues and PRs (no code write)                |
| **Write**    | Push to non-protected branches, merge PRs (NOT recommended) |
| **Maintain** | Write + manage repo settings (NOT recommended)              |
| **Admin**    | Full access (reserve for owners only)                       |

> ⚠️ **Recommendation:** Always use **Read** for new team members. This ensures all code changes go through PR review.

---

### 1.3 Setting Up Branch Protection Rules

Branch protection prevents direct pushes to `main` and requires PR reviews.

**Step 1: Navigate to Branch Protection**

```
https://github.com/Absolute-Space-GHCP/ai-agents-gmaster-build/settings/branches
```

Or: Repository → Settings → Branches

**Step 2: Add Branch Protection Rule**

1. Click **"Add branch protection rule"**
2. Branch name pattern: `main`

**Step 3: Configure Protection Settings**

Enable these options:

| Setting                                       | Value | Purpose                       |
| --------------------------------------------- | ----- | ----------------------------- |
| ☑️ Require a pull request before merging      | On    | No direct pushes              |
| ☑️ Require approvals                          | 1     | At least 1 review needed      |
| ☑️ Dismiss stale pull request approvals       | On    | Re-review after new commits   |
| ☑️ Require review from Code Owners            | On    | CODEOWNERS file enforced      |
| ☑️ Require conversation resolution            | On    | All comments addressed        |
| ☑️ Require linear history                     | On    | Clean git history             |
| ☑️ Do not allow bypassing the above settings  | On    | Even admins must follow rules |
| ☑️ Restrict who can push to matching branches | On    | Only maintainers              |
| ☑️ Block force pushes                         | On    | Prevent history rewriting     |
| ☑️ Block deletions                            | On    | Cannot delete main            |

**Step 4: Save Changes**

Click **"Create"** or **"Save changes"**

---

### 1.4 CODEOWNERS Setup

The CODEOWNERS file automatically requests reviews from designated owners.

**File Location:** `.github/CODEOWNERS`

```
# CODEOWNERS - Automatically request reviews from maintainers
# https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners

# Default owner for all files
* @cmscholz222

# Specific folder owners (add as needed)
# /docs/ @cmscholz222
# /src/ @cmscholz222
```

When a PR is opened, GitHub automatically requests a review from the matching code owner.

---

## Part 2: For Team Members

### 2.1 Understanding the Workflow

Since you have **Read** access, you cannot push directly to the repository. Instead, you'll use the **Fork & Pull Request** workflow:

```
┌─────────────────────────────────────────────────────────────┐
│  1. FORK the repo to your account                           │
│  2. CLONE your fork locally                                 │
│  3. CREATE a feature branch                                 │
│  4. MAKE changes and commit                                 │
│  5. PUSH to your fork                                       │
│  6. OPEN a Pull Request to upstream main                    │
│  7. WAIT for review and approval                            │
│  8. MAINTAINER merges your PR                               │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.2 Step-by-Step Contribution Guide

#### Step 1: Fork the Repository

1. Go to: https://github.com/Absolute-Space-GHCP/ai-agents-gmaster-build
2. Click the **"Fork"** button (top right)
3. Select your personal account as the destination
4. Wait for the fork to complete

You now have: `https://github.com/YOUR-USERNAME/ai-agents-gmaster-build`

#### Step 2: Clone Your Fork

```bash
# Clone YOUR fork (not the original)
git clone https://github.com/YOUR-USERNAME/ai-agents-gmaster-build.git
cd ai-agents-gmaster-build

# Add the original repo as "upstream" for syncing
git remote add upstream https://github.com/Absolute-Space-GHCP/ai-agents-gmaster-build.git

# Verify remotes
git remote -v
# origin    https://github.com/YOUR-USERNAME/ai-agents-gmaster-build.git (fetch)
# origin    https://github.com/YOUR-USERNAME/ai-agents-gmaster-build.git (push)
# upstream  https://github.com/Absolute-Space-GHCP/ai-agents-gmaster-build.git (fetch)
# upstream  https://github.com/Absolute-Space-GHCP/ai-agents-gmaster-build.git (push)
```

#### Step 3: Keep Your Fork Updated

Before starting new work, sync with upstream:

```bash
# Fetch latest from upstream
git fetch upstream

# Switch to main branch
git checkout main

# Merge upstream changes
git merge upstream/main

# Push to your fork
git push origin main
```

#### Step 4: Create a Feature Branch

**Never work directly on main.** Always create a branch:

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Examples:
git checkout -b fix/dashboard-bug
git checkout -b feat/add-new-endpoint
git checkout -b docs/update-readme
```

#### Step 5: Make Changes and Commit

```bash
# Make your changes...

# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add new dashboard widget

- Added widget component
- Updated styles
- Added tests"
```

**Commit Message Format:**

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

#### Step 6: Push to Your Fork

```bash
git push origin feature/your-feature-name
```

#### Step 7: Open a Pull Request

1. Go to your fork on GitHub
2. You'll see a prompt: **"Compare & pull request"** - Click it
3. Or go to: Pull requests → New pull request

**Fill out the PR:**

```markdown
## Summary

Brief description of what this PR does.

## Changes

- Change 1
- Change 2
- Change 3

## Testing

How did you test these changes?

## Related Issues

Fixes #123 (if applicable)
```

4. Select:
   - **Base repository:** `Absolute-Space-GHCP/ai-agents-gmaster-build`
   - **Base branch:** `main`
   - **Head repository:** `YOUR-USERNAME/ai-agents-gmaster-build`
   - **Compare branch:** `feature/your-feature-name`

5. Click **"Create pull request"**

#### Step 8: Address Review Feedback

- Maintainer will review your PR
- If changes are requested:

```bash
# Make requested changes
git add .
git commit -m "fix: address review feedback"
git push origin feature/your-feature-name
```

- The PR updates automatically
- Once approved, maintainer will merge

---

### 2.3 Common Commands Reference

```bash
# Sync fork with upstream
git fetch upstream && git checkout main && git merge upstream/main && git push origin main

# Create new feature branch
git checkout -b feature/my-feature

# Check current branch
git branch

# View all remotes
git remote -v

# See status of changes
git status

# View commit history
git log --oneline -10

# Discard local changes (careful!)
git checkout -- .

# Delete local branch after PR merged
git checkout main && git branch -d feature/my-feature
```

---

## Part 3: PR Best Practices

### For Team Members (PR Authors)

1. **Keep PRs small and focused** - One feature/fix per PR
2. **Write clear descriptions** - Explain what and why
3. **Test your changes** - Before opening PR
4. **Respond promptly** - To review feedback
5. **Keep your branch updated** - Merge main if conflicts arise

### For Maintainers (Reviewers)

1. **Review within 24-48 hours** - Don't block progress
2. **Be constructive** - Explain why changes are needed
3. **Use suggestions** - GitHub's suggestion feature for small fixes
4. **Approve or request changes** - Don't leave PRs in limbo

---

## Part 4: Troubleshooting

### "Permission denied" when pushing

**Cause:** You're trying to push to the upstream repo, not your fork.

**Fix:** Check your remote:

```bash
git remote -v
# Make sure you're pushing to origin (your fork), not upstream
git push origin your-branch
```

### "Your branch is behind"

**Cause:** Upstream has new commits.

**Fix:** Sync your fork:

```bash
git fetch upstream
git checkout main
git merge upstream/main
git checkout your-branch
git rebase main
git push origin your-branch --force-with-lease
```

### PR shows "Cannot be merged"

**Cause:** Merge conflicts with main.

**Fix:** Resolve conflicts locally:

```bash
git fetch upstream
git checkout your-branch
git merge upstream/main
# Resolve conflicts in your editor
git add .
git commit -m "fix: resolve merge conflicts"
git push origin your-branch
```

### Can't find "Fork" button

**Cause:** You may already have a fork, or aren't logged in.

**Fix:**

- Check if you already forked: `github.com/YOUR-USERNAME/ai-agents-gmaster-build`
- Make sure you're logged into GitHub

---

## Quick Reference Card

### For Maintainers

```
Add member:     Settings → Collaborators → Add people → Read permission
Protect branch: Settings → Branches → Add rule → main
Review PR:      Pull requests → Select PR → Review changes
Merge PR:       Pull requests → Select PR → Merge pull request
```

### For Team Members

```
Fork:           Click "Fork" button on repo page
Clone:          git clone https://github.com/YOU/repo.git
Branch:         git checkout -b feature/name
Commit:         git add . && git commit -m "type: description"
Push:           git push origin feature/name
PR:             GitHub → Compare & pull request
```

---

**Questions?** Reach out to @cmscholz222 or post in `#dev-environment` Slack channel.
