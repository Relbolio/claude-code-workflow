# Guide de Workflow Projet avec les Commandes Claude Code

## Vue d'ensemble

**20 commandes** forment un cycle de vie projet complet, en **5 phases**, toutes installées en **portée utilisateur** (`~/.claude/commands/`) : elles sont donc disponibles dans tous vos projets sans rien recopier.

Trois d'entre elles portent la valeur la plus mesurable. `/write-feature-tests`, `/run-gate` et `/audit-contracts` forment la **phase de validation**, ajoutée après l'implémentation d'un produit métier complet — elles encodent ce qui a réellement trouvé les défauts. Et `/claude-md`, en phase 1, est celle **sans laquelle aucune des autres ne s'applique** : une commande disponible n'est pas une commande obligatoire, et c'est le `CLAUDE.md` du projet qui fait la différence.

```
╔══════════════════════════════════════════════════════════════════╗
║                    PHASE 1 — PLANIFICATION                       ║
║  Documentation ──→ /generate-versions ──→ /generate-specs        ║
║                            │                                     ║
║       ┌────────────────────┼────────────────────┐                ║
║  /generate-wireframes  /generate-user-stories  /generate-        ║
║       (HTML)              (User Stories)        architecture     ║
║                            │                                     ║
║              /claude-md ──→ /create-project-agents               ║
║        ⭐ rend le workflow OBLIGATOIRE — et se ré-invoque         ║
║           à chaud dès qu'une règle est découverte                ║
╠══════════════════════════════════════════════════════════════════╣
║                PHASE 2 — CONCEPTION DE LA FEATURE                ║
║  /create-feature-spec ──→ /audit-contracts ──→ /create-impl-plan ║
║                          ⭐ AVANT le plan : ce qu'il trouve EST  ║
║                             le lot, pas une régression           ║
║                                │                                 ║
║              /review-impl-plan  (× 3, + 1 par lentille neuve)    ║
║                                │                                 ║
║                       /create-feature-tests                      ║
╠══════════════════════════════════════════════════════════════════╣
║                    PHASE 3 — RÉALISATION                         ║
║           [ CODER ] ──→ /commit-message (× N)                    ║
╠══════════════════════════════════════════════════════════════════╣
║                    PHASE 4 — VALIDATION  ⭐ nouvelle             ║
║  /write-feature-tests ──→ /run-gate ──→ /audit-contracts         ║
║   (auteur DISTINCT)        (la porte)     (le DELTA du lot)      ║
╠══════════════════════════════════════════════════════════════════╣
║                    PHASE 5 — LIVRAISON                           ║
║  /create-pull-request ──→ /merge-feature ──→ /resume-feature     ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## Ce que la phase 4 a changé, chiffres à l'appui

Sur un produit métier livré de bout en bout (12 modules, ~50 000 lignes), voici **ce qui a réellement trouvé chaque défaut** :

| Ce qui a trouvé le défaut | Nombre | Exemples |
|---|---|---|
| Suite d'intégration écrite par un **auteur distinct** | **10** | codes d'erreur déclarés et jamais levés · champ accepté par le DTO et jamais écrit · refus trompeur sur course perdue · timeout inexistant · purge non convergente |
| **Bout en bout live** sur le parcours complet | 2 | heure de renvoi toujours héritée · deux composants ambigus au même identifiant |
| Passe **`npm run dev` FR+EN** | 2 | argument de message manquant · nombre passé en entier à un formateur |
| **Croisement de contrats** back ↔ front | 3 | 7 routes de réglages sans contrôleur · 6 routes sans endpoint câblé · lien vers une page inexistante |
| Relecture de code, revue de plan | **0** | — |

**Aucun défaut d'exécution n'a été trouvé par relecture.** C'est le fait qui justifie la phase 4 : les commandes de conception évitent le travail inutile et les contradictions, mais elles ne peuvent pas voir qu'un code d'erreur ne sera jamais levé.

---

## Phase 1 — Planification du projet *(une seule fois)*

### 1. Découper en versions — `/generate-versions docs/brief.md`
Produit `versions/VERSION_1_MVP.md`, `VERSION_2_INTERMEDIAIRE.md`, `VERSION_3_OPTIMALE.md`.
> Relisez les trois. Chaque fonctionnalité du brief doit apparaître dans **exactement une** version.

### 2. Consolider — `/generate-specs versions/VERSION_1_MVP.md`
Produit `specs/PROJET_SPECS.md` : flux UX, features, inventaire d'écrans, règles métier, critères de validation.
> Ne passez que les versions à implémenter **maintenant**. Les autres sont marquées hors périmètre.

### 3. Wireframes, user stories, architecture *(parallélisables)*
- `/generate-wireframes specs/PROJET_SPECS.md` → HTML autonomes
- `/generate-user-stories specs/PROJET_SPECS.md` → `userStories/` + `00_INDEX.md` (ordre d'implémentation)
- `/generate-architecture userStories/ specs/PROJET_SPECS.md` → arborescence, schéma, sécurité, règles de dev

> **Lancez l'architecture en dernier** : elle bénéficie des user stories.
> **Astuce forte** : passez un **préréglage de stack** en 2ᵉ argument (`~/.claude/stacks/<stack>.md`) — l'architecture générée hérite alors des conventions **et des pièges déjà payés**, au lieu de les redécouvrir. Préréglages disponibles : `nextjs-nestjs-prisma` (web fullstack métier), `expo-react-native-mobile` (mobile, noyau + modules optionnels à retenir explicitement).

### 4. Le fichier qui rend tout le reste obligatoire — `/claude-md`

**C'est l'étape sans laquelle rien de ce guide ne s'applique.** Les commandes installées en portée utilisateur sont *disponibles*, jamais *obligatoires* : ce qui les rend obligatoires, c'est le `CLAUDE.md` du projet qui les déclare telles. Il est le seul fichier lu automatiquement au début de chaque session.

`/claude-md` le crée s'il n'existe pas, le met en conformité s'il existe, et **s'invoque autant de fois que nécessaire** :

| Quand | Ce que ça donne |
|---|---|
| **En tout premier**, avant même `/generate-versions` | Un fichier minimal qui déclare le workflow obligatoire — dès lors, le cycle s'applique sans que vous ayez à le redemander |
| **Ici, en fin de phase 1** | Le fichier complet : invariants, conventions et pièges dérivés des specs et de l'architecture qu'on vient de produire |
| **En cours d'implémentation**, `/claude-md "ce qu'on vient d'apprendre"` | Le piège payé, la règle découverte ou la valeur mesurée entrent au bon endroit, sans toucher au reste |

> Il est **additif et non destructeur** : un piège payé n'est jamais supprimé. Et `/claude-md --audit` diagnostique sans rien écrire.

### 5. Agents projet — `/create-project-agents`
Dérive de l'architecture trois agents adaptés à la pile, écrits dans `.claude/agents/` du projet.
> Contrairement aux commandes, **les agents restent en portée projet** : ils dépendent de la pile.

---

## Phase 2 — Conception de la feature

### 6. Spec de feature — `/create-feature-spec "Description"`
Crée la branche `claude/feature/<slug>` et `_specs/<slug>.md`.
**Prérequis** : arbre git propre. Accepte une URL Figma en argument.

### 6 bis. Croiser les contrats **AVANT** de planifier — `/audit-contracts` ⭐ *(obligatoire dès que le lot touche une surface back ↔ front)*

Confronte mécaniquement ce que le serveur expose à ce que le client consomme, **avant** d'écrire une ligne de plan. Ce que vous cherchez ici n'est pas une régression : c'est **ce qui existe déjà et que personne ne peut atteindre**.

> ⚠️ **CETTE COMMANDE A ÉTÉ CLASSÉE « PÉRIODIQUE » PENDANT ONZE LOTS, ET « PÉRIODIQUE » A VOULU DIRE « JAMAIS ».** La mesure est sans appel : deux des plus gros constats d'un programme de dette de trente constats étaient **déjà écrits, mot pour mot, dans cette commande**.
>
> | Ce qu'un audit a mis onze lots à trouver | Ce que `/audit-contracts` disait déjà |
> |---|---|
> | Une colonne écrite en quatre endroits, journalisée, affichée — et lue par personne pour refuser quoi que ce soit | §1.5 : « une colonne **écrite et jamais lue** est soit du code mort, soit un oubli de projection » |
> | 28 permissions sur 45 sans libellé ; 22 entitlements sur 32 sur une grille tarifaire **publique** | §1.3 : « chaque valeur a-t-elle son **libellé traduit**, dans **toutes** les langues ? » |
>
> **La leçon ne porte pas sur la commande, elle porte sur le cycle.** Une règle juste qui ne se déclenche à aucun moment obligatoire est une valeur écrite que rien ne lit — exactement le défaut qu'elle décrit. D'où son passage en **étape numérotée**, avant le plan.
>
> **Pourquoi AVANT et non après** : ce que la commande trouve — routes servies jamais consommées, capacités vendues sans écran, entrées de menu vers des pages absentes — ce sont des **entrants de plan**, pas des régressions. Trouvées après, elles arrivent quand le plan est écrit et le lot budgété ; trouvées avant, elles **sont** le lot.
>
> **Quand la sauter** : lot purement backend, ou purement cosmétique sur un écran déjà branché. Écrivez le motif en une ligne — non écrit, l'arbitrage ne se fait pas.

### 7. Plan — `/create-impl-plan _specs/<slug>.md`
Produit `_plans/<slug>.md` : état actuel du code, étapes ordonnées, composants à réutiliser, critères de vérification.

### 8. Revue du plan — `/review-impl-plan _plans/<slug>.md` *(3 passes, davantage si la lentille change)*
Audit critique du plan contre la spec, la base de code et le flux d'exécution. **N'écrit rien** : rend des options et une recommandation, que vous appliquez.

> **Revue complète ou revue courte ?** C'est la première question, avant le nombre de passes. La boucle de revue est **le poste le plus cher du cycle** : sur un lot mesuré, **3 h 44 pour relire un document** — 24 % du temps et 37 % des jetons sans toucher une ligne de code.
>
> - **Revue courte — une passe, lentille « cohérence avec la spec » seule** : le plan n'ajoute ni garde, ni invariant, ni migration, ne fige aucune décision d'arbitrage, et ne touche qu'un module déjà couvert par des suites.
> - **Revue complète — 3 passes, plus une par lentille neuve** : le plan pose une **garde** ou un **invariant**, fige une **décision d'arbitrage**, traverse **plus d'un module**, ou touche une zone où un piège a déjà été payé.
>
> Tranchez **avant** la première passe et écrivez le verdict en une ligne en tête du plan (« revue courte, motif : … »). Non écrit, l'arbitrage ne se fait pas, et le cas cher devient le cas par défaut.
>
> **Combien de passes ?** Une par cycle de correction. **Au-delà de trois passes portant la même lentille, le rendement chute** : la région éclairée a été balayée, et ce qui reste appartient à la phase 4. C'est le cas courant, parce que relancer une revue sans changer la question est le comportement par défaut.
>
> **Mais une passe ne voit pas « les défauts du plan » — elle voit les défauts que sa question rend visibles.** Une passe supplémentaire se justifie dès lors qu'elle pose une **question qu'aucune précédente n'a posée** ; son rendement n'est alors **pas prévisible** par le nombre de passes déjà faites. Le compteur ne repart pas à zéro : il repart d'ailleurs.
>
> **Qui vérifie les constats d'une passe ? Pas elle-même.** Mesure : l'auto-falsification **à l'intérieur** d'une passe a écarté **0 constat sur 30** ; une relecture **croisée** par un lecteur qui ne les a pas écrits en a réfuté **10**. En pratique : une passe rend ses constats **sans les appliquer** ; c'est la **passe suivante — ou un agent distinct** — qui tranche lesquels survivent, et qui le dit avec un chiffre (« n constats de la passe précédente réfutés »). `/revue-plan-autonome` fait déjà cette contre-vérification ; en revue manuelle, elle est à votre charge. Un taux de réfutation **nul** sur un gros lot n'est pas un gage de qualité : c'est le signe que l'étape croisée n'a pas eu lieu.
>
> **Exemples de lentilles distinctes** — cohérence avec la spec · fidélité à ce qui est réellement sur le disque · ordre et dépendances des étapes · les invariants un par un · les pièges déjà payés du `CLAUDE.md` · le déclaré-jamais-exercé · l'exécutabilité sur ce poste · la tenue de la porte de validation · le domaine sensible du projet · adversariale · l'iatrogénie des corrections précédentes · le lecteur étranger qui exécute à la lettre · la topologie des inconnues · le cycle de vie longitudinal d'une donnée · la falsification des affirmations fortes.
>
> **Quand s'arrêter, alors ?** Pas au compteur : à l'**iatrogénie**. Surveillez la part des constats qui sont des **régressions nées d'un correctif d'une passe antérieure**, et non des défauts d'origine. Tant qu'elle est faible, les passes réparent. **Quand elle approche du tiers, elles cassent plus qu'elles ne réparent — arrêtez et codez.**
>
> **Le mécanisme le plus fréquent de cette iatrogénie a un nom : la dérive des comptes.** Un document relu plusieurs fois répète ses nombres ; un correctif en met un à jour et oublie les autres — « sept » ici, « huit » là. **Commencez chaque passe par là : relevez tous les comptes répétés et confrontez-les entre eux** avant de chercher plus loin. Deux minutes, et autant de constats que la passe n'aura pas à produire.
>
> *Base de mesure* : un seul corpus — la revue du socle applicatif d'un projet, **quinze passes** à lentilles distinctes, **170 constats** (27 critiques).
>
> | Tranche | Constats/passe | Critiques/passe | Part iatrogène |
> |---|---|---|---|
> | 1–3 | 13,3 | 1,67 | 8 % |
> | 4–6 | 12,3 | **2,33** | 8 % |
> | 7–10 | 10,5 | 2,00 | 29 % |
> | 11–15 | **10,2** | **1,40** | **76 %** |
>
> **Ce que ces chiffres établissent** : le volume tient. Après **dix** passes déjà appliquées, cinq lentilles neuves rendent encore 10,2 constats par passe — contre 10,5 sur la tranche précédente. Un rendement qui ne s'épuise pas au dixième tour n'est pas compatible avec une règle d'arrêt à trois.
>
> **Ce qu'ils réfutent** : une version antérieure de ce guide affirmait que la **gravité monte** avec les passes tardives, sur la foi d'une dixième passe à 4 critiques. C'était **une pointe lue comme une tendance**. Sur quinze passes, les critiques par passe retombent à 1,40 — le plus bas des quatre tranches. Les lentilles neuves paient **en volume, pas en gravité**.
>
> **Ce qu'ils confirment sans ambiguïté** : l'iatrogénie est le bon signal d'arrêt. Elle passe de 8 % à **76 %**, et surtout **six des sept constats critiques de la dernière série sont eux-mêmes iatrogènes** — les passes tardives ne trouvaient plus les défauts du plan, elles trouvaient les dégâts des passes précédentes. Corrigée de l'effet de lentille (deux des cinq passes cherchaient explicitement l'iatrogénie), la part reste de 67 %. **76 % des recommandations ont dû être infléchies à l'application pour ne pas casser un acquis nommé.**
>
> Un corpus n'est pas une loi, et celui-ci vient d'invalider la moitié de ce qu'on en avait tiré. Traitez ce tableau comme une heuristique à réfuter — c'est exactement ce qui lui est arrivé.

### 9. Checklist de tests — `/create-feature-tests _plans/<slug>.md`
Produit `_tests/<slug>.md` : la liste de **ce qui devra être prouvé**, chaque test rattaché à un critère d'acceptation, avec un marqueur de sévérité.
> C'est une **checklist**, pas du code. Le code des tests vient à l'étape 10.

---

## Phase 3 — Réalisation

### 10. Coder
En suivant le plan. Cochez les étapes.

### 11. Commiter — `/commit-message`
Analyse le diff **stagé**, propose `<emoji> <type>: <description>`.
> Commits atomiques. Le corps dit **pourquoi**, le diff dit déjà quoi.

---

## Phase 4 — Validation ⭐

### 12. Écrire et exécuter les suites — `/write-feature-tests _plans/<slug>.md`

Écrit les **suites réelles et committées** (unitaires, intégration sur base réelle, bout en bout), les exécute, et rapporte chaque rouge comme **défaut du produit** ou **hypothèse fausse du test**.

> ⚠️ **Règle non négociable : l'auteur des tests n'est pas l'auteur du code.**
> Un auteur qui teste son propre code teste ce qu'il a **voulu** écrire. Les dix défauts du tableau plus haut viennent tous de suites écrites par un tiers.
>
> **En pratique** : lancez cette commande dans une **session neuve**, ou déléguez-la à un agent qui n'a pas le contexte d'écriture. Si vous la lancez dans le fil qui vient de coder, la commande vous le dira et s'arrêtera.

### 12 bis. Muter le code — la seule façon de savoir si une garde garde

Une garde qu'on n'a **jamais vue rouge** n'est pas une garde. Avant de clore un lot, cassez délibérément, une par une, les propriétés que vos gardes prétendent tenir — inversez la condition, videz la liste, décalez le compte — et vérifiez que **chacune vire au rouge**. Restaurez immédiatement. Toute garde restée **verte sous mutation** est à réécrire.

> **Ce que la mutation attrape et que rien d'autre ne voit** : la garde lit un fait **voisin** de celui qu'elle prétend garder — l'état au lieu de l'origine, une liste noire au lieu d'une liste blanche. Racine la plus fréquente : **quatre occurrences successives sur un seul lot**. Aucune relecture ne la voit, parce que la garde *dit* la bonne chose.
>
> **Rendement comparé** : sur deux lots complets, **aucun** défaut n'est venu d'un rejeu de suite déjà verte — tous sont venus de **sondes** (étape 12) et de **mutations** (celle-ci). Une fois par lot, pas à chaque tour.
>
> ⚠️ **LA MUTATION S'ÉCRIT DANS LE JOURNAL DU LOT, SINON ELLE N'A PAS EU LIEU.** Une ligne par garde neuve : *sonde appliquée · rouge obtenu et son message · aucune autre suite rougie · arbre restauré et revert vérifié*. Sans cette trace, « j'ai muté » est indiscernable de « j'ai écrit que je muterais » — et le dépôt a déjà payé les deux.
>
> ⚠️ **VÉRIFIEZ QUE LA SONDE A MORDU, pas seulement qu'on l'a lancée.** Une sonde qui ne modifie rien est **indiscernable d'une garde qui ne garde rien**, et le vert qu'elle rend ressemble à une preuve. Mesuré : un remplacement multi-ligne dont le motif portait des fins de ligne UNIX n'a rien trouvé dans un fichier en CRLF, et a rendu 5/5 verts — on est parti corriger une garde qui allait très bien. Toute sonde affirme d'abord que son motif est **présent** (`assert motif in contenu`), et échoue bruyamment sinon.
>
> ⚠️ **ET AUCUNE AUTRE SUITE NE DOIT ROUGIR.** Si la mutation en fait rougir trois, la garde ne vise pas ce qu'elle annonce — ou la mutation est trop grosse. Les deux sont des résultats.
>
> ⚠️ **L'ARBRE EST GELÉ PENDANT UNE PORTE.** Une sonde posée soixante secondes pendant qu'une suite tourne a produit **23 suites en échec sur 38**, toutes sur une erreur de compilation sans rapport avec le lot — et la cause avait déjà disparu de l'arbre quand on est allé la chercher. Vérifiez qu'aucune porte ne tourne **avant** de muter.

### 13. Franchir la porte — `/run-gate`

Exécute la porte complète — build propre, typechecks, lint, unitaires, intégration, bout en bout live, invariants, passe i18n en mode développement — en **découpant les runs longs**, et rend un verdict avec des **chiffres réels**.

> `--quick` pendant le développement (typecheck + lint + unitaires) ; `--full` avant de livrer.
> La commande refuse de conclure « flake » sur un seul run : elle rejoue en isolation et diagnostique.

### 14. Recroiser les contrats — `/audit-contracts` *(second passage, sur ce que le lot vient d'ajouter)*

Le **premier** passage est l'étape 6 bis, avant le plan : il dit ce qui existe et n'est pas atteignable. Celui-ci est un **second** passage, borné à ce que le lot vient d'écrire — une route neuve qu'aucun écran n'appelle, un endpoint ajouté au registre et jamais consommé, une valeur d'énumération neuve sans libellé.

> **Ce n'est pas une redite** : le premier passage regarde un **héritage**, celui-ci regarde un **delta**. Mesuré : deux endpoints ajoutés au registre du front à l'écriture d'une feature y ont dormi, appelés par personne, jusqu'à ce qu'un programme de dette les trouve trois lots plus tard.
>
> **Quand le sauter** : le lot n'a créé ni route, ni entrée de registre, ni valeur d'énumération. Sinon, jamais.

---

## Phase 5 — Livraison

### 15. Pull request — `/create-pull-request into dev`
Analyse tous les commits, génère titre et corps, **montre un aperçu** avant de pousser. Nécessite `gh`.

### 16. Merger — `/merge-feature claude/feature/<slug> into dev`
`merge --no-ff`, résolution de conflits assistée, propositions de push et de suppression de branche — chacune confirmée.

### 17. Capitaliser — `/resume-feature`
Produit le résumé de livraison dans `_resumes/`.
> **Ajoutez-y systématiquement les pièges découverts** dans la section correspondante du `CLAUDE.md`. Un piège payé deux fois est un piège qu'on n'a pas écrit.

---

## Workflow type, complet

```bash
# ═══ UNE SEULE FOIS ═══
/generate-versions docs/brief.md
/generate-specs versions/VERSION_1_MVP.md
/generate-wireframes specs/PROJET_SPECS.md
/generate-user-stories specs/PROJET_SPECS.md
/generate-architecture userStories/ specs/PROJET_SPECS.md ~/.claude/stacks/<stack>.md
/claude-md                                   # ⭐ rend le workflow OBLIGATOIRE
/create-project-agents                       # agents adaptes a la pile

# ═══ POUR CHAQUE FEATURE ═══
/create-feature-spec "Description"
/audit-contracts                             # ⭐ AVANT le plan, si le lot touche
                                             # une surface back <-> front.
                                             # Ce qu'il trouve EST le lot.
/create-impl-plan _specs/<slug>.md           # inventaire SCELLÉ et mesuré (R0)
                                             # + matrice état × route (R8)
/review-impl-plan _plans/<slug>.md          # 3 passes, appliquer entre chaque
                                             # + 1 par LENTILLE NEUVE (voir etape 8)
                                             # arrêt : quand 1 constat/3 est une
                                             # régression née d'un correctif
/create-feature-tests _plans/<slug>.md
# ... coder ...
/claude-md "<piege paye / regle decouverte>"   # a chaud, des qu'on apprend
/commit-message                              # × N
/run-gate --quick                            # boucle courte pendant le dev

# ── SESSION NEUVE, ou agent distinct ──
/write-feature-tests _plans/<slug>.md        # ⭐ l'auteur n'est pas celui du code
# muter les gardes une par une : celle qui reste verte n'est pas une garde
/run-gate --full                             # la porte réelle

/create-pull-request into dev
/merge-feature claude/feature/<slug> into dev
/resume-feature

# ═══ AVANT LIVRAISON ═══
/audit-contracts                             # second passage, borné au DELTA du lot
/merge-feature dev into main
```

---

## Est-ce automatique ?

**Non, et c'est délibéré.** Ces commandes sont des **rituels invocables**, pas des déclencheurs. Trois raisons :

1. **`/write-feature-tests` perd toute sa valeur si elle s'enchaîne automatiquement** après le codage : elle serait exécutée par le fil qui vient d'écrire, donc par l'auteur — exactement ce qu'elle interdit. La rupture de contexte **est** le mécanisme.
2. **`/run-gate --full` coûte cher** (build de production, base réelle, navigateur). L'enchaîner à chaque commit ferait qu'on cesse de la lire.
3. **Un verdict de porte demande une décision humaine** quand il est rouge : corriger le produit, corriger le test, ou constater un défaut pré-existant. Automatiser la décision revient à automatiser la complaisance.

### Ce qu'on peut automatiser sans perte

| Moment | Automatisation utile |
|---|---|
| Avant chaque commit | `/run-gate --quick` — typecheck + lint + unitaires, quelques secondes |
| Sur la CI, à chaque push | `--full` sans la passe i18n (elle exige un serveur en mode développement) |
| Hook de pré-push | Le script d'invariants seul — c'est du grep, c'est instantané |
| ~~Fin de sprint~~ **Ouverture de tout lot back ↔ front** | `/audit-contracts` — ⚠️ « planifié » et « périodique » ont voulu dire **jamais** pendant onze lots. Ce n'est pas une cadence, c'est une **précondition de plan** |

---

## Comment en tirer le meilleur sur un nouveau projet

**1. Investissez dans le préréglage de stack.** `/generate-architecture` avec un préréglage produit une architecture qui hérite des conventions **et des pièges**. C'est le seul levier qui agit **avant** la première ligne de code.

**2. Livrez le journal et le cloisonnement avant le premier module métier.** Un module écrit sans eux devra être repris. Cet ordre est dans le préréglage — respectez-le.

**3. Écrivez la checklist de tests AVANT de coder** (étape 7 avant étape 8). Elle change ce qu'on code : savoir qu'on devra prouver « aucune donnée ne sort quand l'interrupteur est fermé » fait écrire l'interrupteur autrement.

**4. Alternez les rôles délibérément.** Sur un projet mené avec plusieurs agents, faites du **lot de test un lot distinct**, avec ses propres consignes. Ne lui donnez pas le contexte d'écriture : c'est son ignorance qui le rend efficace.

**5. Ne laissez jamais un module « implémenté mais non validé » plus d'une étape.** Sur ce projet, deux modules ont été livrés dans cet état ; leurs suites, écrites ensuite, ont trouvé six défauts. Ils auraient été trouvés plus tôt, et corrigés moins cher.

**6. Lancez `/audit-contracts` AVANT d'écrire le plan, dès qu'un lot touche une surface back ↔ front.** La dérive ne se voit pas dans une revue : elle n'est dans aucun des deux côtés, elle est dans l'écart. Et ce qu'elle trouve **est le lot** — trouvée après, la même chose devient une régression qui arrive quand le plan est écrit et le budget posé.

**7. Consignez chaque piège dans `CLAUDE.md`, le jour même.** Les vingt pièges du préréglage ont tous été payés une fois. Aucun n'a été payé deux fois — parce qu'ils ont été écrits.

---

## Le protocole de LOT — quand une feature devient une série

Le cycle ci-dessus décrit **une** feature. Dès qu'on enchaîne des lots sur un même produit — reprise de dette, extension d'un domaine, série de migrations — huit règles s'y ajoutent. Elles viennent d'un programme réel de sept lots et trente constats, et **chacune a été payée avant d'être écrite**.

> ⚠️ Ce protocole a vécu **enfermé dans le `_plans/` d'un projet** pendant toute sa durée de vie utile. Il n'a donc servi qu'une fois, sur le produit qui l'avait payé. C'est le même défaut que celui qu'il combat : *une valeur écrite que rien ne lit*. Il vit désormais ici, en portée utilisateur.

| # | Règle | Ce qu'elle a coûté avant d'être écrite |
|---|---|---|
| **R0** | **L'inventaire est scellé et MESURÉ avant la première ligne.** Chaque chiffre porte sa commande et sa date. | Un plan écrit sur des faits mémorisés hérite de toutes les croyances périmées du dépôt. |
| **R1** | **Une seule porte par lot, à la fin, en processus détaché.** Le harnais tue les tâches de fond vers dix minutes. | Des portes rejouées à chaque acteur n'ont trouvé **aucun** défaut, et ont mangé la moitié du temps d'un lot. |
| **R2** | **Le validateur rejoue les SONDES, pas les suites.** Une suite déjà verte re-rendue verte n'apprend rien. | 51 % du temps du premier lot n'a jamais touché de code. |
| **R3** | **Implémentation en direct, jamais par orchestration multi-agents.** | Le coût de coordination dépasse le gain dès que les lots se suivent. |
| **R4** | **Aucun parallélisme ENTRE lots.** Le lot N+1 part du lot N mergé. | Deux lots concurrents partagent la base de test et leurs purges se détruisent. |
| **R5** | **Spec et plan fusionnés en un seul document.** | Deux documents pour un lot divergent, et c'est celui qu'on lit le moins qui a tort. |
| **R6** | **Les patrons du premier lot se CITENT, ils ne se redérivent pas.** | Une seconde dérivation du même patron diverge silencieusement. |
| **R7** | **Pour chaque garde : quel FAIT lit-elle ?** — voir Phase 4. | Une garde qui lit un fait voisin de celui qu'elle annonce : quatre occurrences sur un lot. |
| **R8** | **La matrice état × route est exigée au contrat**, colonnes ouvertes comprises. | Une matrice qui n'énumère que les refus est satisfaite par un produit qui refuse tout. |

**Et une règle d'arrêt, mesurée sur quatre rondes de validation adversariale d'un même lot** (5 → 2 → 1 → **0** bloquants) : la boucle **ne se ferme pas d'elle-même**. On merge à **zéro bloquant**, et la dette restante s'écrit dans le journal du lot — elle ne se corrige pas dans le lot qui l'a trouvée.

---

## Bonnes pratiques

| Pratique | Pourquoi |
|---|---|
| Commencer par `/generate-versions` | Évite le scope creep, force à prioriser |
| Passer un préréglage de stack à `/generate-architecture` | Hérite des conventions et des pièges au lieu de les redécouvrir |
| Un `/create-feature-spec` par feature, pas par epic | Garde branches et PR relisibles |
| Décider revue courte / revue complète **avant** la première passe | La boucle de revue a coûté 24 % du temps et 37 % des jetons d'un lot. Sans critère d'entrée, tout plan paie le tarif du plan le plus risqué |
| `/review-impl-plan` : 3 passes, puis **une de plus par lentille neuve** | Une passe voit ce que sa question éclaire. Même question répétée → rendement nul ; question neuve → rendement imprévisible, souvent élevé |
| Arrêter les passes sur l'**iatrogénie**, pas sur le compteur | Quand un constat sur trois est une régression née d'un correctif antérieur, les passes cassent plus qu'elles ne réparent |
| `/create-feature-tests` **avant** de coder | Savoir ce qu'on devra prouver change ce qu'on écrit |
| `/write-feature-tests` en **session neuve** | L'auteur du code ne peut pas tester son intention |
| Muter chaque garde avant de clore le lot | Une garde jamais vue rouge n'est pas une garde. La racine dominante — la garde lit un fait voisin — n'est visible que sous mutation |
| `/run-gate --quick` en boucle courte, `--full` avant de livrer | La porte reste lue parce qu'elle reste rapide |
| Bout en bout sur le **build de production**, passe i18n en **mode développement** | Chaque mode cache les défauts de l'autre : un minifieur a déjà supprimé une fonctionnalité entière qu'aucun mode dev ne pouvait montrer |
| Ne jamais neutraliser un test pour le faire passer | Un test désarmé donne une confiance fausse |
| Ne jamais conclure « flake » sur un seul run | Rejeu en isolation, puis diagnostic explicite |
| `/audit-contracts` **avant le plan** de tout lot back ↔ front | La dérive n'est dans aucun des deux côtés — et une règle juste qui ne se déclenche à aucun moment obligatoire est elle-même une valeur écrite que rien ne lit |
| Muter chaque garde neuve, et **écrire la sonde jouée dans le journal du lot** | « J'ai muté » est indiscernable de « j'ai écrit que je muterais » |
| Consigner les pièges dans `CLAUDE.md` | Un piège payé deux fois est un piège qu'on n'a pas écrit |
| `into dev` avant `into main` | Protège la branche de production |

---

## Référence rapide

| Commande | Input | Output | Phase |
|---|---|---|---|
| `/generate-versions` | Doc projet | 3 fichiers versions | 1 |
| `/generate-specs` | Version(s) | Spec consolidée | 1 |
| `/generate-wireframes` | Spec | HTML autonomes | 1 |
| `/generate-user-stories` | Spec | US par epic + index | 1 |
| `/generate-architecture` | US + Spec [+ préréglage] | Doc architecture | 1 |
| `/create-feature-spec` | Description | Spec + branche | 2 |
| `/create-impl-plan` | Spec feature | Plan | 2 |
| `/review-impl-plan` | Plan | Analyse critique *(n'écrit rien)* | 2 |
| `/create-feature-tests` | Plan | Checklist `_tests/` | 2 |
| `/commit-message` | Diff stagé | Commit structuré | 3 |
| **`/write-feature-tests`** | Plan | **Suites réelles + exécution** | **4** |
| **`/run-gate`** | — | **Verdict chiffré** | **4** |
| **`/audit-contracts`** | — | **Écarts back ↔ front** | **4** |
| `/test-feature` | — | Exploration navigateur *(rapport, non durable)* | 4 |
| `/create-pull-request` | Branche | PR GitHub | 5 |
| `/merge-feature` | Branche | Merge + nettoyage | 5 |
| `/resume-feature` | Branche | Résumé `_resumes/` | 5 |

> **`/test-feature` et `/write-feature-tests` ne font pas la même chose.** Le premier **explore** l'application dans un navigateur et rend un rapport — utile pour découvrir un comportement. Le second **écrit des suites committées** qui protègent contre la régression. Un rapport ne protège rien : c'est le second qui appartient à la porte.

---

## Structure de fichiers générée

```
mon-projet/
├── docs/brief.md
├── versions/            VERSION_1_MVP.md · VERSION_2 · VERSION_3
├── specs/               PROJET_SPECS.md · PROJET_ARCHITECTURE.md
├── wireframes/          *.html
├── userStories/         00_INDEX.md · 01_*.md
├── _specs/              Spec par feature
├── _plans/              Plan par feature
├── _tests/              Checklist par feature
├── _resumes/            Résumé de livraison par feature
├── scripts/             check-invariants.sh
└── CLAUDE.md            Conventions + PIÈGES DÉJÀ PAYÉS
```
