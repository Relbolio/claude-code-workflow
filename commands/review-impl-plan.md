---
description: Critically review an implementation plan to surface inconsistencies, ambiguities, and gaps before coding starts. Cross-references the plan with its spec, the actual codebase, the feature flow, and the project workflow. Takes an optional lens so repeated passes ask a NEW question each time instead of re-running the same audit. Outputs categorized findings with options and recommendations -- never modifies the plan or spec.
argument-hint: <path-to-plan-file> [--lentille "<question that no previous pass has asked>"]
allowed-tools: Read, Glob, Grep, Bash(git status:*), Bash(git log:*), Bash(git branch:*), Bash(ls:*), Agent(Explore), Agent(Plan), WebFetch
---

# Review Implementation Plan -- Critical Pre-Flight Audit

You receive an implementation plan file as input. You must critically audit it against (1) its source spec, (2) the actual codebase, (3) the feature's runtime flow, and (4) the broader project workflow. Surface every incoherence, ambiguity, or hidden assumption that could destabilize the implementation. Output categorized findings with concrete options and a recommendation for each. **Do NOT modify the plan or the spec.**

**Plan source:** $ARGUMENTS

---

## Phase 0 -- Project context (ALWAYS do this first)

Before reading the plan:

### 0.1 Project identity

1. **Read CLAUDE.md** (if exists) -- project name, stack, architecture, conventions, critical rules. Pay special attention to **non-negotiable rules** (multi-tenancy, money handling, theming, audit, i18n, security) -- the audit will check the plan against each.
2. **Identify the architecture doc** (`specs/*ARCHITECTURE*` or similar) -- read its table of contents to know where to look for canonical rules later.
3. **Identify the framework + version** from config files (`package.json`, `pubspec.yaml`, `Cargo.toml`, `go.mod`, etc.). Some checks (e.g., transactional boundaries, event delivery semantics) depend on the exact framework.

### 0.2 Identify recent project history

1. `git log --oneline -20` -- the last 20 commits show what features just landed. The plan may reference "existing" code that was changed last week.
2. `git status --short` -- uncommitted state. If the plan assumes a clean baseline but the working dir has unrelated changes, flag it.
3. `git branch --show-current` -- confirm the branch matches the plan's declared branch.

### 0.3 Identify referenced documents

The plan typically references :
- A spec file (in `_specs/`, `specs/`, or similar) -- **read it in full**.
- User stories (in `userStories/`, `user-stories/`, or similar) -- read the relevant ones.
- ADRs (architecture decision records) -- read the ones referenced.
- Other related plans/specs -- skim for cross-feature constraints.

If the plan does NOT reference its spec, that's already a finding.

### 0.4 Identify the feature's runtime flow

For every feature there is an end-to-end **flow** : user trigger -> API -> service -> DB -> events -> async workers -> notifications -> next state. The plan must be consistent with this flow. Build a mental model of the flow before auditing the plan.

### 0.5 Prior passes and THIS pass's lens (decisive for repeated reviews)

A review pass does not see "the plan's defects". It sees **the defects its question makes visible**. Re-running the same question finds nothing new; asking a question no previous pass asked reopens the yield, and by an amount the pass counter cannot predict. So before auditing :

1. **Find the trace of previous passes** -- a review journal next to the plan (`_plans/journal-revues-*.md`), a `## Reserves` section inside the plan, or the conversation. **Read it in full.** Two things matter : which **lenses** are already spent, and which findings are already made.
2. **Restating a previous pass's finding is a failure of this pass.** Say what was already covered, then look elsewhere.
2b. **Counter-verify the PREVIOUS pass before opening your own lens** (from pass 2 on, ~10 minutes, and it is the highest-yield ten minutes of the pass). The previous pass's corrections were written into the plan by someone who then moved on. Nobody has checked them. For each correction the journal claims was applied :
   - **Is it actually there ?** A journal can announce an edit that never landed. An announced-but-absent correction is a *lie of record* -- the reader believes the point closed. Report it as CRITIQUE.
   - **Did it break an acquis ?** A correction touches one place ; the plan often states the same thing in three. Hunt the mentions left at the old value : **repeated counts** (numbers of steps, endpoints, rules, files, capabilities, criteria), closed lists, cited line ranges, "depends on" links, cross-references, coverage tables.
   - **Do two passages now contradict each other ?** A number that says *seven* here and *eight* there is a regression, even if both values were true once.
   Measured on a real corpus : intra-pass self-falsification refuted **0 findings out of 30**, while a cross-reading of the neighbouring passes found **10**. One does not usefully proofread oneself. This step is where a repeated review actually earns its cost.
3. **Fix this pass's lens.**
   - If `--lentille "<question>"` was passed, that is the lens. Honour it strictly, even if it means ignoring whole sections of the plan -- a narrow question asked properly beats a broad one asked vaguely.
   - Otherwise : passes 1-3 use the default lens (Phases 2 and 3 below, unchanged). From pass 4 on, **choose a lens no previous pass has used**, name it in the first line of your output, and justify the choice in one sentence.
4. **Lenses that have paid on real corpora, in measured order of yield.** The order is not a preference -- it comes from a measured run (1500-line plan, 5 passes, 40 findings). Prefer the top of this list early :
   1. **Reachability** -- for every thing the plan declares (endpoint, screen, file, command) : who *serves* it, who *calls* it, and what authorization lets it through -- including for the actor who has no session and no role yet.
   2. **Life cycle** -- follow one row of data from birth to death across *all* steps : which gesture takes it out of each state, and what happens when nobody consumes it.
   3. **Secrets and out-of-band channels** -- for each single-use value the plan mints, by what exact path does it become observable, for the legitimate actor *and* for the test harness -- and is that path closed in production ?
   4. **Fidelity to disk** -- is every claim the plan makes about existing code true today ? Open it and cite it.
   5. **Falsifiability of the new guards** -- for each *new* mechanical guard, is there a good-faith implementation that leaves it green while violating what it claims to hold ?
   ⚠️ Lens 5 yields far less when played *first* : it freezes counts and perimeters that lenses 1-4 then invalidate. On the measured corpus, **6 of the 10 cross-pass defects came from exactly that**.
   ⚠️ **BEFORE ANY LENS, ON EVERY PASS : THE NON-NEGOTIABLE INVARIANTS, ONE BY ONE.** Not a lens -- a **precondition**, played in every pass, on the invariants listed in the project's `CLAUDE.md`. For each decision the plan takes, ask the single question : *which invariant could this contradict ?* Cite the invariant by number and quote the clause.
   > **Measured, and this is why it is a precondition and not a lens.** An audit decision prescribed gating a route behind a paid capability. A non-negotiable invariant kept that same route open "in every account state **and under every plan**" -- the clause named both dimensions. The plan would have shipped a commercial lever that removes, from a third party who signed nothing, access to data they had already produced.
   >
   > **The invariant wins, always, and the refutation is written down.** A plan that contradicts an invariant is not a plan to adjust : it is a decision to reopen, in writing, with whoever took it. Silently softening the invariant to fit the plan is the one outcome this precondition exists to prevent.
   >
   > **And check the reverse direction too** : does the repository make, *about* an invariant, a claim that is no longer true ? Docblocks stating "guaranteed by X", comments counting things, `⚠️` paragraphs asserting airtightness. Measured : one such claim was false **three times in a row** on a single invariant, each time rewritten and each time still overselling. A false sentence about a guard is worse than no sentence -- it gets trusted.

   Others, unordered : coherence with the spec · step order and real dependencies · the paid traps in `CLAUDE.md` · declared-but-never-exercised · **the DEFAULT path : what does the user who clicks nothing get ?** · executability on this machine today · does the validation gate hold up · the project's sensitive domain (money, health, PII) · adversarial: what breaks first · the stranger who executes the plan literally, with no access to the corpus · the topology of unknowns (reserves and `A DEFINIR` as a graph, not one by one) · falsification of the plan's strongest claims.
   ⚠️ **"Iatrogenics : what the previous passes broke while fixing" is NOT a lens** -- it is step 2b above, done every pass. Taken as a whole-pass lens it is *tautological* : the question guarantees a near-100 % iatrogenic ratio, which then trips the stop rule of §139 no matter how healthy the plan actually is. If you ever do run a dedicated reconciliation pass, say explicitly that its ratio must be excluded from the stop decision.
5. **Adapt Phase 2 to the lens.** The three agents below are the *default* lens's agents. Under another lens, spawn the agents that lens needs -- the lens dictates the research, not the reverse.

---

## Phase 1 -- Read the plan and the spec

1. **Read the plan** at `$ARGUMENTS` in full. Note every claim it makes about :
   - Existing code state ("X is in place at file:line").
   - User stories covered.
   - Design decisions ("we use approach Y because Z").
   - Acceptance criteria mapping.
   - Risks already documented.

2. **Read the source spec** referenced by the plan. Note :
   - The acceptance criteria the plan must address.
   - Any "out of scope" items the plan should NOT address.
   - Technical notes that constrain implementation.

3. **Build a checklist of claims** to verify in Phase 2. Examples :
   - "Index `(status, createdAt)` exists at `schema.prisma:1343`" -> verify by reading the file.
   - "Event `XYZ` is emitted by `service.foo:123`" -> grep for the emit.
   - "Listener X is idempotent because of guard Y" -> read the listener.
   - "Endpoint Z requires permission W" -> verify the guard.

## Phase 2 -- Codebase verification (PARALLEL)

Launch up to **3 Explore agents in parallel** to verify the plan's claims and surface gaps. If Explore agents are not available, use Glob/Grep/Read directly.

### Agent 1 -- Verify "current code state" claims

For every line in the plan's "Current code state" table or equivalent :
- Confirm the file exists at the claimed path.
- Confirm the line number / symbol is what the plan says it is.
- If the file was recently modified (post-spec), flag the drift.
- If the plan says "OK" but the symbol is actually a stub/TODO, flag it.

### Agent 2 -- Verify the runtime flow

Trace the feature's flow from trigger to terminal state, reading actual code (not mocks). For each transition :
- Who emits the event/calls the next service?
- Who consumes? Is there exactly one consumer?
- What's the transactional boundary? (commit -> emit, or emit -> commit?)
- What's the idempotence guard? Where is it enforced?
- What's the error path? Where does it terminate?

The goal is to surface **invisible assumptions** the plan makes about the flow that may not hold.

### Agent 3 -- Verify cross-cutting concerns

Check the plan against the project's non-negotiable rules :
- **Multi-tenancy** -- is the tenant scope correctly applied or correctly bypassed (with justification) ?
- **Authorization** -- guards on new endpoints ? Permission strings exist in seed ?
- **Audit** -- every mutation traced ? AuditAction values exist or properly added ?
- **i18n** -- new user-facing strings have keys in all locales ?
- **Money** -- integer-only ? No Float/Decimal ?
- **Theming / design tokens** -- if UI : no hardcoded colors / values ?
- **Conventions** -- naming, file size, no `any`, conventional commits, no Co-Author-Claude.

## Phase 3 -- Analysis dimensions

For each finding, classify along these axes :

### Severity

- **CRITIQUE (red)** -- introduces a real bug, data loss, security hole, or design flaw that will manifest in production. Must be fixed before implementation.
- **IMPORTANT (orange)** -- ambiguity that will cause divergent implementations or significant rework if interpreted wrong. Should be resolved before implementation.
- **MINEUR (yellow)** -- improvement, hardening, or naming concern. Nice to fix but not blocking.

### Category

- **Coherence plan/spec** -- the plan contradicts the spec, omits a CA, or addresses out-of-scope.
- **Coherence plan/codebase** -- the plan claims existing code that doesn't exist as described, or misses an existing primitive.
- **Coherence flow** -- the plan breaks an invariant of the runtime flow (event ordering, transactional boundary, idempotence).
- **Coherence project workflow** -- the plan violates a CLAUDE.md rule, an ADR, or a cross-feature convention.
- **Ambiguite specification** -- the plan leaves a decision implicit when it should be explicit.
- **Risque non-documente** -- a real risk the plan doesn't list under "Risks".
- **Couverture incomplete** -- a CA, edge case, or rule isn't addressed.
- **Naming / nomenclature** -- collision with existing naming (US numbers, file names, audit actions, env vars, event names).
- **Incoherence numerique** -- the same count is stated in several places and they have drifted apart : *seven* steps here, *eight* there ; a closed list of 5 items described as "the four rules" ; a coverage table that totals differently from the section it summarizes. This is the **single most frequent** regression in a repeatedly-reviewed plan, because every correction that adds or removes an item silently invalidates every place that counted them. Grep the number **in digits and in words** before declaring it coherent. The durable fix is not to re-count : it is to state the number **once** and have the other places refer to it.
- **Iatrogenie** -- the defect was **introduced by a previous pass's correction**, not present originally. Two corrections that fixed the same line in opposite directions, a decision silently reversed by a later one, a mechanism whose carrier a later pass deleted, a step so loaded by successive additions it is no longer one atomic commit.

### Iatrogenics -- tag it, it drives the stop decision

From pass 4 on, **every finding carries a boolean : is this an original defect, or a regression born from a previous pass's fix ?** Answering requires the journal from step 0.5 -- without it, don't guess, say the trace is missing.

This ratio, not the pass counter, is the honest stopping signal. Early passes repair; late passes start breaking what earlier ones built. **When roughly one finding in three is iatrogenic, recommend stopping the reviews and moving to implementation** -- say it plainly in the synthesis, even when the user asked for more passes. Reporting the number is the job; the decision stays theirs.

⚠️ **The ratio is only a signal when the lens did not manufacture it.** If this pass's lens is itself about what previous passes broke, the ratio is guaranteed high by construction and means nothing -- say so and do not recommend stopping on it. A stop decision taken on a number the question made certain in advance tells the user the plan is stable when nobody has checked whether it is. The honest ratio is the one measured under a lens that was looking somewhere else entirely.

### For each finding, provide

1. **Le probleme** -- 2-4 sentences max. State what's wrong, with file:line citations to the actual code or plan section.
2. **Options** -- 2 to 4 alternative resolutions. Each option should be implementable, with its tradeoff stated.
3. **Recommandation** -- one of the options, with one sentence justifying why.
4. **Origine** (from pass 4 on) -- `defaut d'origine` or `iatrogene : introduit par <la correction citee>`.

## Phase 3.5 -- Falsify your own findings BEFORE rendering them

Nothing downstream will contradict you. The user applies what you hand them, and the next pass looks somewhere else -- so a wrong finding here becomes a wrong edit to the plan, and nobody catches it. **You are the only skeptic this analysis will ever get.** Do the job before writing the output, not after.

**Take every CRITIQUE and IMPORTANT finding and try to destroy it.** Not to confirm it -- to destroy it :

1. **Re-open the cited evidence yourself.** Do not trust your own earlier read : go back to the file and check that the line says what you claim it says. A misread line is the single most common way a review invents a defect that isn't there.
2. **Search for the answer elsewhere in the plan.** Plans are long ; "the plan doesn't handle X" usually means "I didn't find where it handles X". Grep for the concept, not the wording you expected.
3. **Test the hidden premise.** Does the finding hold only if some unwritten assumption is true ? If so, the assumption is the finding -- reframe it, and the severity usually drops.
4. **Check severity honestly.** An IMPORTANT dressed as CRITIQUE is a partial refutation : downgrade it rather than dropping it. Inflated severity is how a review loses the reader's trust for the findings that deserved it.
5. **Turn the recommendation against the plan.** Applied literally, would it break something the plan already got right, contradict a decision taken for a reason you haven't read, or force an invented value ? Then the recommendation is the defect.

**Delegate the falsification of every CRITIQUE finding to a separate Explore agent -- this is the default, not an option reserved for heavy cases.** Give it only the claim and the file paths : **not** your lens, not your question, not the reasoning that produced the finding. It must judge the evidence and the plan, never your intent. Measured on a real corpus, an author falsifying their own findings dropped **0 out of 30** ; independent readers examining the same material dropped **10**. The extra call is not a luxury -- it is the difference between a review and a ritual. Delegate IMPORTANT findings too whenever the batch is large enough that you can no longer hold each cited line in mind.

**What survives, you render. What doesn't, you drop.** Then state the count : *« {n} constats écartés en auto-falsification »*. **A zero-drop rate on a large batch is a red flag, not a badge** -- it means the falsification was performed as a formality. Say so plainly if that's what happened, and, if you dropped nothing, cite for each finding the line you actually re-opened and what it said : that citation is the only proof the step happened at all.

**In doubt after genuine verification, keep the finding.** A real defect discarded costs more than a false one raised, because the user can argue with a finding they can see and can do nothing about one you deleted. But a finding whose evidence does not hold must fall, however compelling it reads.

## Phase 4 -- Output structure

Produce the analysis as in-chat output (do NOT write a file). Structure :

```markdown
J'ai trouve {N} points a arbitrer avant l'implementation. Voici l'analyse triee par criticite.

---

## CRITIQUE {N1} -- {Title of finding 1}

**Le probleme.** {Description with file:line citations}

**Options** :
- **A.** {Option A with tradeoff}
- **B.** {Option B with tradeoff}
- **C.** {Option C with tradeoff}

**Recommandation : {Letter}.** {One-sentence justification}

---

## IMPORTANT {N2} -- {Title of finding 2}

[same structure]

---

## MINEUR {N3} -- {Title of finding 3}

[same structure]

---

## Synthese des actions recommandees avant implementation

| # | Severite | Action | Effort |
|---|---|---|---|
| 1 | CRITIQUE | {Recommended action} | +X lignes spec/plan |
| 2 | IMPORTANT | {Recommended action} | +Y lignes |
| 3 | MINEUR | {Recommended action} | trivial |

**Si tu valides {liste des CRITIQUE et IMPORTANT}, je revise spec + plan.** Les MINEUR sont a arbitrer selon ton appetit.

## Cette passe -- lentille, falsification, rendement

- **Lentille** : {la question posee, et pourquoi aucune passe precedente ne la posait} *(a partir de la passe 4)*
- **Contre-verification de la passe precedente** : {n} corrections annoncees, {m} retrouvees au disque, {k} introuvables, {r} regressions. *(a partir de la passe 2 -- si tu ne l'as pas faite, dis-le, c'est une lacune de la passe)*
- **Auto-falsification** : {n} constats ecartes, {m} severites revues a la baisse, {d} delegues a un agent independant. {Si aucun ecarte : dire pourquoi, et citer pour chaque constat la ligne rouverte}
- **Iatrogenie** : {n} constats sur {N} sont des regressions nees d'un correctif anterieur ({x} %). {Si la lentille de cette passe portait elle-meme sur l'iatrogenie, ecrire que le ratio est tautologique et ne vaut pas signal d'arret.} *(a partir de la passe 4)*
- **Prochaine passe** : {soit une lentille neuve nommee, avec ce qu'elle irait chercher -- soit : arreter et coder, avec le motif}
```

If there are NO findings (rare), output :
```
J'ai audite le plan contre la spec, la codebase et le flow runtime. Aucune incoherence detectee. Le plan est implementable en l'etat.

[Bullet list of the 3-5 strongest aspects of the plan as positive feedback]
```

## Important rules

- **NEVER modify the plan or spec** -- this command is audit-only. The user explicitly applies recommendations via a separate edit step.
- **NEVER produce code** -- this command produces analysis, not implementation.
- **Cite file:line for every claim** -- "the plan says X but the code shows Y at file:42" is far stronger than "the plan is wrong about X".
- **Use Explore agents to delegate research** -- they protect the main context window from massive grep/read sessions.
- **Severity is honest, not inflated** -- if you only find MINEUR issues, say so. Don't invent CRITIQUE to look thorough.
- **Falsify before rendering (Phase 3.5)** -- nothing downstream contradicts you, and the next pass looks elsewhere. A finding you didn't try to break is a finding nobody will ever check.
- **Recommend, don't prescribe** -- the user owns the decision. Always offer options first, recommendation second.
- **Respect the project workflow** -- if CLAUDE.md says "no Co-Author Claude in commits", don't recommend a commit format that includes one. If the project uses French for specs and English for code, your analysis should be in French.
- **Limit findings count** -- if you'd produce >15 findings, group similar ones or focus on the top 10. A flooded analysis is unactionable.
- **Distinguish "the plan is wrong" from "the plan is silent"** -- silence on a topic is an ambiguity, not necessarily a defect. Both are flaggable but with different framing.
- **Cross-reference adjacent features** -- if the plan introduces an event name `payment-order.recovered` and another module already has `payment-order.success`, namespace coherence is a real finding.
- **Verify the verification** -- if the plan claims "CA1 is verified by Test X", check that Test X actually verifies CA1, not just touches the code.
- **No finding from training data** -- every finding must be backed by something you actually read in the project (plan, spec, code, CLAUDE.md). Generic best-practice advice has no place here.
- **Time budget** -- a thorough audit is 1500-3500 words of output. If you go shorter, you missed things. If you go longer, you padded.
