---
description: Run the project's full validation gate for real — clean build, typechecks, lint, unit tests, integration tests on a real database, live end-to-end tests, mechanical invariants, and the dev-mode i18n pass. Splits long runs so nothing gets killed mid-flight, cites real numbers, and never concludes "flake" on a single run. This is the ritual that says whether a feature is actually finished.
argument-hint: [--quick | --full] [--scope backend|frontend|all]
allowed-tools: Read, Glob, Grep, Bash(npm:*), Bash(npx:*), Bash(node:*), Bash(curl:*), Bash(bash:*), Bash(rm:*), Bash(ls:*), Bash(git status:*), Bash(git stash:*), Bash(git log:*), Bash(taskkill:*), Bash(netstat:*), Bash(powershell:*), Edit
---

# Run Gate — la porte de validation, exécutée pour de vrai

Tu exécutes la **porte de validation complète** du projet et tu rends compte avec des **chiffres réels**. Une feature n'est jamais terminée parce qu'elle compile : elle l'est quand cette porte est verte de bout en bout.

**Arguments :** $ARGUMENTS — `--quick` (typecheck + lint + unitaires), `--full` (tout, défaut), `--scope` pour restreindre.

---

## Quand la jouer — une fois, pas à chaque acteur

Cette porte **mesure**, elle ne **trouve** pas. Sur deux lots entiers, aucun défaut n'est venu d'un rejeu de suite : tous sont venus de sondes écrites pour l'occasion et de mutations du code.

- **Une seule exécution complète par lot**, à la fin. Si un acteur précédent l'a déjà jouée sur le **même état d'arbre** (même HEAD, mêmes fichiers non commités), **ne la rejoue pas** : cite son rapport et son horodatage, et rejoue seulement les étapes que ton travail a pu invalider — en disant lesquelles et pourquoi.
- Un vert de porte ne prouve **pas** que les gardes du lot mordent ; seules une mutation ou une sonde le prouvent. Ne conclus jamais « les gardes tiennent » : dis « rien de connu n'a régressé ».

## Phase 0 — Découvrir la porte de CE projet

Ne suppose aucune commande. Lis, dans l'ordre :

1. **`CLAUDE.md`** — section « porte de validation » et « pièges déjà payés ». Elle prime sur tout.
2. **`package.json`** des deux côtés — les scripts réels (`build:clean`, `test`, `test:e2e`, `test:unit`, `lint`).
3. **Les configurations de test** — repérer si les tests unitaires et de bout en bout ont des configurations **distinctes** (un `testDir` trop large rejoue les unitaires derrière un build long et rend le chiffre de porte ininterprétable).
4. **`scripts/`** — un script d'invariants versionné existe-t-il ?

Si une étape n'existe pas dans ce projet, **dis-le et passe** — n'invente pas une commande.

## Phase 1 — Vérifier qu'on peut mesurer quelque chose

- **Arbre propre ?** `git status`. Des modifications non commitées sont normales pendant le développement, mais **une écriture en cours fausse tout** : si des fichiers semblent coupés, demande avant de lancer.
- ⚠️ **Ne lance jamais la porte pendant qu'une écriture est en cours** — y compris la tienne. Une erreur de compilation prise pour un défaut fait perdre plus de temps que l'attente. C'est le piège le plus répété.
- **Base de données à jour** : appliquer les migrations en attente, régénérer le client ORM. Un client non régénéré produit des erreurs de type sur des valeurs d'enum neuves.
- **Ports libres** : un serveur périmé qui occupe le port fait tester un binaire d'avant les modifications. Le tuer, et **vérifier la fraîcheur** du processus relancé (par exemple en cherchant une route neuve dans son journal de démarrage).

### Phase 1 bis — ⚠️ GELER L'ENVIRONNEMENT (obligatoire, avant toute mesure)

Ces quatre points ne cassent rien : ils rendent le résultat **faux**. Chacun a coûté un diagnostic complet, et le symptôme n'accuse **jamais** la cause.

**1. Les processus survivants d'une mesure précédente.** Un serveur détaché laissé vivant écrit dans la base pendant la suite d'intégration — **y compris avec les crons désactivés**, parce que l'interrupteur neutralise le travail du cron, pas l'écriture de sa ligne de pouls. Mesuré : deux serveurs zombies pendant un run complet, **2 989 s au lieu de 840 s**, deux rouges faux sur des tests sensibles au temps.

> ⚠️ **Filtre par PORT ou par RÉPERTOIRE DE TRAVAIL, jamais par ligne de commande.** Trois produits du même poste lancent `node dist/main` : filtrer sur cette chaîne tue le serveur d'une autre session — c'est arrivé. Et un zombie qui a **perdu** son port continue d'écrire tout en étant invisible à une recherche par port : il faut les deux lectures.
>
> ⚠️ **La preuve est dans la DURÉE, pas dans le verdict.** Une suite rejouée après l'arrêt des zombies est passée de 81,6 s à 24,7 s. C'est ce rapport qui attribue ; un vert seul n'aurait rien prouvé.

**2. Aucun nettoyage disque pendant une porte.** Les caches de transformation des lanceurs de tests vivent dans le répertoire temporaire du système et **persistent entre les runs** : leur date de modification peut remonter à plusieurs jours alors qu'ils sont activement lus. Un filtre d'âge ne les protège donc pas. Mesuré : une suite arrêtée net après trois suites, **sans résumé, sans message et sans code de sortie** — le symptôme ressemble à un plantage du produit et n'a rien à voir avec lui.

> **Corollaire de lecture** : un journal de porte qui s'arrête sans ligne de total n'est **jamais** un échec de test, c'est un processus tué.

**3. L'arbre est gelé, sondes comprises.** Aucune mutation, aucune sonde de falsification, aucune correction « rapide » pendant que la porte tourne. Le lanceur compile chaque suite **au moment où il l'atteint** : les premières voient l'arbre propre, les suivantes voient la sonde. Mesuré : soixante secondes de sonde → **23 suites en échec sur 38**, toutes sur une erreur de compilation, avec une cause déjà disparue.

**4. Les sous-ensembles se jouent avec les drapeaux de la porte.** Un filtre de suites tapé à la main perd les options du script (l'exécution en série, notamment) : les suites démarrent en parallèle, leurs purges se détruisent, et l'on obtient des rouges spectaculaires et **faux**. Mesuré : **6 rouges sur 30** sans le drapeau, **30/30 avec**, sur un arbre identique. Un rouge obtenu autrement ne prouve rien tant qu'il n'a pas été rejoué dans les conditions de la porte.

**5. Lis le code de sortie de la COMMANDE, pas du wrapper.** Un tube, un `cd X &&`, un `| head`, une tâche de fond : tous rendent `0` pour autre chose que ce qu'on croit mesurer. **Compte les tests exécutés avant de lire le verdict** — un total de zéro test avec un code de sortie nul est le faux vert le plus courant.

Écris en une ligne ce que cette phase a trouvé, même quand elle ne trouve rien : *« environnement gelé : 0 processus résiduel, ports libres, arbre inchangé »*. Non écrite, la vérification est indiscernable de son omission.

## Phase 2 — L'ordre, et pourquoi il est celui-là

```
1. build propre        → purge dist/ ET les fichiers d'info de build incrémental
2. typecheck source    → le code
3. typecheck tests     → souvent PLUS STRICT que celui du code
4. lint                → avec correction automatique, puis SANS, pour vérifier
5. tests unitaires     → rapides, ils cadrent le diagnostic
6. tests d'intégration → base réelle : c'est ici que le conteneur démarre vraiment
7. tests bout en bout  → build de production, application vivante
8. invariants          → greps mécaniques versionnés
9. passe dev FR+EN     → la SEULE porte qui voit les erreurs i18n
```

**Chaque étape explique la suivante.** Un typecheck rouge rend inutile de lancer trois suites ; un conteneur qui ne démarre pas fait rougir toutes les suites d'intégration d'un coup, sans qu'aucun test métier ne s'exécute — ne conclus jamais « 12 suites rouges » sans avoir lu la **première** erreur.

### Points qui coûtent cher si on les oublie

- **Purge du build incrémental.** Supprimer `dist/` sans supprimer les fichiers `*.tsbuildinfo` ne ré-émet rien : le serveur démarre sur du vide et rend `MODULE_NOT_FOUND`.
- **Typecheck des tests séparément.** La configuration des tests est souvent plus stricte : un tableau vide non annoté y devient `never[]` alors que le build passe.
- **Backend détaché** pour tout run de bout en bout. Selon l'outillage, les processus d'arrière-plan sont tués vers dix minutes — un backend lancé en tâche de fond meurt au milieu du run.
- **Découper les runs longs.** Ne pas enchaîner build + unitaires + intégration + e2e en une seule invocation : si l'ensemble dépasse la limite d'exécution, on perd **tout le résultat**, pas seulement la dernière étape.
- **`lint --fix` puis `lint` sans `--fix`.** Le premier corrige, le second **prouve**. Ne rapporte jamais le premier comme résultat.
- **Un invariant jamais vu rouge n'est pas un invariant.** Un `N/N` ne prouve rien si le motif ne peut matcher personne : un contrôle sensible à la casse est resté vert en ne voyant que la moitié des cas. La **première fois** qu'un invariant entre dans la porte — et à chaque fois qu'on le modifie — introduis volontairement une violation, **vois-le rouge**, remets en état, et note dans le rapport que le rouge a été observé.

## Phase 3 — Traiter un rouge

> **Un rouge n'est JAMAIS conclu « flake » sur un seul run.**

1. **Rejouer en isolation** (la suite seule, puis le test seul).
2. Si le rouge persiste, établir s'il est **pré-existant** : `git stash` sur arbre vierge, rejouer. Un rouge déjà présent sur la base n'appartient pas à la feature — le dire, ne pas le masquer.
3. **Diagnostiquer explicitement**, et dire lequel :
   - **défaut du produit** → corriger le produit, expliquer la conséquence métier qu'il aurait eue ;
   - **hypothèse fausse du test** → corriger le test, dire en quoi l'hypothèse était fausse ;
   - **environnement** (clé absente, port occupé, base non migrée) → corriger l'environnement, et le **consigner** s'il peut se reproduire chez un tiers.

⚠️ L'arbitrage entre « défaut du produit » et « hypothèse fausse du test » se tranche **contre la spec, jamais contre le comportement observé du code** : rouvre le critère d'acceptation concerné et **cite-le mot pour mot** dans ton diagnostic. Sans ce retour à la spec, « hypothèse fausse du test » est l'issue de secours par laquelle un défaut se transforme en assertion assouplie.

4. **Ne jamais neutraliser** un test pour le faire passer. Un `skip`, un sélecteur élargi ou une assertion retirée transforment une porte en décoration.
5. **Un vert inattendu se traite comme un rouge.** Une suite qui rapporte « attendu en échec, mais réussi » (`test.fail()`, `xfail`) n'est pas du bruit : c'est le réveil qui dit que le correctif est arrivé. Retire l'annotation dans la foulée, vérifie que le test reste vert sans elle, et **mentionne-le dans le rapport**.

Un temps mesuré aberrant (plusieurs heures) n'est pas un temps de test : c'est une machine en veille. Le signaler, ne pas l'interpréter.

## Phase 4 — La passe i18n, à ne jamais sauter

Si le projet est multilingue, démarrer le serveur **en mode développement** — pas le build de production — et parcourir **toutes** les routes dans **chaque** langue en relevant les erreurs d'internationalisation dans la console.

**Pourquoi elle est irremplaçable** : certaines validations (clé mal formée, namespace non déclaré, argument de message manquant) ne s'exécutent **qu'en mode développement**. Ni le build de production, ni les tests de bout en bout ne les voient — et elles cassent l'application entière chez le développeur suivant.

**Et la réciproque est vraie.** Certains défauts n'existent **qu'en build de production** : un minifieur repliant une liste de sélecteurs en une forme condensée a supprimé une fonctionnalité entière — ni la relecture, ni le mode développement, ni les unitaires ne pouvaient le voir. Les parcours de bout en bout se jouent donc **sur le build de production**, jamais sur le serveur de développement parce qu'il était déjà lancé. Un comportement validé uniquement en mode développement n'est **pas** validé, et il est rapporté comme non exécuté.

## Phase 5 — Rendre compte

```
PORTE DE VALIDATION — <feature ou branche>

| Étape                    | Résultat        |
|--------------------------|-----------------|
| Build propre             | 0               |
| Typecheck source / tests | 0 / 0           |
| Lint                     | 0 erreur        |
| Unitaires                | N passed (X s)  |
| Intégration (base réelle)| N passed, M suites |
| Bout en bout (live)      | N passed (X min)|
| Invariants               | N/N             |
| Écart vs porte précédente| +N / −N — expliqué |
| Passe dev FR+EN          | 0 erreur i18n   |

Rouges rencontrés : <liste, avec diagnostic — produit / test / environnement>
Non exécuté, et pourquoi : <liste explicite>
Verdict : PORTE FRANCHIE | PORTE NON FRANCHIE
```

**Un chiffre qui baisse est un défaut jusqu'à preuve du contraire.** Relis le **dernier rapport de porte** de ce projet avant de rédiger le tien et compare case par case : un total qui baisse sans explication écrite est un test disparu, filtré ou neutralisé — traite-le comme un **rouge** tant que tu n'as pas nommé le commit qui l'a retiré et la raison. Compte les **`skipped` et les filtrés séparément des `passed`** : ce sont des tests **non exécutés**. Tout `N passed` obtenu derrière un filtre est annoncé **avec le filtre exact**.

**Règle de rapport** : ce qui n'a pas été exécuté est **dit**, jamais omis. Une porte partiellement franchie annoncée comme verte est plus nuisible qu'une porte échouée.

---

## Règles importantes

- **PROJET-AGNOSTIQUE** — les commandes viennent du projet, découvertes en Phase 0.
- **Aucun chiffre estimé.** Chaque nombre est lu dans une sortie réelle.
- **Ne modifie pas le code de la feature** hors correction d'un défaut que la porte révèle — et signale-la alors comme telle.
- **Ne commite pas.** Cette commande mesure ; c'est `/commit-message` qui enregistre.
- Si l'application ne peut pas démarrer, **s'arrêter et dire pourquoi** plutôt que de rendre un verdict sur des étapes sautées.
