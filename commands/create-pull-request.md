---
description: Create a pull request from the current feature branch. Analyzes all commits, generates a structured PR with summary, change details, and test plan. Asks for confirmation before creating.
argument-hint: "[into <target-branch>]  e.g. 'into main' or 'into dev' (defaults to main)"
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git log:*), Bash(git diff:*), Bash(git push:*), Bash(git fetch:*), Bash(git remote:*), Bash(gh pr:*), Bash(gh api:*), Read, Glob, Grep
---

# Create Pull Request — Structured PR Generator

You are helping to create a well-structured pull request from the current feature branch. Always adhere to any rules or requirements set out in any CLAUDE.md files when responding.

User input: $ARGUMENTS

## CRITICAL SAFETY RULES

- **NEVER force push** (`--force`, `-f`)
- **ALWAYS ask for user confirmation** before: pushing to remote, creating the PR
- **NEVER create a PR without showing the summary to the user first**
- If anything looks wrong, STOP and explain the situation to the user

---

## Step 1. Parse arguments

From `$ARGUMENTS`, extract:

1. `target_branch` — the branch to merge into (optional, defaults to `dev`)

Examples:

- _(empty)_ → PR into `main`
- `into dev` → PR into `dev`
- `into main` → PR into `main`

## Step 2. Pre-flight checks

Run ALL of these checks. If any fail, STOP and inform the user.

### 2.1 Verify working directory

- Run `git status`
- If there are **uncommitted changes**, warn the user:
  ```
  ⚠ You have uncommitted changes. Do you want to:
    A) Commit them first (recommended)
    B) Continue without them (they won't be in the PR)
    C) Abort
  ```
- Wait for user response before continuing

### 2.2 Verify current branch

- Get the current branch name: `git branch --show-current`
- If on `main`, `master`, `dev`, or `preprod` → STOP: "You are on `<branch>`. Switch to a feature branch first."
- Store `feature_branch` = current branch name

### 2.3 Verify target branch exists

- Run `git fetch origin`
- Check that `target_branch` exists locally or on remote
- If not found, list available branches and ask the user to pick one

### 2.4 Verify commits ahead

- Run `git log origin/<target_branch>..<feature_branch> --oneline`
- If no commits ahead → STOP: "No commits to include in the PR. Nothing to do."
- Store the commit list for later

### 2.5 Check for existing PR

- Run `gh pr list --head <feature_branch> --base <target_branch> --state open`
- If a PR already exists, inform the user:

  ```
  ⚠ An open PR already exists for this branch:
    #<number> — <title>
    <url>

  Do you want to:
    A) Update the existing PR description
    B) Continue and create a new PR anyway
    C) Abort
  ```

## Step 3. Analyze changes

### 3.1 Gather commit history

```
git log origin/<target_branch>..<feature_branch> --oneline
git log origin/<target_branch>..<feature_branch> --format="%h %s"
```

### 3.2 Gather file changes

```
git diff --stat origin/<target_branch>...<feature_branch>
git diff origin/<target_branch>...<feature_branch> --name-only
```

### 3.3 Analyze the diff

Read the actual diff to understand WHAT changed and WHY:

```
git diff origin/<target_branch>...HEAD
```

For large diffs, focus on:

- New files created
- Significant modifications to existing files
- Deleted files
- Configuration changes

### 3.4 Check for related context

Look for context that enriches the PR description:

- If a spec file exists in `_specs/` matching the branch name → read it for context
- If a plan file exists in `_plans/` matching the branch name → read it for context
- If the branch name contains a feature slug → check `userStories/` for related stories

## Step 4. Generate PR content

### 4.1 Derive PR title

- Extract from the branch name or the most significant commit message
- Keep under **70 characters**
- Use present tense, descriptive
- Format: `[type]: concise description`
  - `feat: add user registration flow`
  - `fix: resolve calendar timezone offset`
  - `refactor: extract shared payment components`

### 4.2 Draft PR body

Use this structure:

```markdown
## Summary

[2-4 bullet points describing WHAT this PR does and WHY. Focus on the user-facing impact, not implementation details.]

## Changes

### [Category 1 — e.g., New screens, Data layer, Components]

- [Concrete change 1]
- [Concrete change 2]

### [Category 2]

- [Concrete change]

[Group changes logically. Categories might include:]
[- New screens/pages]
[- Data models / services]
[- State management]
[- Shared components]
[- Configuration / routing]
[- i18n / translations]
[- Bug fixes]
[- Refactoring]

## Spec / User Stories

[If a spec or user stories were found, reference them:]

- Spec: `_specs/<name>.md`
- User stories: US-NNN, US-NNN

[If none found, omit this section]

## Screenshots / Wireframes

[If the changes include UI work and wireframes exist, mention:]

- See wireframe: `wireframes/<name>.html`

[If no visual changes, omit this section]

## Test plan

- [ ] [Concrete test step 1 — what to verify and how]
- [ ] [Concrete test step 2]
- [ ] [Concrete test step 3]
- [ ] Build succeeds without errors
- [ ] No lint/analyze warnings introduced

## Notes

[Any additional context, known limitations, follow-up work needed]
[If none, omit this section]
```

### Writing rules for the PR body

- **Summary** answers "what does this PR accomplish for the user/product?"
- **Changes** lists concrete modifications grouped logically — not a copy of git log
- **Test plan** must be actionable — a reviewer should know exactly what to test
- **No code snippets** in the PR body — the diff is the code
- Keep the total body under ~40 lines — concise but complete

## Step 5. Present to user for confirmation

Display the full PR to the user:

```
── Pull Request Preview ──────────────────

Branch: <feature_branch> → <target_branch>
Commits: <count>
Files changed: <count>

Title: <pr_title>

Body:
<pr_body>

──────────────────────────────────────────

Create this PR? (yes / edit title / edit body / abort)
```

- **If "yes"** → proceed to Step 6
- **If "edit title"** → ask for new title, re-show preview
- **If "edit body"** → ask what to change, re-show preview
- **If "abort"** → stop

## Step 6. Push and create PR

### 6.1 Push to remote

Check if the branch is already pushed:

```
git ls-remote --heads origin <feature_branch>
```

If not pushed or behind:

```
git push -u origin <feature_branch>
```

### 6.2 Create the PR

```bash
gh pr create --base <target_branch> --head <feature_branch> --title "<pr_title>" --body "$(cat <<'EOF'
<pr_body>
EOF
)"
```

### 6.3 Handle errors

- If `gh` is not installed → inform the user and provide the manual URL:
  `https://github.com/<owner>/<repo>/compare/<target_branch>...<feature_branch>`
- If auth fails → suggest `gh auth login`
- If PR creation fails for any reason → show the error and suggest alternatives

## Step 7. Post-creation summary

```
── Pull Request Created ──────────────────
✓ Branch: <feature_branch> → <target_branch>
✓ Title: <pr_title>
✓ PR: <pr_url>
✓ Commits: <count>
✓ Files changed: <count>

Next steps:
  - Share the PR link for review
  - After approval, use /merge-feature to merge
──────────────────────────────────────────
```

## Important rules

- **PROJECT-AGNOSTIC** — works for any git-hosted project (GitHub, with `gh` CLI)
- **Always show preview** before creating — never auto-create a PR
- **Analyze ALL commits** — not just the latest. The PR summary must reflect the full branch work.
- **Spec-aware** — if `_specs/` or `_plans/` or `userStories/` exist, reference them in the PR
- **Concise but complete** — the PR body should help a reviewer understand the change quickly
- **Test plan is mandatory** — every PR must have actionable test steps
- **Follow CLAUDE.md** — respect any commit/PR conventions defined in the project
- **No force push** — never use `--force` when pushing
- **Handle edge cases** — uncommitted changes, existing PRs, missing remote, `gh` not installed
