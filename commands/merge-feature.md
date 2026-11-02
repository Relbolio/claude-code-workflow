---
description: Merge a validated feature branch into a target branch, resolve conflicts, and clean up
argument-hint: "<feature-branch> [into <target-branch>]  e.g. claude/feature/centralize-service-mappings into dev"
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git log:*), Bash(git diff:*), Bash(git checkout:*), Bash(git switch:*), Bash(git merge:*), Bash(git branch -d:*), Bash(git push:*), Bash(git fetch:*), Bash(git stash:*), Bash(git restore:*), Read, Grep, Glob
---

You are helping to safely merge a validated feature branch into a target branch. Always adhere to any rules or requirements set out in any CLAUDE.md files when responding.

User input: $ARGUMENTS

## CRITICAL SAFETY RULES

- **NEVER force push** (`--force`, `-f`) to `main` or `dev` or`master` or`preprod`
- **NEVER delete `main` or `dev` or `master` or `preprod` branches**
- **NEVER use `git reset --hard`** without explicit user approval
- **ALWAYS ask for user confirmation** before: merging, pushing to remote, deleting branches
- **NEVER proceed silently** on conflicts — show them and ask the user how to resolve
- If anything looks wrong, STOP and explain the situation to the user

## Step 1. Parse arguments

From `$ARGUMENTS`, extract:

1. `feature_branch` — the branch to merge (required, but if it's not mentionned take the current branch but ask user to confirm)
2. `target_branch` — the branch to merge into (optional, defaults to `dev`)

Examples:

- `claude/feature/my-feature` → merge into `dev`
- `claude/feature/my-feature into main` → merge into `main`
- `claude/feature/my-feature into dev` → merge into `dev`

If `feature_branch` cannot be determined, ask the user to clarify.

## Step 2. Pre-flight checks

Run ALL of these checks before proceeding. If any fail, STOP and inform the user.

1. **Verify working directory is clean**
   - Run `git status`
   - If there are uncommitted changes, ask the user to commit or stash them first
   - Do NOT auto-stash — let the user decide

2. **Verify both branches exist**
   - Run `git branch -a` and confirm `feature_branch` and `target_branch` exist
   - If the feature branch does not exist, list available branches and ask the user to pick one

3. **Verify the feature branch has commits ahead of target**
   - Run `git log <target_branch>..<feature_branch> --oneline`
   - If no commits, inform the user there is nothing to merge and STOP

4. **Show merge summary to the user**
   - Number of commits to merge
   - Files changed: `git diff --stat <target_branch>...<feature_branch>`
   - Any potential conflicts: `git merge --no-commit --no-ff <feature_branch>` then `git merge --abort` (dry-run)

Display this summary clearly and **ask the user to confirm before proceeding**.

## Step 3. Fetch latest remote state

```
git fetch origin
```

Check if the target branch is behind its remote counterpart:

- `git log <target_branch>..origin/<target_branch> --oneline`
- If behind, inform the user and suggest pulling first. Ask for confirmation before pulling.

## Step 4. Perform the merge

1. Switch to the target branch: `git switch <target_branch>`
2. Merge with a descriptive commit message:
   ```
   git merge --no-ff <feature_branch> -m "merge: <feature_branch> into <target_branch>"
   ```
   Using `--no-ff` to preserve branch history.

### If conflicts occur:

1. List all conflicted files: `git diff --name-only --diff-filter=U`
2. For EACH conflicted file:
   - Show the conflict markers and surrounding context
   - Explain what each side (ours vs theirs) contains
   - **Ask the user which resolution to apply**: keep ours, keep theirs, or manual merge
3. After resolving all conflicts:
   - Show the final state of resolved files
   - Ask user to confirm the resolution before committing
4. Complete the merge: `git add <resolved-files>` then `git commit`

### If merge succeeds cleanly:

- Show the merge commit hash and summary
- Proceed to Step 5

## Step 5. Post-merge verification

1. Run `git log --oneline -5` to show recent history
2. Run `git diff --stat HEAD~1` to show what changed in the merge commit
3. Show the result clearly to the user

## Step 6. Push to remote (ask first)

Ask the user: **"Push `<target_branch>` to remote?"**

- Only push if user says yes
- Use `git push origin <target_branch>` (never force push)
- If push fails, explain why and ask user how to proceed

## Step 7. Clean up feature branch (ask first)

Ask the user: **"Delete the feature branch `<feature_branch>`?"**

- Only delete if user confirms
- Delete local: `git branch -d <feature_branch>` (safe delete, will fail if not fully merged)
- Ask separately: **"Also delete the remote branch?"**
  - If yes: `git push origin --delete <feature_branch>`

## Output format

At each major step, display a clear status:

```
── Step N: <Step Title> ──────────────────
<status or result>
```

At the end, show a final summary:

```
── Merge Complete ──────────────────────
✓ Merged: <feature_branch> → <target_branch>
✓ Commits merged: <count>
✓ Files changed: <count>
✓ Pushed to remote: yes/no
✓ Feature branch deleted: yes/no
```
