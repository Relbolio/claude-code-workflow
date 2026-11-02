---
description: Generate a 3-phase versioning plan (MVP → Intermediate → Optimal) from a project documentation file. Creates a versions/ directory with structured version files adapted to any tech project.
argument-hint: <path-to-documentation-file>
allowed-tools: Read, Write, Glob, Bash(mkdir:*), Bash(ls:*)
---

# Generate Versions — Project Versioning Plan Generator

You receive a project documentation file as input. You must analyze it thoroughly and produce a 3-phase versioning plan in a `versions/` directory.

**Documentation source:** $ARGUMENTS

---

## Phase 1 — Read and analyze the documentation

1. **Read the documentation file** at `$ARGUMENTS` in full
2. **Extract and identify**:
   - **Project name** and type (mobile app, web app, SaaS, API, etc.)
   - **Target audience** (users, clients, businesses, etc.)
   - **All features** described in the documentation
   - **Business model** (monetization, pricing, commissions, subscriptions, etc.)
   - **Technical stack** mentioned (frameworks, backend, database, integrations)
   - **Screens/pages** described
   - **Non-functional requirements** (security, performance, compliance, i18n, etc.)
   - **Integrations** with third-party services (payment, notifications, analytics, etc.)

## Phase 2 — Classify features into 3 versions

Apply the following prioritization logic to distribute ALL features across 3 versions:

### VERSION 1 — MVP (Minimum Viable Product)
**Goal:** Launch a first functional version to **validate the concept** with minimal development.

Include ONLY features that are:
- **Essential** to the core value proposition (the ONE thing the app does)
- **Authentication** basics (signup, login, password recovery)
- **Core user flow** from start to finish (the minimum happy path)
- **Basic profile** management
- **Basic notifications** (push only, essential events)
- **Simple sharing** mechanisms (links, copy)
- **Basic history/listing** of main entities

Exclude from V1:
- Payment/monetization
- Advanced search/discovery
- Social features (reviews, favorites)
- Advanced analytics/dashboards
- Customization/personalization
- Premium/subscription tiers
- Advanced security (2FA, compliance)
- Multi-language support
- Theme options (dark/light)

### VERSION 2 — Intermediate (Complete & Monetizable)
**Goal:** Activate the **business model** and enrich the experience. This version makes the product **commercially viable**.

**Prerequisite:** Version 1 deployed and functional.

Include features that:
- Enable **monetization** (payments, commissions, subscriptions)
- Add **discovery/exploration** capabilities
- Provide **business intelligence** (dashboards, basic stats)
- Enable **social proof** (reviews, ratings, favorites)
- Improve **user acquisition** (deep linking, QR codes, referrals)
- Add **secondary authentication** methods (Google, Apple, etc.)
- Enable **richer notifications** (reminders, enriched content)
- Add **cancellation/refund** policies

### VERSION 3 — Optimal (Complete Vision)
**Goal:** Achieve the **complete product vision** with premium features, advanced monetization, enterprise-grade security, and optimal UX.

**Prerequisite:** Version 2 deployed and stable, active user base.

Include features that:
- Add **premium/subscription** tiers
- Enable **paid promotion** (boost, ads, featured listings)
- Provide **advanced analytics** (comparisons, exports, predictions)
- Add **advanced security** (2FA, compliance, audit logs)
- Enable **multi-language** support
- Add **theme customization** (dark/light/adaptive)
- Provide **in-app support** (chat, tickets, FAQ)
- Enable **advanced personalization** (custom notifications, preferences)
- Add **enterprise features** (team management, API access, etc.)

## Phase 3 — Generate version files

### Step 1: Create the directory
Create the `versions/` directory if it doesn't exist.

### Step 2: Write each version file

For each version, generate a markdown file following this EXACT structure (adapt content to the specific project):

```markdown
# [Project Name] — Version [N] : [Version Title]

## Objectif
[2-3 sentences explaining the goal of this version — what it achieves and why]

## Prerequis
[Only for V2 and V3 — what must be done before starting this version]

## Public cible
- [Target user type 1]: [brief description of their needs at this stage]
- [Target user type 2]: [brief description]

---

## Fonctionnalites detaillees

### 1. [Feature Category Name]
| Element | Detail |
|---------|--------|
| [Sub-feature] | [Concrete description] |
| [Sub-feature] | [Concrete description] |

### 2. [Feature Category Name]
[Use tables, bullet lists, or descriptions — whichever best fits the feature]

[Continue numbering for all features in this version...]

---

## Ecrans / Pages principaux

### [Platform 1] (e.g., Application Mobile, Web App, Dashboard)
1. **[Screen Name]** — [short description of purpose]
2. **[Screen Name]** — [short description]
[...]

### [Platform 2] (if applicable)
1. **[Screen Name]** — [short description]
[...]

---

## Criteres de Validation (Definition of Done)

- [ ] [Testable acceptance criterion 1]
- [ ] [Testable acceptance criterion 2]
[...]

---

## Ce qui n'est PAS dans cette version
[Only for V1 and V2 — list features explicitly excluded and deferred to later versions]
```

**For V3 only**, add this extra section at the end:

```markdown
---

## Recapitulatif Modele Economique Complet (V3)

| Source de revenus | Taux / Montant | Version |
|-------------------|---------------|---------|
| [Revenue source] | [Rate or amount] | [V1/V2/V3] |
[...]
```

### File naming convention:
- `versions/VERSION_1_MVP.md`
- `versions/VERSION_2_INTERMEDIAIRE.md`
- `versions/VERSION_3_OPTIMALE.md`

## Phase 4 — Output summary

After all files are written, display a summary to the user:

```
Versions generated for: [Project Name]
Directory: versions/

  VERSION_1_MVP.md
    - Features: [count]
    - Screens: [count]
    - Goal: [one-line summary]

  VERSION_2_INTERMEDIAIRE.md
    - Features: [count]
    - Screens: [count]
    - Goal: [one-line summary]

  VERSION_3_OPTIMALE.md
    - Features: [count]
    - Screens: [count]
    - Goal: [one-line summary]

Revenue model: [brief summary of monetization across versions]
```

## Important rules

- **This command is PROJECT-AGNOSTIC** — it must work for any tech project (mobile, web, SaaS, API, IoT, etc.)
- **Adapt vocabulary** to the project type (e.g., "screens" for mobile, "pages" for web, "endpoints" for API)
- **All features from the documentation MUST appear** in exactly one version — nothing should be lost
- **Features should NOT be invented** — only organize and classify what exists in the documentation
- **If the documentation lacks monetization info**, note it in V2/V3 with a placeholder indicating the business model needs to be defined
- **If the documentation is for a non-commercial/open-source project**, replace monetization sections with contribution/community growth milestones
- **Keep consistent formatting** with the template structure above
- **Use French** for all section titles and descriptions (matching the existing BookMe version files style)
- **Each feature description must be concrete and specific** — avoid vague statements
- **Acceptance criteria must be testable** — each criterion should be verifiable with a yes/no answer
- **The "Ce qui n'est PAS dans cette version" section** helps stakeholders understand scope clearly
