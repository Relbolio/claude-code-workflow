---
description: Generate a comprehensive test checklist for a feature based on its implementation plan and spec. Auto-detects the relevant test categories (unit, integration, e2e, api, Playwright, regression, observability, performance, security) according to the feature's nature (backend, frontend, full-stack). Writes the checklist in `_tests/` following the project's existing convention. Each test maps to acceptance criteria with severity markers.
argument-hint: <path-to-plan-file>
allowed-tools: Read, Glob, Grep, Bash(mkdir:*), Bash(ls:*), Bash(git branch:*), Agent(Explore), Write
---

# Create Feature Tests -- Plan-to-Test-Checklist Generator

You receive an implementation plan file as input. You must analyze the plan, its spec, the codebase, and the existing test conventions, then produce a comprehensive test checklist in `_tests/`. The checklist must cover every acceptance criterion AND every documented risk, mapped to concrete tests with severity markers.

**Plan source:** $ARGUMENTS

---

## Phase 0 -- Project context (ALWAYS do this first)

### 0.1 Project identity

1. **Read CLAUDE.md** -- project name, stack, architecture, conventions, critical rules. Identify :
   - Backend framework + ORM (impacts integration test patterns).
   - Frontend framework + state management + routing (impacts e2e patterns).
   - Test runners (`jest`, `vitest`, `pytest`, `go test`, `cargo test`, etc.).
   - E2E framework (`playwright`, `cypress`, `selenium`, `appium`, `flutter_test`, etc.).
   - i18n approach (impacts string-based test assertions).
   - Multi-tenancy / authorization conventions (impacts test fixtures + security tests).

2. **Identify the test commands** from `package.json` / `Makefile` / `tasks.json` :
   - Unit : `npm run test`, `jest`, `vitest`, ...
   - Integration : `npm run test:integration`, `npm run test:e2e`, ...
   - E2E : `npm run test:e2e`, `npx playwright test`, ...
   - Lint / build : `npm run lint`, `npm run build`, ...

### 0.2 Identify the existing test convention

1. `ls _tests/` (or `ls tests/`, `ls __tests__/`) -- list every existing test checklist.
2. **Read at least one existing test checklist** that matches the feature type (backend-only, frontend-only, full-stack). Note its :
   - Header format (Spec/Plan/US/Branch/URLs).
   - Section structure (Pre-requis, Comptes de test, Fixtures, Scenarios numbered or labelled).
   - Test ID convention (`T-PRE-NN`, `T-UNIT-NN`, `Scenario N`, etc.).
   - Severity markers (`VETO` / `IMPORTANT` / `NICE`, or other project convention).
   - Verification commands at the end.
   - Recap table at the end.

If `_tests/` (or equivalent) doesn't exist, you'll create it (ask permission via `mkdir -p _tests` after warning).

If multiple conventions coexist, pick the one most similar to the current feature's nature.

## Phase 1 -- Read the plan and spec

1. **Read the plan** at `$ARGUMENTS` in full. Extract :
   - Feature title + branch.
   - Spec source path -- read it in full too.
   - Steps (each step typically declares acceptance criteria addressed).
   - Files to create / modify (helps target regression tests).
   - Risks (each risk should map to at least 1 test).

2. **Read the spec** :
   - Every acceptance criterion (CAx) -- each must map to >= 1 test.
   - Every "out of scope" item -- might need a regression test that proves it stays out of scope.
   - Every documented invariant or rule -- security / data integrity tests.

3. **Build a coverage matrix** in your head : `{ CA1, CA2, ..., R1, R2, ..., outOfScope1, ... }`. Every entry must be covered by at least one VETO or IMPORTANT test.

## Phase 2 -- Identify applicable test categories

Based on the feature's nature, decide which categories apply. **Not every feature needs every category** -- a backend cron doesn't need Playwright, a static UI tweak doesn't need integration tests against a real DB.

### Standard categories (adapt to project)

| Category | Marker | Applies when |
|---|---|---|
| Pre-requisites | `T-PRE-*` | Always (env, seed, dependencies) |
| Unit | `T-UNIT-*` | Pure logic / utilities / pure functions |
| Integration | `T-INT-*` | Service + DB / service + external API mock |
| API contract | `T-API-*` | New REST/GraphQL/RPC endpoint |
| End-to-end manual | `T-E2E-*` | Full flow not automatable, or pre-Playwright validation |
| Playwright (browser) | `T-PW-*` or `Scenario N` | UI flow with user interaction |
| Mobile (Flutter / native) | `T-MOB-*` | Mobile UI flow |
| Webhooks / async | `T-WH-*` | Inbound webhook handlers |
| Cron / scheduler | `T-CRON-*` | Scheduled job behaviour |
| Non-regression | `T-REG-*` | Always (proves the feature didn't break adjacent features) |
| Observability / SRE | `T-OBS-*` | New logs, metrics, tracing |
| Performance / volumetrie | `T-PERF-*` | Filter / query / scan that may degrade at scale |
| Security | `T-SEC-*` | Auth, authz, multi-tenancy, input validation |
| Accessibility | `T-A11Y-*` | UI changes (WCAG, screen reader, keyboard nav) |
| i18n | `T-I18N-*` | New user-facing strings |
| Theming / dark mode | `T-THEME-*` | UI components |
| Migration / data integrity | `T-MIG-*` | Prisma / Alembic / Flyway migration |
| Pre-merge gates | `T-FINAL-*` | Always (build, lint, code review checks) |

### Decision rules

- **Backend-only feature** -- skip `T-PW-*`, `T-A11Y-*`, `T-THEME-*`, `T-I18N-*` (unless feature changes user-facing API messages).
- **Frontend-only UI tweak** -- skip `T-INT-*`, `T-WH-*`, `T-CRON-*`, `T-MIG-*`. Add `T-PW-*` and `T-A11Y-*`.
- **Cron / scheduled job** -- add `T-CRON-*`, `T-OBS-*`. Skip `T-API-*` unless an admin endpoint exists.
- **Webhook handler** -- add `T-WH-*`, `T-SEC-*` (signature validation), `T-PERF-*` (replay storms).
- **New REST endpoint** -- add `T-API-*` (status codes, payload shapes), `T-SEC-*` (authz matrix).
- **Schema migration** -- add `T-MIG-*` (forward/backward compat).
- **Multi-tenant feature** -- ALWAYS add `T-SEC-*` for tenant isolation.

## Phase 3 -- Severity classification

For each test, assign a severity marker matching the project's convention. Default convention :

- **VETO** -- failure blocks the merge. An invariant violation, a CA fundamental, a security hole, a data corruption.
- **IMPORTANT** -- failure must be fixed before merge unless explicitly justified. CA secondary, observability, performance under nominal load.
- **NICE** -- failure accepted with a tracked T-DEBT issue. Defensive theoretical tests, far-future optimizations.

Heuristics :
- A CA with the word "must" / "MUST" / "obligatoire" in the spec -> VETO.
- An "out of scope" assertion (verifying it stays out of scope) -> IMPORTANT.
- A defensive test for an unreachable code path -> NICE.
- A multi-tenancy isolation test -> always VETO.
- An audit/log format test -> IMPORTANT.
- A performance test under nominal load -> IMPORTANT. Under stress/abnormal load -> NICE.

## Phase 3 bis -- Three columns every test line MUST carry ⭐

A checklist that lists *what will be verified* produces guards that were born green. Add three columns, and refuse to write a line that cannot fill them.

**1. THE FACT IT READS** -- not the wording of the assertion, the fact. Not *"a refusal is displayed"* but *"THIS refusal code, and the counter did not move"*. Not *"a response arrives"* but *"the response branch that is required when the health endpoint says the provider is configured"*.

> Measured failure mode : a guard reads a fact **adjacent** to the one it claims to hold -- the state instead of the origin, a blacklist where a whitelist was promised. No review catches it, because the guard *says* the right thing. Four occurrences on a single batch.

**2. THE WITNESS MUTATION** -- the minimal break in production code that must turn this test red, written **before** the test. If you cannot name it, the test is describing an execution path, not guarding a property.

> And it is **played**, not written : see the workflow's step 12 bis. A probe that modifies nothing is indiscernable from a guard that holds nothing.

**3. THE PRESENCE TWIN** -- every assertion of ABSENCE requires its twin assertion of PRESENCE, on the same run.

> *"The element does not appear"* stays green when the element exists nowhere -- including because its rendering was broken by the very change under test. Measured : **5 guards out of 7** on one batch could be green while holding nothing, several of them for exactly this reason.

**Three more rules that come from measured defects, not from principle :**

- **A closed list iterated against an open dictionary needs a parity guard PER DICTIONARY.** Any `CATALOG.map(k => t(k))` gets one. Three occurrences paid : 28 permissions of 45 with no label for eleven batches · 21 entitlements of 31 · **22 of 32 on a PUBLIC pricing page**, showing raw keys to prospects. Code parity says nothing about label presence.
- **A guard that exercises a path through a GESTURE says nothing about the DEFAULT path.** Measured : a test switched the language *by clicking*, asserted correctly, and stayed green for 131 commits above a defect that only ever hit users who clicked nothing. For every gated behaviour, add the line : *what does the user who does nothing get ?*
- **`toEqual` erases `undefined`, and a table-driven test cannot see an orphan key.** If the guard compares two structures, assert the **key sets** separately in both directions.

---

## Phase 4 -- Build the test checklist

### 4.1 Determine the file path

Derive from the plan/spec name : `_specs/foo.md` -> `_plans/foo.md` -> `_tests/foo.md`.

If `_tests/` doesn't exist, create it via `mkdir -p _tests`.

### 4.2 Use the project's existing checklist as a structural template

Copy the structural skeleton (header, section ordering, ID conventions) from the existing checklist you read in Phase 0.2. **Do not invent a different convention.**

### 4.3 Universal structure (adapt section names to project convention)

```markdown
# Test Checklist -- {Feature title}

**Spec :** `_specs/{name}.md`
**Plan :** `_plans/{name}.md`
**User stories :** {US-XXX, US-YYY} or "Derived"
**Branch :** `{branch}`
**Phase :** {project phase if applicable}
**Base URLs :** {backend / frontend / external services}

> Brief intro :
> - Feature nature (backend / frontend / full-stack).
> - What kind of validation (Jest unit + integration + manual e2e ; or Playwright ; etc.).
> - Severity legend (VETO / IMPORTANT / NICE).
> - Decisions integrees (revisions of the spec).

---

## Legende statuts

- `[ ] TODO` : test a executer.
- `[x] PASS` : test execute avec succes.
- `[!] FAIL` : test echoue, blocage merge a documenter.
- `[~] SKIP` : test reporte (justifier).

**Marqueurs de severite :**
- `VETO` -- echec bloque le merge.
- `IMPORTANT` -- echec demande correction avant merge.
- `NICE` -- echec accepte si justifie.

---

## 0. Pre-requis d'execution

[Env vars, prerequisite features merged, dependencies, fixtures, test accounts]

### Commandes

```bash
[exact project commands for build, test, lint, e2e]
```

### Comptes de test

[If applicable -- adapt to project's seed convention]

### Fixtures DB necessaires

[If applicable -- table of fixtures with IDs and key fields]

---

## 1. Tests unitaires {framework}

[Unit tests with T-UNIT-NN IDs, each mapped to >= 1 CA]

## 2. Tests d'integration

[If applicable]

## 3. Tests API

[If applicable]

## 4. Tests end-to-end {Playwright/manuel/etc.}

[If applicable]

## 5. Tests cron / async

[If applicable]

## 6. Tests de non-regression

[Always present -- prove adjacent features still work]

## 7. Tests observabilite / SRE

[If applicable]

## 8. Tests de performance / volumetrie

[If applicable]

## 9. Tests de securite

[Always present if any auth/authz/tenancy/input]

## 10. Tests accessibilite / i18n / theming

[If UI feature]

## 11. Verifications finales pre-merge

```bash
[grep checks for forbidden patterns from CLAUDE.md, e.g. no Co-Author-Claude, no `any`, no hardcoded colors]
```

[Final gate checks T-FINAL-NN]

---

## Recapitulatif compte de tests

| Categorie | Cibles | VETO | IMPORTANT | NICE |
|---|---|---|---|---|
| Unit | N | n | n | n |
| ... | | | | |
| **TOTAL** | **N** | **n** | **n** | **n** |

**Bottom line** : N tests VETO bloquent le merge si echec. N tests IMPORTANT a corriger avant merge sauf justification. N tests NICE optionnels.

**Couverture acceptance criteria** : N/N CA mappees a au moins 1 test VETO ou IMPORTANT.
```

### 4.4 Per-test entry format

Each test must follow this exact structure :

```markdown
- [ ] **T-{CAT}-{NN} [{SEVERITY}]** `{test name in test runner syntax if applicable}` -- couvre **CA{N}** {ou regle/risque/decision}.
  - {Setup / Arrange in 1-2 bullets}.
  - {Action / Act}.
  - {Assertions / expected result}.
  - **Mutation temoin** : {la modification d'UNE ligne du code de production qui DOIT faire virer ce test au rouge}.
```

Example :
```markdown
- [ ] **T-UNIT-04 [VETO]** `it('uses 5-minute grace period for cutoff')` -- couvre **CA3**.
  - `jest.useFakeTimers()` + `jest.setSystemTime(new Date('2026-05-10T12:00:00Z'))`.
  - Lancer `cron.run()`.
  - Assert que le `where.createdAt.lt.toISOString() === '2026-05-10T11:55:00.000Z'`.
  - **Mutation temoin** : porter la constante de grace de 5 a 10 minutes dans le service cron.
```

### 4.5 Verification commands at the end

Always include a final block of `bash` checks specific to the project's CLAUDE.md rules. Examples :

```bash
# Code review checks
grep -rn "Co-Authored-By: Claude" {paths}                # 0 match -- CLAUDE.md rule
grep -rn ": any\b" {feature path}                        # 0 match -- strict TS
grep -rn "bg-blue-\|text-white\b" {ui path}              # 0 match -- theming R5
wc -l {feature file}                                     # < {project max}

# Build & test gates
{build command}                                          # 0 erreur
{test command}                                           # 0 fail
{lint command}                                           # 0 warning
```

These checks are project-specific -- read CLAUDE.md to identify which rules apply.

## Phase 5 -- Coverage verification before write

Before writing the file, verify in your head that EVERY :
- Acceptance criterion (CAx) -> >= 1 VETO or IMPORTANT test.
- Risk documented in plan -> >= 1 test.
- "Out of scope" assertion -> >= 1 IMPORTANT regression test (proves it stays out).
- CLAUDE.md non-negotiable rule that applies to the feature -> >= 1 test in `T-FINAL-*` or `T-SEC-*`.

If a CA has no test, ADD ONE. If a risk has no test, ADD ONE.

## Phase 6 -- Write and summarize

1. Create `_tests/` if missing : `mkdir -p _tests`.
2. Write the file at `_tests/{name}.md` (matching the plan/spec name).
3. Output a short summary :

```
Test checklist created: _tests/{name}.md
Feature: {title}
Categories: {N} (Unit / Integration / E2E / Regression / ...)
Total tests: {N}
- VETO (bloque merge): {n}
- IMPORTANT: {n}
- NICE: {n}
Coverage: {N}/{N} CA mappees a >= 1 test VETO ou IMPORTANT.
Risks covered: {N}/{N} risques du plan ont >= 1 test associe.
```

If any CA or risk could not be mapped to a test, list them explicitly and explain why (rare cases like "purely conceptual decision, no test possible").

## Important rules

- **PROJECT-AGNOSTIC** -- adapt section names, severity labels, test IDs, and commands to the project's existing convention. Do NOT impose `_tests/` on a project that uses `tests/` or `__tests__/`.
- **Always read at least one existing test file first** -- mimic its structure exactly. The user has invested time in a convention ; respect it.
- **Every CA must map to >= 1 VETO or IMPORTANT test** -- this is the non-negotiable coverage rule.
- **Every documented risk must map to >= 1 test** -- otherwise the risk is not actually mitigated.
- **Every VETO test carries its `Mutation temoin`** -- if you cannot name a one-line change to the code it claims to cover that turns it red, the test asserts something the code cannot violate: rewrite the assertion or downgrade it to NICE. Rerunning an existing suite is evidence of nothing -- on two full lots it surfaced zero defects.
- **Project rules from CLAUDE.md become regression / security / final tests** -- e.g., "no Co-Author Claude" becomes a `grep` check in `T-FINAL-*`.
- **Test names should match the test runner syntax** if applicable (`it('...')` for Jest/Vitest, `test('...', () => {...})` for Playwright, `def test_...` for pytest, etc.).
- **Severity is honest** -- don't mark everything VETO to look thorough ; don't mark everything NICE to avoid blocking.
- **Recommend test count proportional to feature size** -- a 100-line cron : 30-50 tests. A 5000-line module : 100-200 tests. A 1-line CSS fix : 5-10 tests.
- **Include a `T-FINAL-*` block of grep checks** for forbidden patterns mentioned in CLAUDE.md (e.g., `any`, `console.log`, hardcoded colors, file size).
- **Output language matches project convention** -- if specs/plans are in French, the test file is in French.
- **Do NOT implement tests** -- this command produces a checklist, not test code. Test code is implemented in the actual `*.spec.ts` / `*.test.ts` / etc. files during implementation.
- **NEVER produce code in this command's chat output** -- only the file write + a short summary.
- **Cite spec / plan IDs in test descriptions** -- `couvre CA3` is mandatory ; without it the coverage matrix is unverifiable.
