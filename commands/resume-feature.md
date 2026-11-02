---
description: Generate a structured summary of an implemented feature. Analyzes the spec, plan, git history, and actual code to produce a comprehensive resume in `_resumes/`. This resume serves as persistent context for future development — understanding what was built, how, and what decisions were made. Logical follow-up to create-feature-spec and create-impl-plan. Adapts to any tech project.
argument-hint: "[Optional: feature name, spec path, plan path, or leave empty for auto-detection from current branch]"
allowed-tools: Read, Write, Glob, Grep, Bash(git log:*), Bash(git diff:*), Bash(git branch:*), Bash(git show:*), Bash(git status:*), Bash(ls:*), Bash(mkdir:*), Bash(wc:*), Agent(Explore)
---

# Resume Feature — Implementation Summary Generator

You generate a structured summary of a completed (or in-progress) feature implementation. This summary captures what was built, how, what works, what decisions were made, and what's left to do. It serves as **persistent context** for future development sessions.

**Workflow position:** `create-feature-spec` → `create-impl-plan` → **`resume-feature`**

**User input:** $ARGUMENTS

---

## Phase 0 — Project analysis (ALWAYS do this first)

### 0.1 Identify the project

1. **Read CLAUDE.md** (if exists) — project name, stack, architecture, conventions
2. **Identify the framework** from config files (`package.json`, `pubspec.yaml`, `Cargo.toml`, etc.)
3. **Identify the project language** (French, English, etc.) from existing docs — write the resume in the same language

### 0.2 Identify the feature to summarize

**If $ARGUMENTS is provided:**
- If it's a file path → read it (spec or plan) and derive the feature name
- If it's a feature name → look for matching spec/plan files
- If it's a branch name → use it directly

**If $ARGUMENTS is empty (auto-detect):**
1. `git branch --show-current` → extract feature name from branch
2. Look for: `_specs/<feature>*`, `_plans/<feature>*`

### 0.3 Gather all sources

Collect everything available for this feature:

| Source | How to find | Purpose |
|--------|-------------|---------|
| **Spec** | `_specs/<feature>.md` | What was planned — requirements, user stories, scope |
| **Plan** | `_plans/<feature>.md` | How it was planned — steps, file list, dependencies |
| **Git history** | `git log --oneline` on the feature branch | What was actually done — commits, progression |
| **Changed files** | `git diff main...HEAD --stat` (or base branch) | What files were created/modified |
| **Current code** | Read key files | What the implementation looks like now |

Read the spec and plan in full. They are essential for comparing intent vs reality.

---

## Phase 1 — Analyze the implementation

### 1.1 Git history analysis

```
git log --oneline <base-branch>..HEAD
```

From the commit history:
- Count total commits
- Identify major milestones (feature commits vs fix commits vs refactors)
- Note any bug fixes that reveal issues encountered during implementation
- Identify the chronological progression of work

### 1.2 File inventory

```
git diff <base-branch>...HEAD --stat
```

Categorize all changed/created files:
- **New files**: created from scratch
- **Modified files**: existing files that were changed
- Group by layer/module (backend, frontend, config, tests, docs, etc.)

### 1.3 Plan completion check

If a plan exists (`_plans/<feature>.md`), check each step:
- Read the plan's implementation steps
- For each step, verify if the corresponding files exist and are implemented (not stubs)
- Mark each step as: DONE, PARTIAL, or NOT DONE
- Note any deviations from the plan (steps added, changed, or skipped)

### 1.4 Spec compliance check

If a spec exists (`_specs/<feature>.md`), check:
- Which user stories / acceptance criteria are covered
- Which are partially covered or missing
- Any scope changes (features added or removed vs original spec)

### 1.5 Code quality scan

Quick scan of the implementation:
- Are there any `TODO`, `FIXME`, `HACK`, or `PLACEHOLDER` comments left?
- Are there any obvious stub/empty implementations?
- Do builds pass? (check if there's a recent build output or run a quick check)

---

## Phase 2 — Identify architectural decisions and learnings

From the git history, code, and any deviations from the plan, identify:

1. **Decisions made**: choices that weren't obvious from the spec/plan
   - Why was a particular approach chosen?
   - Were there trade-offs?
2. **Problems encountered**: bugs fixed during implementation (visible from fix commits)
   - What went wrong?
   - What was the root cause?
   - How was it fixed?
3. **Deviations from plan**: anything that changed during implementation
   - Steps reordered, added, or skipped
   - Scope changes
   - Architecture adjustments
4. **Dependencies discovered**: things that need to exist for this feature to work
   - External packages added
   - Config changes required
   - Environment variables needed

---

## Phase 3 — Write the resume

Create the resume file using this structure:

```markdown
# Resume — [Feature Title]

**Date:** [YYYY-MM-DD]
**Branch:** `[branch name]`
**Status:** [Complete | In Progress | Partial]
**Spec:** `[spec path or "N/A"]`
**Plan:** `[plan path or "N/A"]`

---

## Overview

[2-4 sentences: what this feature does, why it was built, and its current state.
This should be understandable by someone who has never seen the project.]

---

## What was built

### Backend
[List what was implemented on the backend, grouped by module/layer:]
- **[Module/Layer]**: [brief description of what was added/changed]
  - `path/to/file.ts` — [what this file does]
  - `path/to/file.ts` — [what this file does]

### Frontend
[Same structure for frontend]

### Configuration / Infrastructure
[Any config, env, migration, or infra changes]

### Documentation
[Any docs, specs, or plans created/updated]

---

## API Endpoints

[If applicable — list all endpoints created/modified by this feature:]

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /auth/register | Public | Register new user |
| ... | ... | ... | ... |

---

## Key files

[The 5-10 most important files for understanding this feature, with brief descriptions:]

| File | Role |
|------|------|
| `path/to/file` | [What it does and why it matters] |

---

## Decisions & trade-offs

[Numbered list of notable decisions made during implementation:]

1. **[Decision title]**: [What was decided and why]
2. ...

---

## Problems encountered & fixes

[Issues discovered during implementation — valuable context for future work:]

1. **[Problem title]**: [What happened, root cause, how it was fixed]
2. ...

---

## Plan completion

[If a plan existed, show completion status:]

| Step | Title | Status | Notes |
|------|-------|--------|-------|
| 1 | [Step title] | DONE / PARTIAL / SKIPPED | [Any deviation from plan] |
| ... | ... | ... | ... |

**Plan adherence:** [X/Y steps completed as planned, N deviations]

---

## Spec coverage

[If a spec/user stories existed, show coverage:]

| User Story | Status | Notes |
|------------|--------|-------|
| US-XXX: [title] | Covered / Partial / Not covered | [details] |

---

## Remaining work

[What is NOT yet done, if anything:]

- [ ] [Task 1 — what and why]
- [ ] [Task 2 — what and why]

[If everything is done, write: "All planned work is complete."]

---

## Dependencies & prerequisites

[What this feature requires to function correctly:]

- **Packages**: [any packages installed]
- **Environment variables**: [any env vars needed]
- **Database**: [any migrations or schema changes]
- **External services**: [any third-party APIs or services]
- **Other features**: [any features this depends on]

---

## Impact on existing code

[What existing code was modified and how — important for understanding side effects:]

- `path/to/modified/file` — [what changed and why]

---

## Stats

- **Commits:** [N]
- **Files created:** [N]
- **Files modified:** [N]
- **Lines added:** ~[N]
- **Lines removed:** ~[N]
```

### Writing rules

- **Adapt the template**: omit sections that don't apply (e.g., no "API Endpoints" for a purely frontend feature, no "Frontend" for a backend-only feature)
- **Be factual**: describe what IS, not what should be. Reference actual files and code.
- **Include paths**: always use relative file paths so they can be navigated
- **Capture decisions**: the most valuable part of a resume is WHY things were done a certain way — this context is lost if not written down
- **Note problems**: bugs and fixes encountered during implementation are critical context for future work on the same area
- **Match project language**: if the project docs are in French, write the resume in French. If English, write in English.
- **Keep it scannable**: use tables, bullet points, and short paragraphs. Someone should be able to skim it in 2 minutes.

---

## Phase 4 — Save and report

1. Create `_resumes/` directory if it doesn't exist
2. Save the resume to `_resumes/<feature-slug>.md`
3. Output a short summary to the user:

```
Resume saved: _resumes/<feature-slug>.md
Feature: <feature title>
Status: <Complete | In Progress | Partial>
Stats: <N commits, N files created, N files modified>
Plan completion: <X/Y steps>
Remaining work: <N items or "None">
```

Do NOT repeat the full resume in chat unless the user asks to see it.

---

## Important rules

- **PROJECT-AGNOSTIC**: this command works for any tech project. Discover conventions from the codebase.
- **Always analyze the project first** (Phase 0). The resume quality depends on understanding the context.
- **Read real files**: the resume must reflect actual code, not assumptions. Verify file existence before listing them.
- **Git is the source of truth**: use git history and diffs to understand what was actually done.
- **Capture the WHY**: decisions, trade-offs, and problems are more valuable than a file list. Future developers (or AI agents) benefit most from understanding context and intent.
- **Don't fabricate**: if you can't determine something (e.g., why a decision was made), say so or omit it. Don't guess.
- **Follow CLAUDE.md**: any project-specific rules override defaults in this command.
- **This is a post-implementation artifact**: it documents what WAS done, not what should be done. Keep tenses in past/present.
