---
description: Generate a consolidated project specification from version files. Merges selected versions into a single coherent spec document in specs/. Adapts to any tech project.
argument-hint: <version-file-1> [version-file-2] [version-file-3]
allowed-tools: Read, Write, Glob, Bash(mkdir:*), Bash(ls:*)
---

# Generate Specs — Project Specification Generator

You receive one or more version files as input. You must read them all, consolidate their features into a single coherent specification document, and write it to `specs/`.

**Version files:** $ARGUMENTS

---

## Phase 1 — Read and analyze all version files

1. **Parse the arguments** to identify all version file paths (space-separated or comma-separated)
2. **Read each version file** in full
3. **For each version, extract**:
   - Project name
   - Project type (mobile, web, SaaS, API, etc.)
   - Version number and title
   - Target audience
   - All features with their details
   - Screens/pages described
   - Business model elements (monetization, pricing, commissions)
   - Acceptance criteria
   - Exclusions ("Ce qui n'est PAS dans cette version")
4. **Determine the consolidation scope**:
   - The versions passed as arguments form the **included scope** (what goes INTO the spec)
   - Check if other version files exist in the same `versions/` directory that are NOT passed as arguments — these form the **excluded scope** (what goes into "Hors Perimetre")

## Phase 2 — Consolidate and structure the specification

Merge all included versions into a single unified specification following this EXACT structure:

```markdown
# [Project Name] — Specifications [Scope Label]

> **Version** : 1.0
> **Date** : [current date]
> **Perimetre** : [Description of what versions are included, e.g., "Version commerciale unique (fusion V1 MVP + V2 Intermediaire)"]

---

## Table des matieres

[Auto-generated table of contents matching all sections below]

---

## 1. Presentation Generale

### 1.1 Vision Produit

[2-3 paragraphs describing what the product is, what problem it solves, who it serves, and what makes it unique. Synthesized from all included versions — this should read as a single coherent vision, NOT as a list of version features.]

### 1.2 Objectif de cette Version

[Explain why these versions are consolidated and what the goal is. Mention what the product achieves at this stage — the value proposition for launch.]

### 1.3 Public Cible

| Profil | Description |
|--------|-------------|
| **[User type 1]** | [Detailed description of this user type, their needs, and how they use the product] |
| **[User type 2]** | [Detailed description] |
[Add more rows as needed]

---

## 2. [Domain/Sector Section — ONLY if applicable]

If the product covers multiple domains, sectors, categories, or verticals (like BookMe covers 9 business sectors), create a dedicated section listing each one with:

| Element | Detail |
|---------|--------|
| **Icone** | [Emoji + name] |
| **Cas d'usage typique** | [Concrete scenario in 2-3 sentences showing a real user doing a real task] |
| **Services types** | [Comma-separated list of typical services/offerings in this domain] |
| **Specificites** | [What makes this domain unique in terms of configuration, flow, or constraints] |

If the product does NOT have multiple domains/sectors, SKIP this section entirely and adjust the numbering of subsequent sections.

---

## [N]. Parcours Utilisateur (UX Flows)

For EACH distinct user role, describe the complete end-to-end journey:

### [N].A Parcours [User Role 1]

Break down into sequential sub-flows:

#### [N].A.1 [Flow Name] (e.g., Inscription / Connexion)

1. [Step 1 — concrete action]
2. [Step 2 — concrete action with details]
3. [Continue numbering...]

For steps with sub-options, use nested lists or tables:
- **Option A** : [description]
- **Option B** : [description]

#### [N].A.2 [Next Flow]

[Continue for all flows in this user role's journey]

---

### [N].B Parcours [User Role 2]

[Same pattern — sequential sub-flows with numbered steps]

---

### [N].C Parcours [User Role 3 — if applicable]

[Same pattern]

---

## [N+1]. Fonctionnalites Detaillees

List ALL features from all included versions, organized by functional area. Each feature gets a subsection:

### [N+1].1 [Feature Area Name]

| Fonctionnalite | Description |
|----------------|-------------|
| **[Feature name]** | [Precise, concrete description of what it does — not vague] |
| **[Feature name]** | [Description] |

Use tables for feature lists. Use bullet points for features that need more detailed sub-items. Use sub-tables for complex features with multiple configuration options.

**IMPORTANT rules for this section:**
- Features from different versions that relate to the same area MUST be merged into a single subsection (do NOT duplicate sections)
- If V1 has "basic notifications" and V2 has "enriched notifications", merge them into one "Notifications" subsection with all details combined
- Every feature from every included version MUST appear here — nothing should be lost
- Order features logically by functional area, not by version

---

## [N+2]. Modele Economique

### [N+2].1 Sources de Revenus

| Source | Taux | Description |
|--------|------|-------------|
| **[Revenue source]** | [Rate or amount] | [How it works] |

### [N+2].2 Exemple Chiffre — [Representative Use Case]

| Element | Valeur |
|---------|--------|
| [Metric] | [Value] |
[Build a realistic financial example showing how the business model works in practice]

### [N+2].3 Projection a [Scale Target]

| Indicateur | Valeur |
|------------|--------|
| [KPI] | [Projected value] |

> [Caveat about projections being estimates]

If no monetization info exists in the versions, write:
> Le modele economique n'est pas defini dans les versions fournies. Cette section devra etre completee separement.

For non-commercial/open-source projects, replace with community growth metrics or adoption milestones.

---

## [N+3]. Inventaire des Ecrans

Group screens/pages by user role or platform:

### [Platform/Role 1]

| # | Ecran | Description |
|---|-------|-------------|
| 1 | **[Screen Name]** | [What the user sees and can do on this screen] |
| 2 | **[Screen Name]** | [Description] |

### [Platform/Role 2]

[Same table format]

**Total : [count] ecrans**

Adapt terminology to project type:
- Mobile app → "Ecrans"
- Web app → "Pages"
- API → "Endpoints"
- Dashboard → "Vues"

---

## [N+4]. Regles Metier & Contraintes

| # | Regle | Detail |
|---|-------|--------|
| R1 | **[Rule name]** | [Precise description of the business rule, constraint, or invariant] |
| R2 | **[Rule name]** | [Description] |

These are the non-negotiable rules that the system MUST enforce. Extract them from:
- Feature descriptions that mention constraints ("only after...", "must not...", "limited to...")
- Acceptance criteria that imply rules
- Business model constraints (minimums, maximums, conditions)
- Security or data integrity requirements

---

## [N+5]. Criteres de Validation Globaux (Definition of Done)

Consolidate ALL acceptance criteria from ALL included versions into a single unified checklist:

- [ ] [Testable criterion — must be verifiable with yes/no]
- [ ] [Testable criterion]
[...]

Remove duplicates. Merge overlapping criteria. Order logically by feature area.

---

## [N+6]. Ce qui est HORS Perimetre (Reserve a [excluded versions])

This section ONLY appears if there are version files NOT included in the arguments (i.e., features deferred to later versions).

| Fonctionnalite | Raison de l'exclusion |
|----------------|----------------------|
| **[Feature name]** | [Why it's excluded — tied to a specific later version] |

If ALL versions are included, SKIP this section entirely.

---

*Document genere le [current date] — [Project Name] Specifications [Scope Label]*
```

## Phase 3 — Derive metadata and naming

1. **Project name**: Extract from the version files (the name before the dash in the title)
2. **Scope label**: Based on which versions are included:
   - If only V1 → "MVP"
   - If V1+V2 → "Commerciales (V1 + V2 Consolidees)"
   - If V1+V2+V3 → "Completes (V1 + V2 + V3)"
   - If only V2+V3 → "Avancees (V2 + V3)"
   - Adapt as needed for the specific combination
3. **File name**: `[PROJECT_NAME]_SPECS.md` (uppercase, underscores)
   - Example: `BOOKME_SPECS.md`, `TASKFLOW_SPECS.md`, `MEDICONNECT_SPECS.md`

## Phase 4 — Write the specification file

1. Create the `specs/` directory if it doesn't exist
2. Write the specification to `specs/[PROJECT_NAME]_SPECS.md`
3. Display a summary to the user:

```
Specification generated for: [Project Name]
File: specs/[PROJECT_NAME]_SPECS.md

Scope: [versions included]
Sections: [count]
Features consolidated: [count]
Screens/Pages: [count]
Business rules: [count]
Acceptance criteria: [count]

Excluded (deferred): [list of excluded version features if any, or "None — all versions included"]
```

## Important rules

- **This command is PROJECT-AGNOSTIC** — it must work for any tech project
- **CONSOLIDATE, don't concatenate** — the spec must read as ONE coherent document, not as versions pasted together. Merge related features, eliminate redundancy, unify terminology
- **Every feature from every included version MUST appear** in the spec — nothing should be lost in consolidation
- **Use French** for all section titles and descriptions (matching the BookMe spec style)
- **Adapt vocabulary** to the project type (screens vs pages vs endpoints vs views)
- **UX flows must be concrete** — numbered steps with specific actions, not vague descriptions
- **Business rules must be extractable from features** — identify constraints, invariants, and conditions that the system must enforce
- **Acceptance criteria must be testable** — each one should be verifiable with a yes/no answer
- **If a section doesn't apply** to the project type (e.g., no sectors/domains, no monetization), skip it and adjust numbering
- **Do NOT invent features** — only document what exists in the version files
- **Do NOT add implementation details** — no code, no technical architecture, no database schemas. This is a functional specification
- **Tables are preferred** for structured data — use them for features, screens, rules, and criteria
- **Scenarios in UX flows should be realistic** — use concrete examples with real-world names, numbers, and situations
