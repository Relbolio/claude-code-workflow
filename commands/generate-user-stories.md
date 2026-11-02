---
description: Generate a complete set of user stories from a project spec file. Creates numbered, structured user story files organized by epic, plus an index file with phases and priorities. Adapts to any tech project.
argument-hint: <path-to-spec-file>
allowed-tools: Read, Write, Glob, Bash(mkdir:*), Bash(ls:*)
---

# Generate User Stories — Complete User Stories Generator

You receive a project specification file as input. You must analyze it thoroughly and produce a complete set of structured user story files in `userStories/`.

**Spec source:** $ARGUMENTS

---

## Phase 1 — Read and analyze the spec

1. **Read the spec file** at `$ARGUMENTS` in full
2. **Extract and catalog**:
   - Project name and type
   - All user roles (who interacts with the system)
   - All features and functional areas
   - All screens/pages with their descriptions
   - All user flows (step-by-step journeys)
   - All business rules and constraints
   - All acceptance criteria already defined in the spec
   - Monetization/business model elements
   - Non-functional requirements (security, performance, etc.)

## Phase 2 — Plan the user story structure

### Step 1: Identify epics

An epic is a major functional area that groups related user stories. Derive epics from the spec's feature sections and user flows.

**Rules for epic identification:**
- Each epic maps to a distinct functional area (authentication, profile, main entity creation, search, payment, etc.)
- Epics follow the user journey order (onboarding → core actions → management → engagement)
- Each epic becomes one numbered file
- If an epic would produce more than 8-10 user stories, consider splitting it into sub-epics (e.g., "Session Creation — General" and "Session Creation — Sector-specific")
- System/backend processes that don't map to a screen can form their own epic (e.g., "Notifications", "Automated Refunds")

### Step 2: Define numbering scheme

**User story IDs follow a 3-digit scheme tied to the file number:**
- File `01_xxx.md` → US-010, US-011, US-012...
- File `02_xxx.md` → US-020, US-021, US-022...
- File `05_xxx.md` → US-050, US-051, US-052...
- File `12_xxx.md` → US-120, US-121, US-122...
- File `25_xxx.md` → US-250, US-251, US-252...

This allows up to 10 user stories per file (0-9) and easy cross-referencing.

### Step 3: Assign priorities

**Priority levels:**
- **P0 (Critical)** — Features without which the product cannot launch. Core user flow from start to finish.
- **P1 (Important)** — Features needed for a complete experience but not blocking launch. Management, history, secondary flows.
- **P2 (Nice to have)** — Features that enhance engagement but the product works without them. Social features, personalization, edge cases.

### Step 4: Group into implementation phases

Group epics into logical phases that represent a reasonable development sequence:

- **Phase 1 — Foundations**: Authentication, onboarding, role selection, basic setup
- **Phase 2 — [Primary Role] Core**: The main user's core actions (creating, publishing, managing their main entity)
- **Phase 3 — [Secondary Role] Core**: The secondary user's core journey (discovering, interacting, completing the main flow)
- **Phase 4 — Management**: Dashboards, statistics, history, fund management, profile editing
- **Phase 5 — Engagement**: Social features (reviews, favorites, ratings), notifications, cancellation policies
- **Phase 6 — [Platform/Channel]**: Alternative access channels (web responsive, API, etc.)

Adapt phase names and count to the project. Not every project needs 6 phases — use as many as makes sense.

## Phase 3 — Generate user story files

### File naming convention
- `00_INDEX.md` — Always the first file (the index)
- `NN_epic_slug.md` — Numbered files for each epic
- File names in snake_case, lowercase, no accents
- Numbering: 01, 02, 03... up to the total number of epics

### User story file structure

Each epic file MUST follow this EXACT format:

```markdown
# [Epic Title]

## US-[NNN] : [User Story Title]
**En tant que** [role]
**Je veux** [action/capability]
**Afin de** [business value/motivation]

### Criteres d'acceptation
- [ ] CA1 : [Concrete, testable criterion]
- [ ] CA2 : [Concrete, testable criterion]
- [ ] CA3 : [Concrete, testable criterion]
[Add as many as needed — typically 3 to 8 per user story]

### Ecran(s) de reference
- [Reference to screen/page from spec section, or wireframe if exists]
- [Use format: "Ecran #N — [Name] (specs section X)" or "Wireframe NN, [Screen name]"]

### Regles metier applicables
- [R-code] : [Brief description of the applicable business rule]
- Or: "Aucune" if no rules apply

### Notes d'implementation
- [Technical hints, edge cases, integration details]
- [Keep these practical and concise — 1 to 3 bullet points]

---

[Next user story in the same file...]
```

### Writing rules for user stories

**"En tant que" (As a):**
- Use the role names from the spec (e.g., "createur", "reservant", "admin", "utilisateur", "systeme")
- Use "systeme" for automated/backend processes (e.g., automatic refunds, scheduled notifications)
- Use "utilisateur" for actions common to all roles (e.g., splash screen, onboarding)

**"Je veux" (I want to):**
- Start with a verb in the infinitive
- Be specific about the action (not "manage my account" but "modifier mon nom et ma photo de profil")
- One action per user story — if "and" appears, consider splitting

**"Afin de" (So that):**
- Express the business value or user motivation
- Not a technical reason — should make sense to a product owner
- Answer: "Why would the user care about this?"

**Acceptance criteria rules:**
- Each criterion starts with `- [ ] CA[N] :`
- Must be **testable** — a QA engineer can verify it with yes/no
- Include specific values where applicable (field lengths, timeouts, limits)
- Include both happy path and key error scenarios
- Include UI-specific criteria (what's visible, what's disabled, what's hidden)
- Typical count: 3-8 criteria per user story
- Do NOT write vague criteria like "the system works correctly" — be specific

**Screen references:**
- Reference screens from the spec's inventory section
- Use the exact screen number and name from the spec
- If wireframes exist, cross-reference them too
- If no specific screen exists (background process), write: "Aucun ecran specifique (processus automatique)"

**Business rules:**
- Reference rules by their R-code from the spec's business rules section
- Include a brief description so the user story is self-contained
- If no rules apply, write: "Aucune"

**Implementation notes:**
- Keep practical and concise (1-3 bullets)
- Include technical hints that a developer would find useful
- Mention edge cases to consider
- Reference related user stories when relevant (e.g., "La politique est definie par le createur lors de la creation (US-054)")
- Do NOT include full code examples — just hints

### How to derive user stories from the spec

For each feature area, create user stories by asking:

1. **What does the user do first?** → Entry point US (e.g., "Access the creation form")
2. **What are the main steps?** → One US per step (e.g., "Step 1 — General info", "Step 2 — Services")
3. **What are the outcomes?** → Result US (e.g., "Publication", "Confirmation")
4. **What can go wrong?** → Error/edge case US (e.g., "Payment failure", "Cancellation")
5. **What happens in the background?** → System US (e.g., "Automatic refund", "Commission calculation")

**Coverage target:** Every feature and every screen in the spec MUST be covered by at least one user story. Nothing should fall through the cracks.

## Phase 4 — Generate the index file

The index file `00_INDEX.md` ties everything together. It MUST follow this EXACT structure:

```markdown
# [Project Name] — Index General des User Stories

> **Version** : 1.0
> **Date** : [current date]
> **Total** : [N] fichiers de User Stories

---

## Ordre d'implementation

### Phase 1 — [Phase Name]

| # | Fichier | Epic | Priorite |
|---|---------|------|----------|
| 01 | [01_epic_slug.md](01_epic_slug.md) | [Epic Title] | P0 |
| 02 | [02_epic_slug.md](02_epic_slug.md) | [Epic Title] | P0 |

### Phase 2 — [Phase Name]

| # | Fichier | Epic | Priorite |
|---|---------|------|----------|
| 03 | [03_epic_slug.md](03_epic_slug.md) | [Epic Title] | P0 |

[Continue for all phases...]

---

## Couverture des ecrans

[If wireframes exist for the project, map wireframe screens to user stories:]

### Wireframe [NN] — [Journey name] ([N] ecrans)

| Ecran | User Stories |
|-------|-------------|
| [Screen name] | US-NNN, US-NNN |
| [Screen name] | US-NNN a US-NNN |

[If no wireframes exist yet, map spec screens instead:]

### Ecrans du Spec

| # | Ecran | User Stories |
|---|-------|-------------|
| 1 | [Screen name] | US-NNN, US-NNN |

---

## Regles metier referencees

| Regle | Description | User Stories concernees |
|-------|-------------|----------------------|
| R1 | [Rule description] | US-NNN, US-NNN |
| R2 | [Rule description] | US-NNN, US-NNN |
[List all business rules from the spec with cross-references to the user stories that implement or reference them]
```

## Phase 5 — Write files and summarize

1. Create the `userStories/` directory if it doesn't exist
2. Write the index file first (`00_INDEX.md`)
3. Write all epic files in order
4. Display a summary:

```
User Stories generated for: [Project Name]
Directory: userStories/

Index: 00_INDEX.md

Phase 1 — [Phase Name] (P0)
  01_[slug].md — [Epic Title] ([N] user stories)
  02_[slug].md — [Epic Title] ([N] user stories)

Phase 2 — [Phase Name] (P0)
  03_[slug].md — [Epic Title] ([N] user stories)

[Continue for all phases...]

Total: [N] files, [N] user stories
Coverage: [N] screens mapped, [N] business rules referenced
```

## Important rules

- **This command is PROJECT-AGNOSTIC** — adapt to any tech project (mobile, web, SaaS, API, etc.)
- **Complete coverage** — every feature and every screen from the spec MUST be covered by at least one user story. After generating, mentally verify that nothing from the spec is missing.
- **Consistent numbering** — file NN → US-NN0 through US-NN9. This is critical for cross-referencing.
- **No invented features** — only write user stories for features described in the spec. Do not add features that don't exist in the spec.
- **One action per US** — if a user story has "and" connecting two different actions, split it into two separate user stories.
- **French text** — all user story text is written in French (matching the existing pattern). Code identifiers and technical terms can stay in English.
- **Realistic criteria** — acceptance criteria must be specific and testable, with concrete values (max characters, timeouts, limits) from the spec.
- **Cross-references** — user stories should reference each other when related (e.g., "La politique definie en US-054 s'applique ici").
- **Business rules mapping** — every business rule from the spec must appear in at least one user story AND in the index's cross-reference table.
- **Screen mapping** — every screen from the spec must be referenced in at least one user story AND in the index's coverage table.
- **Separator between user stories** — use `---` (horizontal rule) to separate user stories within the same file.
- **No trailing whitespace** — clean formatting throughout.
- **Files should remain manageable** — if an epic would produce more than 10 user stories, split the epic into multiple files (e.g., `05_creation_session_generale.md` and `06_creation_session_par_secteur.md`).
