---
description: Generate interactive HTML wireframes from a project spec file. Guides the user on scope (full vs key screens), then produces self-contained HTML wireframe files organized by user journey. Adapts to any tech project.
argument-hint: <path-to-spec-file>
allowed-tools: Read, Write, Glob, Bash(mkdir:*), Bash(ls:*), Skill
---

# Generate Wireframes — Interactive HTML Wireframe Generator

You receive a project specification file as input. You must analyze it, guide the user on wireframe scope, then generate self-contained HTML wireframe files in `wireframes/`.

**Spec source:** $ARGUMENTS

---

## Phase 1 — Read and analyze the spec

1. **Read the spec file** at `$ARGUMENTS` in full
2. **Extract**:
   - Project name and type (mobile app, web app, SaaS, dashboard, etc.)
   - All user roles (e.g., creator, booker, admin, viewer)
   - All screens/pages listed with their descriptions
   - User flows/journeys for each role
   - Key UI components mentioned (forms, calendars, cards, lists, charts, etc.)
   - Business domain elements (categories, services, entities specific to the project)
   - Sample data context (what kind of data to show as realistic examples)

## Phase 2 — Choose the design style

Before generating anything, **ask the user to choose a design direction** for the wireframes. Present these options:

```
Quel style de design souhaitez-vous pour vos wireframes ?

  1. 🎨 Luxury / Premium — Tons sombres, accents dorés, typographie élégante
  2. 🌿 Clean / Minimal — Espaces aérés, couleurs douces, simplicité
  3. 🔥 Bold / Vibrant — Couleurs vives, contrastes forts, énergie
  4. 🌙 Dark Modern — Interface sombre moderne, accents néon
  5. ☀️ Light & Airy — Fond clair, tons pastels, sensation légère
  6. 🏗️ Brutalist / Raw — Brut, typographie forte, anti-design
  7. 🎯 Corporate / Pro — Professionnel, structuré, confiance
  8. 🎮 Playful / Fun — Couleurs ludiques, formes arrondies, dynamique
  9. ✨ Custom — Décrivez votre vision (couleurs, ambiance, références)
```

**Wait for the user's response.** Once confirmed, invoke the `frontend-design` skill (via the Skill tool with `skill: "frontend-design"`) to generate the CSS design system (variables, typography, colors, components) matching the chosen style. Use the output from `frontend-design` as the design system for ALL wireframe files.

**Important:** Do NOT use a hardcoded design system. The design system MUST come from the `frontend-design` skill based on the user's choice. This ensures each wireframe project has a unique, intentional aesthetic.

---

## Phase 3 — Present wireframe plan to the user

After the design style is confirmed, present a structured plan and ask the user to validate or adjust.

### Step 1: Identify wireframe files to create

Group screens by **user journey and platform**. Each group becomes one HTML file:

```
Wireframe Plan for [Project Name]
==================================

Total screens in spec: [count]

Proposed wireframe files:
  1. wireframe_[NN]_[journey_name].html
     → [User Role] journey ([platform])
     → Screens: [list of screen names]
     → [count] screens

  2. wireframe_[NN]_[journey_name].html
     → [User Role] journey ([platform])
     → Screens: [list of screen names]
     → [count] screens

  [Continue for each journey...]

Options:
  A) Full coverage — All [total] screens across [count] files
  B) Key screens only — [reduced count] essential screens (main flows)
  C) Custom — Tell me which screens to include

Which option do you prefer? (A/B/C or list specific screens)
```

### Step 2: Determine scope

- **If total screens <= 15**: Recommend option A (full coverage)
- **If total screens 16-30**: Recommend option B but offer A
- **If total screens > 30**: Strongly recommend option B or C
- **Option B selection**: Include only screens that represent the core happy path for each user role (home, main action, confirmation, key management screens). Skip secondary screens like settings, help, edge cases.

### Step 3: Wait for user response

Do NOT proceed until the user confirms the scope. Adjust the plan based on their choice.

## Phase 4 — Generate the wireframes

For each confirmed wireframe file, generate a **self-contained HTML file** following the architecture and patterns described below.

### File naming convention
- `wireframe_[NN]_[journey_slug].html`
- Numbering starts at `01` and increments
- Journey slug in snake_case (e.g., `creator_mobile`, `admin_dashboard`, `user_web`)

### HTML Architecture

Each wireframe file MUST follow this structure:

```html
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>[Project Name] — [Journey Title] | Wireframe [NN]</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet">
<style>
  [Design system CSS — see design system section below]
</style>
</head>
<body>

<div class="[frame-class]">

  <!-- Screen Navigation -->
  <nav class="screen-nav">
    <a href="#s1">[Screen 1 name]</a>
    <a href="#s2">[Screen 2 name]</a>
    [...]
  </nav>

  <!-- SCREEN 1 — [Screen Title] -->
  <section class="screen" id="s1">
    <span class="screen-label">Screen 1 / [total]</span>
    [Screen content with realistic sample data]
  </section>

  <!-- SCREEN 2 — [Screen Title] -->
  <section class="screen" id="s2">
    [...]
  </section>

  [Continue for all screens in this journey...]

</div>

</body>
</html>
```

### Frame type based on platform

**Mobile app wireframes:**
```css
.phone-frame {
  max-width: 430px;
  margin: 0 auto;
  background: var(--bg-primary);
  min-height: 100vh;
  position: relative;
  border-left: 1px solid var(--border);
  border-right: 1px solid var(--border);
}
```

**Web app / Dashboard wireframes:**
```css
.web-frame {
  max-width: 1200px;
  margin: 0 auto;
  background: var(--bg-primary);
  min-height: 100vh;
  padding: 0 24px;
}
```

**Responsive web wireframes (accessed on mobile):**
```css
.responsive-frame {
  max-width: 768px;
  margin: 0 auto;
  background: var(--bg-primary);
  min-height: 100vh;
}
```

### Design System

**Do NOT use a hardcoded design system.** The design system (CSS variables, typography, colors, components, animations) is generated by the `frontend-design` skill in Phase 2 based on the user's chosen style.

Apply the design system output from `frontend-design` to all wireframe files. Ensure consistency across all files by using the same CSS variables and component classes.

The design system MUST include at minimum:
- CSS custom properties for: backgrounds, accents, text colors, semantic colors (success/warning/error), borders, radius, shadows, transitions
- A Google Fonts import matching the chosen aesthetic (avoid generic fonts like Arial, Inter, Roboto)
- Base reset (`box-sizing`, `margin`, `padding`)
- Body styling with the chosen font and background

### Required CSS component classes

Include ALL of these reusable component classes in every wireframe file. Only include components actually used in the screens, but always include the base set:

**Always include:**
- Screen navigation (`.screen-nav`)
- Screen sections (`.screen`, `.screen-label`)
- Cards (`.card`, `.card:hover`)
- Buttons (`.btn`, `.btn-primary`, `.btn-outline`, `.btn-ghost`, `.btn-sm`)
- Typography utilities (`.text-sm`, `.text-xs`, `.text-muted`, etc.)
- Spacing utilities (`.mt-*`, `.mb-*`)
- Flex utilities (`.flex`, `.flex-col`, `.items-center`, `.justify-between`, `.gap-*`)
- Badges (`.badge`, `.badge-green`, `.badge-amber`, `.badge-red`, `.badge-blue`)
- Dividers (`.divider`)

**Include when applicable:**
- Top bar (`.topbar`, `.avatar`, `.icon-btn`) — for screens with headers
- Form elements (`.form-group`, `.form-label`, `.form-input`) — for screens with forms
- List items (`.session-item` or custom list items) — for list screens
- Tab rows (`.tab-row`, `.tab-item`) — for screens with tabs
- Calendar grid (`.calendar-grid`, `.cal-day`) — for date selection screens
- Slot chips (`.slot-grid`, `.slot-chip`) — for time slot selection
- Step indicator (`.steps`, `.step`, `.step-circle`, `.step-line`) — for multi-step flows
- Star rating (`.star-rating`) — for review/rating screens
- Bottom tab bar (`.bottom-tabbar`, `.btab`) — for mobile app navigation
- Search bar (`.search-bar`) — for search screens
- Category grid (`.category-grid`, `.category-item`) — for category browsing
- Payment options (`.pay-opt`, `.pay-radio`) — for payment screens
- Success state (`.success-circle`) — for confirmation screens
- Menu items (`.menu-item`) — for profile/settings screens
- Cover image (`.cover-image`) — for detail screens with hero images
- Sticky CTA (`.sticky-cta`) — for screens with bottom action buttons
- Filter chips (`.filter-chips`, `.filter-chip`) — for search/filter screens
- Charts/stats (custom) — for dashboard/analytics screens

### Content guidelines

**Realistic sample data:**
- Use realistic names, numbers, and content adapted to the project's domain
- Use locale-appropriate names and currency (e.g., FCFA for West Africa, EUR for Europe, USD for US)
- Show 2-4 items in lists (enough to show the pattern, not overwhelming)
- Use realistic dates and times
- Include edge cases visually where relevant (empty states, loading states, error states — if the screen covers them)

**SVG icons:**
- Use inline SVG icons from Lucide (stroke-based, 24x24 viewBox)
- Common icons: home, search, bell, user, calendar, settings, chevron, arrow, heart, star, plus, check, x, edit, trash, share, copy, qrcode, wallet, chart, message
- Keep icons consistent: `stroke: currentColor; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;`

**Screen labels:**
- Each screen starts with a `.screen-label` badge showing `Screen N / Total`
- Follow with the screen title as `<h2>`
- Use a clear HTML comment separator between screens:
```html
<!-- ════════════════════════════════════════════════ -->
<!-- SCREEN N — [Screen Title]                       -->
<!-- ════════════════════════════════════════════════ -->
```

**Interactivity:**
- Wireframes are STATIC (no JavaScript)
- Show selected/active states via CSS classes (`.active`, `.selected`, `.done`)
- Use `:hover` effects on interactive elements
- The screen-nav links use anchor scrolling (`href="#sN"`)

## Phase 5 — Write files and summarize

1. Create the `wireframes/` directory if it doesn't exist
2. Write each wireframe HTML file
3. Display a summary:

```
Wireframes generated for: [Project Name]
Directory: wireframes/

  wireframe_[NN]_[journey].html
    → [Journey description]
    → [count] screens
    → ~[line count] lines

  [Repeat for each file...]

Total: [count] files, [total screens] screens
Open any file in a browser to preview.
```

## Important rules

- **This command is PROJECT-AGNOSTIC** — adapt to any project type
- **ALWAYS ask the user to choose a design style** (Phase 2) and **validate the scope** (Phase 3) before generating. Never skip these steps.
- **Use the `frontend-design` skill** to generate the design system — never hardcode colors, fonts, or themes
- **Self-contained HTML** — no external CSS/JS dependencies except Google Fonts. Everything must work by opening the file in a browser
- **Realistic data** — never use "Lorem ipsum" or placeholder text like "XXX". Use concrete, domain-appropriate content
- **Mobile-first** — if the project is a mobile app, use the phone frame (430px). If web, use the web frame
- **One file per user journey** — don't mix different user roles in the same file
- **Consistent design** — all wireframe files for the same project MUST share the same CSS variables and design system
- **Accessible** — use semantic HTML, proper heading hierarchy, sufficient color contrast
- **French UI text by default** — unless the spec specifies another language
- **Keep files manageable** — if a single wireframe file would exceed ~2000 lines, split into multiple files by sub-journey
- **Do NOT implement functionality** — wireframes are static visual prototypes, not working apps
