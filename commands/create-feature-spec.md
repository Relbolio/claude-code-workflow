---
description: Create a feature spec file and git branch from a short idea. Analyzes the project context (architecture, existing code, agents, wireframes, user stories) to produce a detailed, implementation-ready spec. Adapts to any tech project.
argument-hint: "[Short feature description, optionally: 'figma: <component-link>', 'design: <design-tool-link>']"
allowed-tools: Read, Write, Glob, Grep, Bash(git switch:*), Bash(git branch:*), Bash(git status:*), Bash(git worktree:*), Bash(git rev-parse:*), Bash(git log:*), Bash(git config:*), Bash(ls:*), Agent(Explore), Agent(design-ui), Agent(figma-design-extractor)
---

# Create Feature Spec — Spec-Driven Feature Bootstrapper

You receive a short feature idea as input. You must analyze the project, produce a detailed feature spec, create a git branch, and save the spec file.

**User input:** $ARGUMENTS

---

## Phase 0 — Project analysis (ALWAYS do this first)

Before anything else, analyze the current project to understand its context:

### 0.1 Identify the project

1. **Read CLAUDE.md** at the project root (if it exists) to understand:
   - Project name, type, and stack
   - Architecture pattern and conventions
   - File naming conventions
   - Critical rules to follow
2. **Check for architecture docs** — look for files matching `specs/*ARCHITECTURE*` or `docs/architecture*`
3. **Check for existing specs** — look for `_specs/`, `specs/`, or `docs/specs/` directories
4. **Check for user stories** — look for `userStories/` or `user-stories/` directories
5. **Check for wireframes** — look for `wireframes/` directory
6. **Check for a spec template** — look for `_specs/template.md` or similar

### 0.2 Identify available agents

Check `.claude/agents/` for available specialized agents:
- **UI/Design agent** (e.g., `design-ui*.md`) — for extracting design context
- **Figma extractor agent** (e.g., `figma-design-extractor*.md`) — for Figma integration
- **Code review agent** — for validation
- **Image generation agent** — for asset creation
- Note their names for later delegation references in the spec

### 0.3 Identify the tech stack

From CLAUDE.md, architecture docs, or project files (`pubspec.yaml`, `package.json`, `Cargo.toml`, `go.mod`, etc.):
- Framework (Flutter, React, Vue, etc.)
- State management (Riverpod, Redux, Pinia, etc.)
- Backend (Firebase, Supabase, custom API, etc.)
- Routing library
- Component naming convention (prefix like `Bm*`, `Pk*`, etc.)
- i18n approach

### 0.4 Catalog existing code

Quick scan to understand what's already built:
- Existing features (`features/`, `src/features/`, `app/`, etc.)
- Shared/reusable components
- Data models
- Services/repositories
- Routes already defined
- Existing providers/state

**Store all findings mentally — they will inform the spec content.**

## Phase 1 — Pre-flight checks

### 1.1 Check git status

Check the current Git branch and working directory status (`git rev-parse --abbrev-ref HEAD`, `git status --porcelain`). A dirty working tree (uncommitted, unstaged, or untracked files) does **NOT** abort outright — it is a **trigger to use a worktree** (Phase 1.3, case 2), which leaves the current working directory untouched. Only abort, asking the user to commit or stash, if neither an isolated worktree nor a clean branch switch is viable.

### 1.2 Parse arguments

From `$ARGUMENTS`, extract:

1. **`feature_title`** — A short, human-readable title in Title Case
2. **`feature_slug`** — A git-safe kebab-case slug (lowercase, `a-z0-9-`, max 40 chars)
3. **`branch_name`** — Format: `claude/feature/<feature_slug>` (append `-01`, `-02` if taken)
4. **`design_hint`** (optional) — If `$ARGUMENTS` contains `figma:` or `design:`, extract the URL

If you cannot infer a sensible title/slug, ask the user to clarify.

### 1.3 Decide isolation — branch in place vs git worktree

Inspect the Git state: `git rev-parse --abbrev-ref HEAD` (current branch), `git status --porcelain` (clean/dirty), `git worktree list` (concurrent worktrees), `git branch` (other feature branches). Identify the **base branch** (default branch — usually `master` or `main`).

Decide how to isolate the work:

1. **User explicitly mentions "worktree"** in the input → create a worktree.
2. **Working tree is dirty, OR the current branch is a non-default branch with work in progress, OR other feature branches / worktrees are active** → a plain branch switch would disturb that work. Create a worktree based on the base branch instead (leaves the current working dir untouched).
3. **Clean working tree on the base branch with no concurrent work** → a simple in-place branch switch is enough (no worktree needed).
4. **Unsure** → ask the user (isolated worktree vs in-place branch).

Record the decision and carry `worktree_path` (a path, or "none") into Phase 3.

## Phase 2 — Pull design context (if applicable)

### If the project has wireframes AND a design agent

**If `design_hint` is present:**
- If a Figma extractor agent exists → use it to analyze the Figma link
- If a design-ui agent exists → pass the link and ask it to:
  1. Cross-reference with existing wireframes and design system
  2. Identify reusable shared components
  3. Extract layout, spacing, colors, typography tokens, component states

**If no `design_hint`:**
- If a design-ui agent exists → ask it to:
  1. Check wireframes for screens matching the feature description
  2. Identify which existing shared components apply
  3. Derive design guidance from the established design system

Summarize findings as 3-8 concise bullet points.

### If no design agent or wireframes exist

Record a note:
- `"No design reference available. UI implementation will need design direction from the team or a wireframe to be created first."`

Check if the project has a theme/design system (`config/theme/`, `styles/`, `tailwind.config.*`, etc.) and reference any relevant tokens.

## Phase 3 — Create the branch (worktree or in place)

Based on the Phase 1.3 decision:

**Worktree path** (cases 1 & 2):
- Base off the **local** base branch (it may be ahead of `origin`): `git worktree add -b <branch_name> ".claude/worktrees/<feature_slug>" <base_branch>`
- Switch the session into it with the `EnterWorktree` tool (`path: .claude/worktrees/<feature_slug>`). It will prompt for confirmation — that is expected.
- Set `worktree_path = .claude/worktrees/<feature_slug>`.

**In-place branch** (case 3):
- `git switch -c <branch_name>`.
- Set `worktree_path = "aucun (repo principal)"`.

If the branch already exists, append a version suffix (`-01`, `-02`).

## Phase 4 — Draft the spec content

### 4.1 Check for a spec template

If `_specs/template.md` exists, use its exact structure. Otherwise, use this universal structure:

```markdown
# [Feature Title]

## Status: Draft

> **Branche :** `<branch_name>`
> **Worktree :** `<worktree_path>`  (`aucun (repo principal)` si branche in-place)
> **Genere le :** <YYYY-MM-DD>

## Context

[2-4 sentences explaining:
- What feature is being implemented and why
- Which user stories it covers (reference by ID if user stories exist)
- What prerequisites are needed (existing features, models, services)
- Current state of the code relevant to this feature]

**Etat actuel du code** :

[Detailed inventory of existing code relevant to this feature:]
- **Modeles existants** : [List models with key fields, from data/models/ or equivalent]
- **Services existants** : [List services with key methods]
- **Providers/State existants** : [List relevant state management]
- **Routes existantes** : [List routes already defined]
- **Composants partages disponibles** : [List reusable components that can be used]
- **Composants manquants** : [List components that need to be created]
- **Ecrans existants** : [List stub/placeholder screens if any]

**Prerequis** : [What must be in place before this feature can be built]

## User Stories

[For each user story covered by this feature, include:]

### US-[NNN] : [Title]

**En tant que** [role]
**Je veux** [action]
**Afin de** [value]

#### Criteres d'acceptation

- CA1 : [Concrete criterion]
  - Faux si : [observation concrete et reproductible qui prouverait ce critere VIOLE]
- CA2 : [Concrete criterion]
  - Faux si : [...]
[...]

[Repeat for all user stories. If user stories exist in userStories/, copy them verbatim. If not, derive them from the feature description.]

## Design Reference

[If design context was pulled in Phase 2, include it here:]

### Ecran(s) concernes
- [List wireframe screens or Figma frames]

### Specifications visuelles
- [Layout and spacing details]
- [Colors and typography tokens]
- [Reusable components to leverage]
- [New components to create]
- [Theme mode considerations (dark/light)]
- [Responsive/tablet considerations]

[If no design reference, note it explicitly]

## Scope

### In scope
- [Concrete deliverable 1]
- [Concrete deliverable 2]
[...]

### Out of scope
- [What this feature does NOT cover]
- [Deferred to future work]

## Technical Notes

- [Implementation hints relevant to the chosen architecture]
- [Edge cases to handle]
- [Performance considerations]
- [Security considerations]
- [i18n keys to add]
- [Dependencies to install]

## Agent Delegation

[If specialized agents are available in the project, note which tasks should be delegated:]

| Agent | Tasks |
|---|---|
| **[agent-name]** | [What this agent should handle] |

[If no agents are available, omit this section]
```

### 4.2 Writing rules

- **Include REAL code inventory** — the "Etat actuel du code" section must reflect actual existing files, not hypothetical ones. Use the project analysis from Phase 0.
- **Reference real user stories** — if `userStories/` exists, read and copy the relevant user stories. Don't paraphrase or abbreviate them.
- **Reference real components** — list actual shared components that exist in the project, not generic ones.
- **No code examples** — the spec describes WHAT to build, not HOW. Implementation details belong in the plan.
- **Falsifiable, not just testable** — every acceptance criterion carries a `Faux si :` line naming the concrete observation that would prove it BROKEN, not merely how to check it. « CA3 : l'acces est refuse sans droit » → « Faux si : on atteint la ressource avec un compte depourvu du droit, et elle repond 200 ». A criterion whose red nobody can describe is not a criterion: rewrite it, or move it to Out of scope.
- **Name the fact each rule reads** — for every restriction the feature introduces, name the exact fact the rule must observe AND the neighbouring fact it must not observe instead (state vs origin, blacklist vs whitelist, written form vs what the code actually reaches). Measured as the single most frequent root cause of a guard that passes review and guards nothing.
- **Follow project conventions** — use the project's language (French/English), naming patterns, and architecture terminology.
- **Record branch + worktree** — always fill the Branche/Worktree/Genere le metadata block at the top of the spec, **even if** a project `_specs/template.md` is used (prepend the block to it).

## Phase 5 — Save and summarize

1. Create `_specs/` directory if it doesn't exist
2. Save the spec to `_specs/<feature_slug>.md`
3. Output a short summary:

```
Branch: <branch_name>
Worktree: <worktree_path or "aucun (repo principal)">
Spec file: _specs/<feature_slug>.md
Title: <feature_title>
User stories: [US-NNN, US-NNN] or [N new user stories derived]
Design reference: [Available / Not available]
```

Do NOT repeat the full spec in chat unless the user asks to see it.

## Important rules

- **PROJECT-AGNOSTIC** — this command works for any tech project. Adapt language, conventions, and structure to what the project uses.
- **Always analyze the project first** (Phase 0). The spec quality depends on understanding existing code.
- **Git safety** — never proceed if there are uncommitted changes.
- **No code in specs** — specs describe requirements, not implementation.
- **Real inventory** — the code state section must reflect actual files, not assumptions.
- **Design context is optional** — if no design agents or wireframes exist, the spec still works.
- **Template priority** — if `_specs/template.md` exists, use its structure over the universal template.
- **Follow CLAUDE.md** — any rules in the project's CLAUDE.md override defaults in this command.
- **Isolation awareness** — when concurrent branches/worktrees exist or the tree is dirty, prefer an isolated worktree over an in-place switch; always record the chosen branch + worktree in the spec.
