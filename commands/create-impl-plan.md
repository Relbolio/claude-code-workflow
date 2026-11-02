---
description: Generate a detailed implementation plan from a feature spec file. Analyzes the project codebase (architecture, existing code, components, agents), then produces a structured step-by-step plan with file lists, agent delegation, and verification criteria. Adapts to any tech project.
argument-hint: <path-to-spec-file>
allowed-tools: Read, Glob, Grep, Agent(Explore), Agent(Plan), Write, Bash(mkdir:*), Bash(ls:*), Bash(git branch:*), Bash(git rev-parse:*), Bash(git worktree:*)
---

# Create Implementation Plan — Spec-to-Plan Generator

You receive a feature spec file as input. You must analyze the spec AND the project codebase, then produce a detailed implementation plan in `_plans/`.

**Spec source:** $ARGUMENTS

---

## Phase 0 — Project analysis (ALWAYS do this first)

Before reading the spec, understand the project context:

### 0.1 Project identity

1. **Read CLAUDE.md** (if exists) — project name, stack, architecture, conventions, critical rules
2. **Identify the architecture doc** — look for `specs/*ARCHITECTURE*` or similar
3. **Identify the framework** from config files (`pubspec.yaml`, `package.json`, `Cargo.toml`, `go.mod`, `requirements.txt`, etc.)

### 0.2 Identify available agents

Check `.claude/agents/` for specialized agents that can be delegated to:
- UI/Design agent → for UI component creation
- Image generation agent → for asset generation
- Code review agent → for validation
- Any other specialized agents

Record their exact file names and capabilities.

### 0.3 Identify project conventions

From CLAUDE.md and codebase:
- Architecture pattern (MVVM, Clean, Feature-First, etc.)
- Layer structure (config → core → data → services → shared → features, etc.)
- File naming convention (snake_case, kebab-case, etc.)
- Component naming convention (prefix like `Bm*`, `Pk*`, etc.)
- State management approach
- i18n approach (ARB files, JSON, etc.)
- Testing approach
- Max file size rules
- Build/generation commands

### 0.4 Detect branch & worktree context

- `git rev-parse --abbrev-ref HEAD` → current branch
- `git worktree list` → determine whether the current working directory is a linked worktree (and its path)

Record both for the plan header (Phase 3).

## Phase 1 — Read and understand the spec

1. **Read the spec** at `$ARGUMENTS` in full
2. **Identify**:
   - User stories covered (US-XXX) and their acceptance criteria
   - Functional and non-functional requirements
   - Scope (in/out)
   - Design context (layout, colors, components — if present in spec)
   - Technical notes and edge cases
   - Agent delegation hints (if present in spec)
   - Prerequisites and dependencies on other features

## Phase 2 — Codebase exploration (PARALLEL)

Launch **up to 3 Explore agents in parallel** to analyze the codebase. Adapt the exploration targets to the project's architecture:

### Agent 1 — Structure and existing files

- Check if stub/placeholder files already exist for this feature
- List existing routes/pages already defined
- Identify existing relevant state management (providers, stores, reducers, etc.)
- Check the data models that this feature will use
- Identify existing services/repositories relevant to this feature

### Agent 2 — Shared components and theme

- List all available shared/reusable components
- Read theme/design system files (colors, typography, dimensions, tokens)
- Identify which existing components can be reused for this feature
- Identify which new components need to be created
- Check for existing layout patterns (shells, scaffolds, app bars, nav bars)

### Agent 3 — i18n, dependencies, and related code

- Check existing translation/i18n keys for overlap
- Identify new translation keys needed
- Check package config for required dependencies
- Read referenced user stories (if they exist in `userStories/` or similar)
- Check for related features that may share code or patterns

**If Explore agents are not available**, perform this exploration directly using Glob, Grep, and Read tools.

## Phase 3 — Plan elaboration

From the spec + codebase analysis, build the implementation plan using this structure:

```markdown
# Implementation Plan — [Feature Title]

**Spec source:** `[spec path]`
**User stories:** [US-XXX, US-YYY] (or "Derived from spec" if no formal US)
**Branch:** `[current branch name]`
**Worktree:** `[worktree path, or "aucun (repo principal)"]`
**Project:** [Project name]
**Stack:** [Framework + State Mgmt + Backend]

---

## Context

[2-3 sentences explaining why this feature is being implemented and what the goal is. Reference the spec for full details.]

---

## Current code state

| Element | Status | File |
|---|---|---|
| [Model/Entity] | OK / Placeholder / To create / Missing | [relative path] |
| [Service/Repo] | OK / Placeholder / To create / Missing | [relative path] |
| [Provider/Store] | OK / Placeholder / To create / Missing | [relative path] |
| [Route/Page] | OK / Placeholder / To create / Missing | [relative path] |
| [Screen/Component] | OK / Placeholder / To create / Missing | [relative path] |

Status meanings:
- **OK** — exists and is functional, no changes needed
- **Placeholder** — file exists but is a stub/TODO, needs implementation
- **To create** — does not exist, must be created from scratch
- **Missing** — expected to exist based on architecture but not found

---

## Sealed inventory — MEASURED, before the first line of code ⭐

**MANDATORY.** Every claim this plan rests on, stated as a **number obtained by a command you ran**, with the command and the date. Not "several routes are unused" — *"17 routes served, 0 consumed by the front, measured by `grep` on 2026-08-25"*.

| Fact | Measure | How it was obtained |
|---|---|---|
| [e.g. writes of column X] | 4 | `grep -rn "X" src` |
| [e.g. reads that actually REFUSE something] | **0** | `grep` + reading each call site |
| [e.g. capabilities with no server gate] | 3 of 10 | `grep "@Entitlement"` |

> ⚠️ **WHY THIS SECTION IS FIRST AND NOT OPTIONAL.** A plan written on remembered facts inherits every stale belief in the repository. Measured cases: a docblock authorising an exception its own table refused; a comment stating "no route triggers this" that had been false for two batches; an invariant promising an airtightness it never had — **three times**. A number you did not obtain today is an opinion.
>
> ⚠️ **Re-measure the numbers the spec asserts, do not copy them.** An audit's own count drifts: a document reread several times repeats its figures, one fix updates one of them and forgets the others. Start by listing every repeated count and confronting them with each other.
>
> ⚠️ **If a measurement REFUTES the spec, say so here and stop.** It has happened: a decision prescribed gating a route that a non-negotiable invariant keeps open. The invariant wins, the plan records the refutation, and the spec is corrected — never the reverse, and never silently.

---

## State × route matrix ⭐

**MANDATORY whenever the feature touches an account state, a permission, a plan capability, or any other gate.** One row per state, one column per gesture — including the gestures that must stay **OPEN**.

| State / role | Gesture A | Gesture B | Read | Export |
|---|---|---|---|---|
| [nominal] | ✅ | ✅ | ✅ | ✅ |
| [degraded] | ❌ `code.refusal` | ✅ | ✅ | ✅ |
| [terminal] | ❌ | ❌ | ✅ | ✅ |

> ⚠️ **THE COLUMNS THAT STAY OPEN CARRY MORE WEIGHT THAN THE ONES THAT CLOSE.** A matrix listing only refusals is satisfied by an implementation that refuses everything — and nobody notices until a user cannot do something nobody thought to test. Every ✅ is a commitment, and a test must hold it.
>
> ⚠️ **A cell left blank is a decision taken by omission.** Fill all of them, including the impossible combinations — writing "unreachable, and here is why" is itself a finding.

---

## Implementation steps

### Step 1 — [Short title]

- [ ] [Concrete action 1]
- [ ] [Concrete action 2]
  - [Details: layout, props, logic, etc.]
  - [Acceptance criteria this addresses: CA1, CA3]
- [ ] [Concrete action 3]

**Agent delegation:** [If applicable — which agent should handle this step]
**Dependencies:** [Which steps must be completed first]

---

### Step 2 — [Short title]

[Same structure as Step 1]

---

[Repeat for all steps needed. Steps should be ordered logically:]
1. Data layer first (models, services)
2. State management (providers, stores)
3. Shared components (new reusable widgets/components)
4. Feature screens (UI implementation)
5. Routing and navigation
6. i18n (translation keys)
7. Integration and wiring
8. Testing

---

## Files to create / modify

### New files
| File | Description | Step |
|---|---|---|
| [relative path] | [What this file contains] | Step N |

### Files to modify
| File | Modification | Step |
|---|---|---|
| [relative path] | [What changes] | Step N |

### Read-only files (reference)
- [Files to consult for patterns, types, or context but NOT modify]

---

## Shared components

### Existing components to reuse
| Component | Usage in this feature |
|---|---|
| [ComponentName] | [How it will be used] |

### New components to create
| Component | Description | Reusable? |
|---|---|---|
| [ComponentName] | [What it does] | Yes/No |

---

## i18n / Translation keys

### New keys to add
| Key | FR | EN |
|---|---|---|
| [keyName] | [French text] | [English text] |

[Adapt to project's i18n approach. If no i18n, omit this section.]

---

## Agent delegation

| Agent | Tasks | Steps |
|---|---|---|
| **[agent-name]** | [Specific tasks for this agent] | Step N, N |

[If no agents are available in the project, replace with:]

### Manual task breakdown
| Skill area | Tasks | Steps |
|---|---|---|
| **UI/Design** | [UI tasks] | Step N |
| **Backend/Logic** | [Logic tasks] | Step N |
| **Testing** | [Test tasks] | Step N |

---

## Verification

### Automated checks
1. `[lint/analyze command]` — zero errors
2. `[test command]` — all tests pass
3. `[build command]` — builds successfully

### Manual checks
1. [Feature-specific check tied to acceptance criteria]
2. [Theme/mode check — dark/light if applicable]
3. [i18n check — all strings translated if applicable]
4. [Responsive check — if applicable]
5. [Edge case — empty state, error state, loading state]

### Acceptance criteria verification
| Criterion | How to verify |
|---|---|
| CA1 | [Concrete verification step] |
| CA2 | [Concrete verification step] |

---

## Recommended execution order

[Optimal step sequence considering dependencies. Format as a numbered list:]

1. **Step N** — [Title] (no dependencies)
2. **Step N** — [Title] (depends on Step N)
3. **Steps N+N** — [Titles] (can be done in parallel)
[...]

[Indicate which steps can be parallelized]

---

## Frozen decisions and presumptions

[Every arbitration settled WHILE writing this plan: a value picked among several, a behaviour presumed because the spec is silent, a cost or ordering trade-off. Unwritten, each of these is re-litigated during implementation and drifts in silence.]

| Decision / presumption | What holds | Rejected alternative | Why | Settled by |
|---|---|---|---|---|

A row whose "Settled by" is empty is not a decision, it is an open question: move it to *Risks and considerations*.

---

## Risks and considerations

- [Risk 1 — e.g., "Model X may need additional fields not in the current Freezed definition"]
- [Risk 2 — e.g., "Third-party API integration not yet confirmed"]
- [Mitigation strategies]
```

## Phase 4 — Write the plan file

1. Create `_plans/` directory if it doesn't exist
2. Derive the plan file name from the spec file name (e.g., `session-creation.md` → `_plans/session-creation.md`)
3. Write the complete plan
4. Display a short summary:

```
Plan created: _plans/[name].md
Feature: [title]
Steps: [count]
Files to create: [count]
Files to modify: [count]
New components: [count]
New i18n keys: [count]
Agent delegations: [count] (or "N/A — no agents available")
```

## Important rules

- **PROJECT-AGNOSTIC** — this command works for any tech project. Adapt file paths, tool names, commands, and terminology to the project.
- **Always analyze the project first** (Phase 0). The plan must reflect the ACTUAL codebase, not assumptions.
- **Do NOT implement** — this produces ONLY the plan, never code. The plan is a blueprint for implementation.
- **Respect the project's architecture** — follow the layer structure defined in CLAUDE.md or the architecture doc. Don't suggest putting files in wrong layers.
- **Identify existing components BEFORE proposing new ones** — reuse is preferred over creation.
- **Real file paths** — every file in the plan must use the project's actual path structure.
- **A guard must read the fact it claims to guard, not a neighbouring one** — every guard a step introduces states the guarded fact LITERALLY ("this account has never been opened"), never a proxy ("a token is alive"), never the state where the origin is meant, never a blacklist where a whitelist is meant. Measured: four successive occurrences on a single lot. If the step cannot state the guarded fact in one unambiguous sentence, the guard is not specified yet.
- **Nothing is described in the present tense before it exists** — in the plan AND in every comment or docblock a step tells the implementer to write, a behaviour delivered by a LATER step is written in the future, naming that step ("will be enforced by Step 7"). Measured: three docblocks describing in the present a guard due two steps later — a reviewer who believed it posed never added it.
- **One fact, one place** — a number (step count, file count, threshold, quantity, date) is written ONCE, in the table that owns it; everywhere else it is REFERENCED, never re-typed. Same for the spec: the plan LINKS to a requirement, it never recopies it. The Phase 4 summary is re-derived from the plan's own tables, never patched in place.
- **Agent delegation is dynamic** — list agents from `.claude/agents/` that actually exist. If none exist, provide manual task breakdown instead.
- **Acceptance criteria mapping** — every acceptance criterion from the spec must be addressed by at least one step AND have a verification method.
- **Checkboxes `- [ ]`** — allow progress tracking during implementation.
- **Follow CLAUDE.md** — any rules in the project's CLAUDE.md override defaults in this command.
- **Record branch + worktree** — detect the current branch and worktree (Phase 0.4) and fill them in the plan header, so the plan's origin is traceable.
- **Verification commands** — use the project's actual build/test/lint commands (from CLAUDE.md or package config), not generic ones.
- **Steps must be concrete** — "Implement the form" is too vague. "Create `UserForm` component with fields: name (required, max 100), email (required, valid format), phone (optional)" is concrete.
- **Dependencies between steps must be explicit** — a developer should know exactly which steps they can start with and what blocks what.
