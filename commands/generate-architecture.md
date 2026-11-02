---
description: Generate a technical architecture document from user stories and/or specs. Guides the user through tech stack choices (platform, framework, backend, state management, etc.) then produces a comprehensive architecture file in specs/. Adapts to any tech project.
argument-hint: <path-to-userStories-dir-or-spec-file> [additional-spec-file]
allowed-tools: Read, Write, Glob, Bash(mkdir:*), Bash(ls:*)
---

# Generate Architecture — Technical Architecture Generator

You receive user stories directory and/or spec file(s) as input. You must analyze them, guide the user through technology choices, then produce a comprehensive architecture document in `specs/`.

**Input source(s):** $ARGUMENTS

---

## Phase 1 — Read and analyze inputs

1. **Parse arguments** — identify whether the input is:
   - A directory path (user stories) → read all `.md` files in it
   - A file path (spec) → read it in full
   - Multiple paths → read all of them
2. **Extract requirements that impact architecture**:
   - **Platforms**: mobile (iOS/Android), web, desktop, API, hybrid
   - **User roles**: how many, what they do (impacts auth, routing, permissions)
   - **Data entities**: what models exist (from user stories/spec features)
   - **Data relationships**: how entities relate to each other
   - **Real-time needs**: any feature requiring live updates (chat, notifications, live calendars)
   - **Offline needs**: any feature requiring offline access
   - **Payment integration**: any payment flow (impacts security, PCI compliance)
   - **File storage**: images, documents, media uploads
   - **Search/discovery**: full-text search, filters, geolocation
   - **Notifications**: push, email, SMS
   - **Authentication methods**: email, phone, social login, SSO
   - **i18n needs**: multi-language support
   - **Scale expectations**: implied user base size
   - **Security requirements**: data sensitivity, compliance needs (GDPR, PCI, HIPAA)
   - **Third-party integrations**: payment gateways, maps, analytics, messaging

## Phase 2 — Interactive tech stack guidance

Before generating the architecture, engage the user in a structured conversation to define the tech stack. Present choices as clear options with pros/cons.

### Step 1: Platform & Framework

```
Architecture Guide — Platform & Framework
==========================================

Based on your spec, I identified:
  - [N] user roles
  - [N] screens/pages
  - Real-time features: [yes/no]
  - Payment integration: [yes/no]
  - Offline needs: [yes/no]

Platform type:
  A) Mobile app (iOS + Android)
  B) Web application
  C) Mobile + Web (cross-platform)
  D) API/Backend only

[If A or C — Mobile framework:]
  1) Flutter (Dart) — Cross-platform, single codebase, rich UI, strong ecosystem
  2) React Native (JavaScript/TypeScript) — Cross-platform, large community, JS ecosystem
  3) Native (Swift + Kotlin) — Best performance, platform-specific UIs, 2 codebases

[If B or C — Web framework:]
  1) Next.js (React) — Full-stack, SSR/SSG, large ecosystem, Vercel deployment
  2) Nuxt.js (Vue) — Full-stack, SSR/SSG, Vue ecosystem
  3) SvelteKit (Svelte) — Lightweight, fast, modern DX
  4) Angular — Enterprise-grade, opinionated, TypeScript-first

Your choice? (e.g., "A1" for Mobile + Flutter, "C1+1" for Mobile Flutter + Web Next.js)
```

### Step 2: Backend & Database

```
Backend & Database
==================

[If using BaaS-compatible setup:]
  A) Firebase (Firestore + Auth + Storage + FCM)
     ✓ Real-time sync, auth built-in, serverless
     ✗ Vendor lock-in, limited querying, cost at scale
  B) Supabase (PostgreSQL + Auth + Storage + Realtime)
     ✓ Open-source, SQL power, real-time, self-hostable
     ✗ Newer ecosystem, fewer SDKs
  C) Custom Backend
     → Which framework?
       1) Node.js (Express/Fastify/NestJS)
       2) Python (Django/FastAPI)
       3) Go (Gin/Fiber)
       4) Rust (Actix/Axum)
     → Which database?
       1) PostgreSQL — Relational, robust, extensible
       2) MongoDB — Document-based, flexible schema
       3) MySQL — Relational, widely supported
     → Which ORM/ODM?
       [Suggest based on framework choice]

[If payment is needed:]
  Payment gateway:
    1) Stripe — Global, well-documented, PCI compliant
    2) PayStack — Africa-focused, Mobile Money support
    3) Flutterwave — Africa-focused, Multi-currency
    4) CinetPay — West Africa focus, FCFA, Orange/MTN/Wave
    5) Custom PSP integration

Your choice?
```

### Step 3: State Management (if applicable)

```
State Management
================

[For Flutter:]
  1) Riverpod — Type-safe, testable, recommended for complex apps
  2) Bloc/Cubit — Event-driven, strict separation, enterprise-grade
  3) Provider — Simple, built-in, good for small-medium apps
  4) GetX — All-in-one, rapid development, less structured

[For React/Next.js:]
  1) Zustand — Lightweight, minimal boilerplate
  2) Redux Toolkit — Predictable, DevTools, large apps
  3) Jotai — Atomic, bottom-up, React-native feel
  4) TanStack Query — Server-state focused, caching, sync

[For Vue/Nuxt:]
  1) Pinia — Official, TypeScript-first, modular
  2) Vuex — Legacy but stable, large community

Your choice?
```

### Step 4: Architecture Pattern

```
Architecture Pattern
====================

  A) MVVM + Repository
     → Model-View-ViewModel with Repository layer for data access
     → Best for: mobile apps, BaaS backends, reactive UIs
     → Clean separation: UI ↔ ViewModel ↔ Repository ↔ Data Source

  B) Clean Architecture (Layered)
     → Domain-driven with strict layer boundaries
     → Best for: complex business logic, large teams, testability
     → Layers: Presentation → Domain (Use Cases) → Data (Repositories + Sources)

  C) Feature-First (Modular)
     → Each feature is self-contained with its own layers
     → Best for: medium-large apps, independent feature development
     → Structure: features/[name]/{data, domain, presentation}

  D) MVC (Model-View-Controller)
     → Traditional pattern, simple, well-understood
     → Best for: web apps, CRUD-heavy apps, small teams

  E) Hexagonal (Ports & Adapters)
     → Core logic isolated from external dependencies
     → Best for: backend services, microservices, high testability

Your choice?
```

### Step 5: Additional choices (quick picks)

```
Additional Choices
==================

Routing:
  [Suggest based on framework — e.g., GoRouter for Flutter, App Router for Next.js]

Authentication:
  [Suggest based on backend — e.g., Firebase Auth, NextAuth, Passport.js]

File Storage:
  [Suggest based on backend — e.g., Firebase Storage, S3, Cloudinary]

Notifications:
  [Suggest based on platform — e.g., FCM, OneSignal, custom WebSocket]

CI/CD:
  1) GitHub Actions
  2) GitLab CI
  3) Codemagic (Flutter-specific)
  4) Vercel (web)

Testing strategy:
  - Unit tests: [framework-specific suggestion]
  - Widget/Component tests: [suggestion]
  - Integration tests: [suggestion]

Confirm these defaults or specify changes:
```

### IMPORTANT: Wait for user responses

- Present all questions in Phase 2 in a SINGLE message (not one by one)
- Wait for the user to respond before proceeding
- If the user says something like "you choose" or "recommend the best", make opinionated choices based on the project requirements and justify each one briefly
- If the user specifies partial choices (e.g., "Flutter + Firebase"), fill in the remaining choices with best-practice recommendations

## Phase 3 — Generate the architecture document

Once tech choices are confirmed, generate the architecture following this structure:

```markdown
# [Project Name] — Architecture Technique (Proposition)

> **Version** : 1.0
> **Date** : [current date]
> **Stack** : [Framework] + [State Mgmt] + [Backend/DB] + [Auth] + [Storage]
> **Pattern** : [Architecture Pattern]

---

## 1. Structure des Repertoires

[Full directory tree of the project, annotated with comments explaining each file/folder's purpose]

The tree must:
- Cover ALL layers (config, core, data, services, shared, features)
- Map to the screens/features identified in the spec/user stories
- Include file names for all screens, providers, services, models
- Add inline comments (# ...) explaining each file's role
- Follow the framework's conventions and best practices

Example format:
```
src/ (or lib/)
├── main entry file              # Entry point, app initialization
├── app file                     # App config, router, theme
│
├── config/
│   ├── theme/                   # Design tokens
│   ├── routes/                  # Router configuration
│   └── constants/               # Business constants, API paths
│
├── core/
│   ├── extensions/              # Type extensions
│   ├── utils/                   # Validators, formatters
│   ├── exceptions/              # Typed exceptions
│   └── providers/ (or hooks/)   # Shared state
│
├── data/
│   ├── models/                  # Data models (immutable)
│   └── enums/                   # Business enums
│
├── services/
│   ├── [backend]/               # Data access layer
│   ├── auth/                    # Authentication service
│   ├── storage/                 # File storage service
│   ├── notification/            # Push/email service
│   └── payment/                 # Payment gateway service
│
├── shared/
│   ├── widgets/ (or components/)
│   │   ├── buttons/
│   │   ├── inputs/
│   │   ├── cards/
│   │   ├── feedback/
│   │   ├── layout/
│   │   └── [domain-specific]/
│   └── dialogs/ (or modals/)
│
├── features/
│   ├── [feature-1]/
│   │   ├── providers/ (or state/)
│   │   └── presentation/
│   │       ├── screens/ (or pages/)
│   │       └── widgets/ (or components/)
│   ├── [feature-2]/
│   └── ...
│
└── generated/                   # Auto-generated files
```

---

## 2. Couches et Responsabilites

For each layer (config, core, shared, data, services, features), provide:

### 2.N [Layer Name] (`path/`)

[1-2 sentence description of this layer's purpose]

| Dossier | Role |
|---------|------|
| `sub-folder/` | [What it contains and why] |

Key rules:
- [Rule 1 for this layer]
- [Rule 2 for this layer]

---

## 3. Structure [Database/Backend]

### 3.1 [Collections / Tables / Schema]

[Visual representation of the data structure:]

For document DBs (Firestore, MongoDB):
```
database-root/
├── collection/
│   └── {docId}/
│       ├── field1
│       └── sub-collection/
```

For relational DBs (PostgreSQL, MySQL):
```sql
-- Table definitions with relationships
CREATE TABLE users (...)
CREATE TABLE sessions (...)
-- Foreign keys, indexes
```

For API backends:
```
/api/v1/
├── /auth
├── /users
├── /[main-entity]
└── /[secondary-entity]
```

### 3.2 Chemins / Endpoints Centralises

[Code example showing centralized path/endpoint constants]

---

## 4. Gestion d'Etat — [State Management Library]

### 4.1 [Core/Global Providers]

[Code examples showing how core state is provided — DB instances, auth, services]

### 4.2 [Service Providers]

[Code examples showing how services are instantiated and injected]

### 4.3 [Feature Providers]

[Code examples showing typical feature-level state management patterns:
- Read-only stream/query
- Mutable controller with actions
- Form state management]

---

## 5. Theme & Composants Reutilisables

### 5.1 Configuration du Theme

[Code examples for design tokens: colors, typography, spacing, radius, shadows]

Provide framework-specific examples:
- Flutter: AppColors, AppDimensions, AppTextStyles classes
- React: CSS variables or Tailwind config
- Vue: SCSS variables or design token files

### 5.2 Approche Composants

[Code example of a typical shared/reusable component showing:
- Props/parameters with defaults
- Theme integration
- No business logic
- Naming convention]

Key principles:
- [Prefix convention — e.g., Bm* for BookMe, Pk* for PocketKeep]
- [Const/memo optimization]
- [Theme-driven styling]

---

## 6. Routing

[Code example showing router configuration with:
- Auth guards/redirects
- Role-based routing
- Deep linking setup (if applicable)
- Nested navigation / shell routes (if applicable)]

---

## 7. Flux de Donnees (Diagramme)

[ASCII art diagram showing the data flow from UI to backend:]

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│    UI    │────▶│  State   │────▶│ Service  │────▶│ Backend  │
│ (Screen) │     │(Provider)│     │  (Repo)  │     │  (DB)    │
│          │◀────│          │◀────│          │◀────│          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

[Include a concrete flow example showing a typical user action through all layers]

---

## 8. Dependances (package manager config)

[List all dependencies with versions, grouped by category:]

```yaml (or json)
dependencies:
  # State Management
  [package]: ^x.y.z

  # Routing
  [package]: ^x.y.z

  # Backend/DB
  [package]: ^x.y.z

  # UI
  [package]: ^x.y.z

  # Utils
  [package]: ^x.y.z

dev_dependencies:
  # Code generation
  [package]: ^x.y.z

  # Testing
  [package]: ^x.y.z

  # Linting
  [package]: ^x.y.z
```

---

## 9. Securite

### 9.1 Authentification

| Aspect | Implementation |
|--------|---------------|
| Token management | [JWT, session cookies, etc.] |
| Password policy | [Min length, complexity] |
| Rate limiting | [Login attempts, API calls] |
| Session expiry | [Duration, refresh strategy] |

### 9.2 Protection des Donnees

| Aspect | Implementation |
|--------|---------------|
| Transport | [TLS/SSL, certificate pinning] |
| Storage | [Encryption at rest, secure storage] |
| PII handling | [Anonymization, data retention] |
| Input validation | [Sanitization, parameterized queries] |

### 9.3 Regles de Securite [Backend]

[For Firebase: Firestore security rules example]
[For SQL: Row-level security or middleware example]
[For API: Auth middleware, CORS, rate limiting]

### 9.4 OWASP Top 10 Mitigations

| Risk | Mitigation |
|------|------------|
| Injection | [Parameterized queries, input validation] |
| Broken Auth | [Secure token storage, MFA support] |
| Sensitive Data Exposure | [Encryption, no secrets in client] |
| XSS | [Output encoding, CSP headers] |
| CSRF | [Anti-CSRF tokens, SameSite cookies] |
| [Continue for relevant risks...] | |

---

## 10. Regles de Developpement

| Regle | Detail |
|-------|--------|
| **Nommage fichiers** | [Convention: snake_case, kebab-case, etc.] |
| **Nommage classes/composants** | [Convention: PascalCase, etc.] |
| **Prefixe composants** | [Project prefix for shared components] |
| **Taille fichiers** | [Max lines per file] |
| **Logique dans les widgets/composants** | [No business logic in UI — use state management] |
| **Services stateless** | [Services don't hold state] |
| **Error handling** | [Typed exceptions, AsyncValue.when or error boundaries] |
| **i18n** | [How to handle internationalization] |
| **Testing** | [Minimum coverage expectations, what to test] |

---

## 11. Ordre d'Implementation Recommande

| Phase | Contenu | Depend de |
|-------|---------|-----------|
| **Phase 1** | [Foundation: config, core, shared] | — |
| **Phase 2** | [Infrastructure: services, base data layer] | Phase 1 |
| **Phase 3** | [Auth feature] | Phase 2 |
| **Phase 4** | [Primary role features] | Phase 3 |
| **Phase 5** | [Secondary role features] | Phase 3 |
| **Phase 6** | [Supporting features: notifications, analytics] | Phase 4-5 |
| **Phase 7** | [Polish: testing, optimization, deployment] | Phase 6 |

---

## 12. Environnement de Developpement

### 12.1 Prerequisites

| Outil | Version |
|-------|---------|
| [Runtime] | [Version] |
| [SDK] | [Version] |
| [Package manager] | [Version] |
| [CLI tools] | [Version] |

### 12.2 Commandes Essentielles

```bash
# Installation
[command]

# Lancement dev
[command]

# Build production
[command]

# Tests
[command]

# Code generation (if applicable)
[command]

# Linting
[command]
```

---

*Document genere le [current date] — [Project Name] Architecture Technique*
```

## Phase 4 — Write file and summarize

1. Create `specs/` directory if it doesn't exist
2. Write the architecture to `specs/[PROJECT_NAME]_ARCHITECTURE.md`
3. Display a summary:

```
Architecture generated for: [Project Name]
File: specs/[PROJECT_NAME]_ARCHITECTURE.md

Stack: [Framework] + [State Mgmt] + [Backend] + [Auth]
Pattern: [Architecture Pattern]
Sections: 12

Structure:
  - [N] layers identified
  - [N] features mapped
  - [N] services defined
  - [N] data models/collections
  - [N] shared components categories

Dependencies: [N] packages
Security: [N] rules defined
Implementation phases: [N]
```

## Important rules

- **This command is PROJECT-AGNOSTIC** — adapt to any tech project
- **ALWAYS guide the user through tech choices** (Phase 2). Never skip this interactive step. If the user provides no preferences, present the options and recommend based on project requirements.
- **Opinionated recommendations** — when recommending, justify with concrete reasons tied to the project's requirements (e.g., "Firebase recommended because the spec mentions real-time features and push notifications")
- **Security-first** — always include a security section. Cover authentication, data protection, security rules, and relevant OWASP mitigations. Adapt depth to the project's risk profile (payment apps need more than simple CRUD apps).
- **Best practices** — follow the latest conventions and patterns for the chosen stack. Use up-to-date dependency versions. Follow the framework's official recommendations.
- **Code examples** — include concrete code examples for key patterns (state management, routing, service layer, shared components). Examples should be idiomatic for the chosen framework and represent production-quality code.
- **Map to user stories** — the architecture must cover ALL features identified in the user stories. Every screen from the user stories should have a corresponding file in the directory structure. Every data entity should have a model and a service.
- **No invented features** — only architect for what exists in the input. Don't add features that aren't in the spec/user stories.
- **French text** — section titles and descriptions in French (matching existing BookMe pattern). Code identifiers in English.
- **Practical** — the architecture should be implementable, not academic. Focus on what a developer needs to start coding.
- **Dependency versions** — use current, stable versions. Don't use deprecated packages or beta versions unless justified.
- **Directory tree is exhaustive** — list EVERY file that will need to be created, with comments. This is the developer's blueprint.
- **Keep the document complete but focused** — aim for 400-700 lines. Enough detail to be useful, not so much that it becomes overwhelming.
