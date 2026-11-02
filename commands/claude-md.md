---
description: Create the project's CLAUDE.md if absent, or bring an existing one into conformance -- and keep it current as the project advances. Invocable at any point : first, to establish the mandatory workflow before anything else ; at the end of phase 1, to fold in the specs and architecture just produced ; or mid-implementation, to record a rule, an invariant or a trap discovered while coding. Additive and non-destructive : paid knowledge is never deleted.
argument-hint: [note libre sur ce qui vient d'etre appris, ou --audit pour un diagnostic sans ecriture]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git log:*), Bash(git status:*), Bash(git diff:*), Bash(git branch:*), Bash(ls:*), Bash(cat:*), Agent(Explore)
---

# CLAUDE.md -- create, conform, and keep current

`CLAUDE.md` is the only file read automatically at the start of every session. It is therefore the **sole load-bearing artifact** of the whole workflow : commands installed at user scope are *available*, never *mandatory*. What makes them mandatory is this file declaring them so.

This command is **idempotent**. Run it ten times, get a better file each time and never a lost one.

**Argument** : `$ARGUMENTS` -- free text describing what was just learned (a trap paid, a rule discovered, a decision taken), or `--audit` for a diagnosis with no write.

---

## Phase 0 -- Situate before writing a line

1. **Does `CLAUDE.md` exist ?** At the repo root, and in any parent directory -- a project nested inside another repo **inherits the parent's file**, which is a frequent and invisible source of wrong conventions. If a parent one exists, the file you write must state **which of the two prevails, and on what**.
2. **What stage is the project at ?** Decide from evidence, not assumption :
   - `docs/`, `versions/`, `specs/`, `userStories/` present or absent
   - source directories present ? a package manifest ? a schema ?
   - `git log --oneline -30` : is anything implemented, or is the repo documentation only ?
   - `_specs/`, `_plans/`, `_tests/`, `_resumes/` : is a feature cycle already running ?
3. **What is already known ?** Read, in this order of authority, whatever exists : a product contract or arbitration document, a decision note, version files, the consolidated spec, the user story index, the architecture doc. **These are the sources.** Everything you write must trace back to one of them, to the code, or to the conversation.

Then pick the mode :

| Mode | When | What it does |
|---|---|---|
| **CREATE** | No `CLAUDE.md` | Write the full file from the sources found |
| **CONFORM** | One exists but is thin, generic, or off-convention | Restructure to the canonical sections, **keeping every substantive line already there** |
| **ENRICH** | One exists and is sound ; `$ARGUMENTS` carries something new | Insert the new knowledge at the right section, touch nothing else |

Announce the mode and its evidence in one sentence before writing.

---

## The canonical structure

Order matters : it goes from what settles disputes, down to what is merely useful.

1. **Authority header** -- what this file governs, and its relation to any parent `CLAUDE.md`. One paragraph. If a parent exists, name explicitly the conventions of the parent that **do not apply here** ; a nested project silently inheriting a sibling's rules is a real and costly failure.
2. **Product and technical identity** -- a table : product name and where it is read from (never hardcoded), shared-component prefix, theme token prefix, storage key prefix, test domain, database name, ports, target platform. Each row carries a status : `gelé` (frozen), `convention projet`, or `A DEFINIR`.
3. **Documents de référence -- l'ordre de préséance fait foi** -- a ranked table : rank, document, what it settles. **A conflict between two documents is settled by rank, never by date nor by which is more detailed.** State that rule explicitly. This file creates no arbitration of its own : it makes the others enforceable.
4. **Workflow projet (obligatoire)** -- **the section without which nothing else fires.** The command cycle, in order, with the golden rule that feature N+1 does not start until N's gate is green and merged. Cite the guide at `~/.claude/commands/WORKFLOW_GUIDE.md`. Name the ordering locks the project cannot invert (config before consumer, auth before the rest, whatever the architecture imposes).
5. **Invariants non négociables** -- numbered `I1..In`, **each with its `*Raison*`**. An invariant without its reason gets negotiated away by the first developer in a hurry, including you. An invariant is a rule whose violation costs more than the feature that violates it. Each invariant also carries a **status** and a `*Contrôle*`. Status is `posée` (the code enforces it today, and something turns red if it does not) or `à poser -- étape N` (decided, not yet enforced): an invariant is written **before** the code it governs, which is exactly why a rule stated in the present tense for a guard that does not exist yet is **worse than no line at all** -- the next reader believes the guard is there and never adds it. `*Contrôle*` names what turns **red** when the invariant is violated -- a named test, a mechanical grep, a step of the gate -- **and the exact fact that check reads**. Write `A DEFINIR` when nothing catches it: an invariant no run can contradict is a wish. Beware the failure that dominates all others: the check reads a fact *neighbouring* the one it claims to guard -- the state instead of the origin, "a token is alive" instead of "this account was never opened", a blacklist instead of a whitelist. Spell out the fact that is read, not the intent.
6. **Conventions de code** -- transversal first, then one block per layer or artifact that exists in this project. Naming, typing, file layout, state boundaries, error handling, i18n, money, dates, transactions -- **only what applies here**.
7. **Pièges déjà payés** -- format **symptôme → cause → réflexe**, numbered, grouped by theme. The symptom comes first because that is what the next person will type into a search bar. **Nothing theoretical is admitted here** : a trap enters this list when it has actually cost time, in this project or a named sibling.
8. **Zones gelées** -- a table of what cannot change without an expensive consequence, with the consequence spelled out. Skip the section if the project genuinely has none.
9. **Commandes de développement** -- runnable as written, per artifact, with ports and prerequisites.
10. **Commits** -- format, language, atomicity, and any prohibition (for instance : no AI co-author line).
11. **Porte de validation** -- the numbered list of what must be true, **with real figures cited**, for a feature to be called finished. State plainly what this gate does *not* measure.

Sections 2, 8 and 11 may be thin on a young project. **Sections 3, 4 and 5 are never optional** -- they are what makes the file load-bearing rather than decorative.

---

## The rules that make this command safe to re-run

**R1 -- Never invent.** No threshold, version, figure, duration or performance number enters the file without a cited source. What is unknown is written `A DEFINIR` **followed by the action that will determine it**. A plausible value written today is a fabricated fact tomorrow, and nobody will remember it was a guess.

**R1 bis -- A presumption is written as a presumption.** `A DEFINIR` covers what is unknown. It does not cover what was **decided without a source** in order to keep moving: an arbitration between two readings of the spec, an economic assumption, a default chosen to unblock an afternoon. Do not leave it in the conversation and do not launder it into a plain fact: write it with the word `présomption`, the option it rules out, and the fact that would confirm or kill it. An arbitration never written down is re-made -- differently -- by the next feature, and the drift is silent because both sides look deliberate.

**R2 -- Paid knowledge is append-only.** A trap, an invariant or a frozen zone already in the file is **never deleted and never weakened**. You may reword it for clarity, merge two duplicates, or correct it if the code proves it false -- and in that last case you say so explicitly in your report. Anything else is silent loss.

**R3 -- Rank rules by what they cost.** Rules the project cannot survive violating become invariants. Rules that cost an afternoon become traps. Rules that are taste become conventions. Putting a preference among the invariants devalues the invariants that matter.

**R4 -- Every rule carries its why.** `*Raison*` on invariants, `cause` on traps, the consequence on frozen zones. A rule whose reason is absent will be deleted the day it becomes inconvenient.

**R5 -- Adapt to the project, do not transplant.** Do not copy an invariant from another project because it looks wise. Sibling projects are a source of *traps* (those are transferable, and cheaply) but not of *invariants* (those are earned by a domain). A delivery app has no clinical safety monotonicity ; a health app has no cart abandonment rule.

**R6 -- Write for someone with no context.** The reader is a developer, or an agent, opening the repo for the first time. Every acronym expanded once, every path absolute from the repo root, every claim checkable.

**R7 -- Dense, no filler.** No line that would be true of any project. If a sentence would survive a copy-paste into an unrelated repo, it earns nothing and it goes.

---

## Invoked mid-implementation -- the ENRICH mode

This is the mode that keeps the file alive, and the one most often skipped. Whenever something is learned the hard way, this command folds it in.

**What justifies an entry :**
- a bug that cost more than an hour, whose cause is not obvious from the code → **trap**
- a rule discovered by breaking it → **trap**, and an **invariant** if breaking it again would cost more than the feature
- a decision taken in conversation that no document records → **conventions**, or a new reference document if it is large
- a value measured on real hardware or a real run → replaces an `A DEFINIR`, **with the measurement cited**
- a constraint found by the platform, a library or an authority → **frozen zone** if changing it later is expensive

**What does not justify one :** anything the code already says plainly, anything git history records, general best practice, and anything that mattered only to one session.

**Procedure** : locate the right section, insert in the established format, renumber only if the format demands it, and **leave the rest of the file byte-identical**. When `$ARGUMENTS` is empty, scan the recent diff and the session for candidates and **propose** them -- never write a rule the user has not confirmed, because a wrong rule in this file propagates into every future session.

---

## `--audit` -- diagnose without writing

**Who runs the audit weighs more than the checklist itself.** A session that has just written or enriched this file audits it nearly blind: checking one's own reasoning refuted 0 findings out of 30 on a measured corpus, while a fresh reader on the same text refuted 10. Run `--audit` in a **new session**, or have a distinct reader run it -- and state in the report which of the two actually happened. An audit run by the writing session is reported as `audit non contradictoire` and closes nothing.

Report, and write nothing :
- which canonical sections are missing, and what each absence costs
- rules present but **without their reason** (they will be deleted eventually)
- values written without a source (R1 violations) -- the highest-priority defect
- traps that read as theoretical rather than paid
- invariants that are really conventions, and conventions that should be invariants
- contradictions with the architecture, the spec, or the code as it now stands
- `A DEFINIR` entries with **no action attached** -- those never close
- whether section 4 exists at all : without it, the whole command suite is inert

---

## Output

After writing, report in French, briefly :
- the mode chosen and the evidence for it
- sections created, sections enriched, and what was **deliberately left untouched**
- every `A DEFINIR` opened, with the action that closes it and **before which step it is due**
- anything you refused to write for lack of a source -- this list is a feature, not a shortfall

Never announce the file as complete. It is complete on the day the project ships, and not before.
