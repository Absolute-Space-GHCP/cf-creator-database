> **Version:** 1.0.0-clean | **Date:** 2026-01-28 | **Repo:** ai-agents-gmaster-build

# Git Sync & Push Guide for Beginners

**Created:** December 10, 2025  
**Author:** Charley Scholz  
**Purpose:** Step-by-step guide for syncing local changes to GitHub

---

## 📚 Overview

This guide explains how to push local project changes to a GitHub repository when:

- Your local folder isn't connected to git (no `.git` folder)
- The GitHub repo already exists with previous commits
- You want to preserve git history

---

## 🎯 When to Use This Process

Use this when you see this error:

```bash
git status
fatal: not a git repository (or any of the parent directories): .git
```

This happens when:

- You renamed/moved a folder and the `.git` directory didn't come with it
- You copied files from another location
- You're working with a fresh export/download

---

## 📋 Prerequisites

Before starting, you need:

- [ ] Git installed (`git --version` to check)
- [ ] GitHub account with repo access
- [ ] The GitHub repo URL (e.g., `https://github.com/org/repo-name.git`)
- [ ] Your local folder with the updated code

---

## 🚀 Step-by-Step Process

### Step 1: Navigate to Parent Directory

Go to the folder CONTAINING your project folder:

```bash
cd /path/to/parent/directory
```

**Example:**

```bash
cd /Users/charleymm/dev/ai-agents-and-apps-dev
```

**Verify:** Run `ls` to confirm you can see your project folder.

---

### Step 2: Clone the Existing GitHub Repo

Clone the repo into a temporary folder:

```bash
git clone https://github.com/YOUR-ORG/YOUR-REPO.git temp-repo
```

**Example:**

```bash
git clone https://github.com/YOUR-ORG/YOUR-REPO.git temp-repo
```

**What this does:**

- Downloads the entire repo including `.git` folder
- Preserves all commit history
- Creates a `temp-repo` folder

**Expected output:**

```
Cloning into 'temp-repo'...
remote: Enumerating objects: 130, done.
remote: Counting objects: 100% (130/130), done.
...
Resolving deltas: 100% (65/65), done.
```

---

### Step 3: Copy Your Files to the Cloned Repo

Use `rsync` to copy files while excluding unnecessary folders:

```bash
rsync -av --exclude='node_modules' --exclude='.git' YOUR-PROJECT-FOLDER/ temp-repo/
```

**Example:**

```bash
rsync -av --exclude='node_modules' --exclude='.git' your-project-folder/ temp-repo/
```

**Important flags explained:**
| Flag | Meaning |
|------|---------|
| `-a` | Archive mode (preserves permissions, timestamps) |
| `-v` | Verbose (shows files being copied) |
| `--exclude='node_modules'` | Skip node_modules (large, not needed in git) |
| `--exclude='.git'` | Don't overwrite the .git folder from clone |

**Note the trailing slashes!**

- `source-folder/` = copy CONTENTS of folder
- `source-folder` = copy the folder itself

---

### Step 4: Check Git Status

Navigate into the repo and see what changed:

```bash
cd temp-repo
git status
```

**Expected output:**

```
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
    modified:   README.md
    modified:   src/index.js
    ... (list of changed files)

Untracked files:
    docs/NEW_FILE.md
    ... (list of new files)
```

**Understanding the output:**

- `modified:` = Files that existed and were changed
- `Untracked files:` = Brand new files

---

### Step 5: Stage All Changes

Add all changes to git's staging area:

```bash
git add -A
```

**What `-A` does:**

- Stages ALL changes (new, modified, deleted files)
- Alternative: `git add .` (stages new and modified, not deleted)

**Verify with:** `git status` - files should now be green

---

### Step 6: Commit with a Descriptive Message

Create a commit with a clear message:

```bash
git commit -m "v1.0.0 - Brief description

- Bullet point of major change 1
- Bullet point of major change 2
- Bullet point of major change 3"
```

**Commit message best practices:**

- First line: Short summary (50 chars or less)
- Blank line
- Body: Detailed bullet points
- Use present tense ("Add feature" not "Added feature")
- Reference ticket numbers if applicable

---

### Step 7: Push to GitHub

Send your commits to the remote repository:

```bash
git push origin main
```

**What this means:**

- `origin` = The remote repository (GitHub)
- `main` = The branch name (could be `master` on older repos)

**Expected output:**

```
Enumerating objects: 85, done.
Counting objects: 100% (85/85), done.
...
To https://github.com/org/repo.git
   e95c307..7bf453f  main -> main
```

**Success!** Your changes are now on GitHub.

---

### Step 8: Cleanup (Optional)

Replace your original folder with the git-connected one:

```bash
# Go back to parent directory
cd ..

# Remove the folder without git
rm -rf your-project-folder

# Rename temp-repo to your project name
mv temp-repo your-project-folder
```

**Example:**

```bash
cd /path/to/parent/directory
rm -rf your-project-folder
mv temp-repo your-project-folder
```

**Verify git is connected:**

```bash
ls -la your-project-folder/.git
```

Should show the `.git` directory contents.

---

## 🔧 Common Issues & Solutions

### Issue: "Permission denied"

```bash
git push origin main
remote: Permission denied
```

**Solution:** Check your GitHub authentication:

```bash
git config --global user.name
git config --global user.email
```

You may need to set up a Personal Access Token or SSH key.

---

### Issue: "Updates were rejected"

```bash
git push origin main
! [rejected] main -> main (non-fast-forward)
```

**Solution:** Someone else pushed changes. Pull first:

```bash
git pull origin main
# Resolve any conflicts
git push origin main
```

---

### Issue: "Large files detected"

```bash
remote: error: File X is 123.45 MB; this exceeds GitHub's limit
```

**Solution:** Add large files to `.gitignore`:

```bash
echo "large-file.zip" >> .gitignore
git rm --cached large-file.zip
git commit -m "Remove large file"
git push origin main
```

---

## 📝 Quick Reference Card

```bash
# Full process in 8 commands:

cd /parent/directory                              # 1. Go to parent
git clone https://github.com/org/repo.git temp   # 2. Clone repo
rsync -av --exclude='node_modules' --exclude='.git' project/ temp/  # 3. Copy files
cd temp                                           # 4. Enter repo
git add -A                                        # 5. Stage changes
git commit -m "Description"                       # 6. Commit
git push origin main                              # 7. Push
cd .. && rm -rf project && mv temp project        # 8. Cleanup
```

---

## 🎓 Git Concepts for Beginners

### What is `.git`?

The hidden `.git` folder contains:

- Complete history of all commits
- Branch information
- Remote repository URLs
- Configuration settings

Without `.git`, a folder is just files - not a git repository.

### What is `origin`?

`origin` is the default name for the remote repository (GitHub). It's like a bookmark pointing to the URL.

View your remotes:

```bash
git remote -v
```

### What is a commit?

A commit is a snapshot of your project at a point in time. Each commit has:

- Unique ID (hash like `7bf453f`)
- Author
- Timestamp
- Message
- Changes from previous commit

### What is staging?

Staging (`git add`) is like preparing a package before shipping:

1. **Working directory** → Your actual files
2. **Staging area** → Files ready to commit
3. **Repository** → Committed history

---

## 📚 Additional Resources

- [GitHub Docs](https://docs.github.com)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [Interactive Git Tutorial](https://learngitbranching.js.org)

---

_Document Version: 1.0_  
_Last Updated: December 10, 2025_
