---
description: Write the ACTUAL test suites of a feature (unit, integration on a real database, and end-to-end), as an author DISTINCT from the one who wrote the code. Reads the implementation, confronts it with the spec and the test checklist, writes durable committed suites, runs them for real, and reports each red as either a product defect or a false test assumption. This is the command that finds defects no review can see.
argument-hint: <path-to-plan-or-spec-file> [--scope backend|frontend|all]
allowed-tools: Read, Glob, Grep, Write, Edit, Bash(npm:*), Bash(npx:*), Bash(node:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(ls:*), Bash(curl:*), Agent
---

# Write Feature Tests — les suites qui trouvent ce qu'aucune relecture ne voit

Tu écris les **suites de test réelles et committées** d'une feature déjà implémentée : tests unitaires, tests d'intégration sur base réelle, et tests de bout en bout. Puis tu les **exécutes** et tu rends compte avec des chiffres réels.

**Plan / spec source :** $ARGUMENTS

---

## La règle qui fait toute la valeur de cette commande

> **Tu n'es pas l'auteur du code que tu testes.**

Si tu viens d'écrire l'implémentation dans le même fil, **dis-le et arrête-toi** : demande à l'utilisateur de relancer cette commande dans une session neuve, ou délègue-la à un agent qui n'a pas le contexte d'écriture.

**Pourquoi.** Un auteur qui teste son propre code teste **ce qu'il a voulu écrire**, pas ce qu'il a écrit. Sur le produit d'origine de cette commande, la séparation a seule révélé : des codes d'erreur déclarés au catalogue et **jamais levés**, un service de garde **non exporté** donc inopérant, un refus trompeur sur course perdue, des registres de sondes **vides** rendant des gardes inertes, un écran de configuration qui aurait été servi **vide**, un champ accepté par le DTO et **jamais écrit**, et un timeout qui n'existait pas. **Aucun n'était visible à la relecture** — tous se présentaient comme du code raisonnable.

Zéro défaut d'exécution n'a été trouvé par revue de plan ou lecture de code. Dix l'ont été par des suites écrites par un tiers.

---

## Phase 0 — Constater l'état RÉEL, jamais le supposer

1. **Lis le plan et la spec** passés en argument, et la checklist `_tests/<slug>.md` si elle existe (produite par `/create-feature-tests`).
2. **Lis le code livré**, fichier par fichier. Ne te fie à aucun rapport, aucun résumé, aucun commentaire de commit : `ls` les répertoires, ouvre les services, énumère les routes réellement montées.
3. **Note les écarts** entre ce que le plan annonce et ce que le code fait. Ce sont tes premières pistes de test.
4. **Écris l'attendu AVANT de le voir.** Pour chaque comportement à tester, note la valeur attendue **telle que la spec la déclare** — code d'erreur, champ présent ou absent, transition d'état, effet en base — et fais-le **avant tout lancement**. Ne dérive **jamais** une assertion d'un run préalable : une suite écrite depuis le comportement observé ne fait que documenter le code, ses défauts compris, et l'auteur distinct n'y change rien. C'est de cette confrontation spec ↔ code que sont sortis des codes d'erreur déclarés au catalogue et **jamais levés**. Quand la spec est muette, écris-le comme **trou de spec** dans le rapport : ce n'est pas une permission d'asserter sur l'observé.
5. **Vérifie que ça compile et que ça démarre** avant d'écrire une ligne : un typecheck rouge n'est pas un défaut à tester, c'est un travail non terminé — signale-le et arrête-toi.

> ⚠️ Si des fichiers semblent coupés en pleine écriture, **quelqu'un écrit peut-être en ce moment**. Ne conclus pas au défaut : demande.

## Phase 1 — Découvrir les conventions de test du projet

- Lis `CLAUDE.md` (portes de validation, pièges déjà payés, commandes).
- Ouvre **une suite existante** du même type et **copie sa structure** : harnais, helpers, nommage, en-têtes. Ne réinvente pas une convention.
- Repère les helpers déjà écrits (authentification, purge, fixtures, utilitaires d'interface) et **réutilise-les**.
- Relève les identifiants de test réels (`data-testid`) **dans les composants** — n'invente aucun sélecteur.

## Phase 2 — Choisir ce que chaque niveau doit prouver

| Niveau | Ce qu'il seul détecte | À écrire quand |
|---|---|---|
| **Unitaire** | Logique pure : calculs, cascades, machines d'état, tables de transitions | Il existe une fonction pure non triviale |
| **Intégration (base réelle)** | Résolution d'injection au démarrage, contraintes de base, transactions, courses, cloisonnement effectif | **Toujours**, pour tout module backend |
| **Bout en bout (build de production)** | Que l'utilisateur peut réellement accomplir le parcours | La feature a une surface visible |

Ne duplique pas : ce qu'un test unitaire prouve, un test d'intégration n'a pas à le re-prouver.

## Phase 3 — La doctrine d'assertion (le cœur)

### 3.1 Toute assertion négative est doublée d'une positive DANS LE MÊME TEST

Sans le couple, une route cassée qui répond 404 à tout le monde **se lit comme un cloisonnement qui fonctionne**, et une garde qui refuse tout passe le test tout en rendant la fonction inutilisable.

```
// ❌ prouve seulement qu'on obtient 404
await api.get(`/objets/${autrui}`).expect(404);

// ✅ prouve le cloisonnement
await api.get(`/objets/${autrui}`).set(auth(voisin)).expect(404);
const vu = await api.get(`/objets/${autrui}`).set(auth(proprietaire)).expect(200);
expect(vu.body.data.id).toBe(autrui);
```

### 3.2 Viser la bonne chose

| La question | Assert sur | Jamais sur |
|---|---|---|
| Qu'est-ce qui a été écrit ? | **L'état en base** | Le corps de la réponse |
| Ce champ est-il transmis ? | **La forme du JSON** (`not.toHaveProperty`) | Ce qui s'affiche — un champ envoyé puis masqué est **divulgué** |
| Une donnée est-elle sortie ? | **Le compteur d'appels du simulacre** | Le code HTTP — un 404 prouve qu'on a refusé, pas qu'aucun octet n'est parti |
| Qu'est-ce qui est transmis ? | **Le contenu reçu par le simulacre**, champ par champ | Un simple « ça a marché » |
| La transaction défait-elle tout ? | Un **échec injecté APRÈS des écritures réelles** | Un échec en tête, qui ne prouve rien |
| Ce fait déclenche-t-il quelque chose ? | **Un automatisme réellement configuré** et son effet produit | Le nombre d'événements émis |
| Deux gestes simultanés ? | **`Promise.all`** | Deux appels séquentiels, qui ne testent rien |

### 3.3 Semer des données-pièges

Quand un test vérifie qu'une donnée **ne sort pas** (contexte transmis à un tiers, vue restreinte d'un rôle), semer des valeurs reconnaissables dans les champs interdits **et** vérifier que les champs autorisés sortent bien. Sans la seconde moitié, **un contexte vide ferait passer le test**.

### 3.4 Un vocabulaire fermé doit être ÉMIS

Si la feature ajoute une valeur à un enum de faits, d'actions ou de types, **configurer un abonné réel et vérifier qu'il produit son effet**. Compter les événements ne prouve pas qu'ils sont écoutés — c'est exactement le défaut qui s'est répété trois fois sur le produit d'origine : des valeurs au catalogue que personne n'émettait, donc des automatismes qui ne se déclenchaient jamais, **sans erreur ni log**.

### 3.5 Faire échouer la garde volontairement, une fois

Pour tout test de garde-fou structurel (couverture de décorateurs, registre de namespaces, invariant de schéma), **le casser exprès une fois** et vérifier qu'il rougit **en nommant la cause**, puis rétablir. Une garde qu'on n'a jamais vue mordre n'a pas été vérifiée, elle a été écrite.

### 3.6 Prouver qu'un test discrimine : muter le CODE, pas le test

§3.5 casse la garde ; ici on casse **le produit**. Sur deux lots entiers, **aucun défaut n'est venu d'un rejeu de suite** — tous sont venus de sondes et de mutations.

Pour **chaque test qui porte un invariant central** (seuil, quorum, cloisonnement, ordre, montant, unicité) : applique une **mutation minimale au code de production** — inverser une comparaison, retirer une condition d'un filtre, remplacer une constante par sa voisine, supprimer un `await` —, relance **ce seul test**, et exige qu'il rougisse **en nommant l'invariant**. Puis révoque la mutation, revalide le vert, et vérifie que l'arbre est propre.

Un test resté vert sous mutation ne garde rien : il documente un chemin d'exécution. Le corriger jusqu'à ce qu'il morde — ou dire qu'on n'a pas su le faire mordre, ce qui est déjà un résultat. En Phase 6 : `Tests prouvés par mutation : <test, mutation appliquée, message du rouge>`.

### 3.7 Un compte se fige à sa valeur MESURÉE, jamais à sa valeur cible

Quand une assertion porte sur un **compte** ou un **seuil** (lignes écrites, appels au simulacre, éléments rendus, permissions accordées), écris la valeur **relevée à l'instant où tu écris le test** — même si elle vaut **zéro**. Un compte écrit d'avance à sa valeur cible accepte en silence tout ce qui l'atteint, y compris par un autre chemin ; un compte figé au mesuré force l'étape suivante à le relever consciemment, et le diff montre ce qui a bougé.

Corollaire : **un compte n'est jamais suffisant seul.** Le doubler d'une assertion sur l'**identité** de ce qui est compté (`toEqual([...])`, liste triée), sinon cinq éléments quelconques satisfont « il y en a cinq ».

## Phase 4 — Écrire les suites

- **Une suite par domaine**, nommée selon la convention du projet.
- **En-tête de fichier** : ce que la suite prouve, et **pourquoi ces points-là** — le lecteur suivant doit comprendre l'intention sans relire le plan.
- **Session longue** : pour toute suite qui enchaîne des étapes dépendantes, monter application et jeu de données **une seule fois**, et ordonner les tests. Une étape N+1 n'a aucun sens si N a échoué.
- **Aucun sélecteur fragile** en e2e (texte de classe, position, XPath). Si un identifiant de test manque, **l'ajouter au composant** — c'est un défaut de testabilité, pas une raison de contourner.
- Commenter **le motif** de chaque assertion non évidente. Un test sans motif est supprimé au premier refactor.

## Phase 5 — Exécuter, pour de vrai

Lance les suites. **Cite les chiffres réels** (`N passed / M failed`, durée).

Pour chaque rouge :

1. **Ne jamais conclure « flake » sur un seul run.** Rejoue **en isolation**.
2. Si le rouge persiste, **diagnostique et dis lequel des deux** :
   - **défaut du produit** → corrige le produit, et explique la conséquence métier qu'il aurait eue ;
   - **hypothèse fausse du test** → corrige le test, et dis en quoi ton hypothèse était fausse.
3. Ne **jamais** neutraliser un test pour le faire passer (`skip`, sélecteur élargi, assertion retirée). Un test désarmé est pire qu'un test absent : il donne une confiance fausse.
4. **Défaut produit que tu ne corriges pas ici ? Laisse un réveil, pas un vide.** Si le correctif sort du périmètre, garde le test **écrit et committé**, marqué de l'annotation « attendu en échec » de ton runner (`test.fail()`, `xfail`) avec la raison en commentaire. Le jour du correctif, le runner annonce **« attendu en échec, mais réussi »** et rappelle de retirer l'annotation. Un test supprimé, `skip`é ou seulement mentionné dans un rapport ne réveille personne. En Phase 6 : `Défauts ouverts, tests en attente d'échec : <liste>`.

> ⚠️ **Ne lance aucun build ni test pendant qu'une écriture est en cours** — y compris la tienne. Une erreur de compilation prise pour un défaut fait perdre plus de temps que l'attente.

## Phase 6 — Rendre compte

```
Suites écrites : <fichiers>
Unitaires : N passed
Intégration : N passed (M suites, base réelle)
Bout en bout : N passed (durée)

Défauts PRODUIT trouvés et corrigés : <liste, avec la conséquence métier de chacun>
Hypothèses FAUSSES du test, corrigées : <liste>
Gardes vérifiées en les cassant : <liste>
Non couvert, et pourquoi : <liste — jamais d'omission silencieuse>
```

Si un point de la checklist `_tests/` n'a pas pu être couvert, **le dire explicitement** plutôt que de le laisser coché ou absent.

---

## Règles importantes

- **Tu n'écris pas le code de la feature.** Tu corriges le produit **uniquement** quand un test révèle un défaut réel, et tu le signales comme tel.
- **Ne coche jamais un point dont tu n'as pas vu le test passer.**
- **Chiffres vérifiés, jamais estimés.** Si tu n'as pas pu exécuter, dis-le — un rapport optimiste vaut moins que pas de rapport.
- **Un temps mesuré aberrant** (plusieurs heures) n'est pas un temps de test : c'est une machine en veille.
- **PROJET-AGNOSTIQUE** — adapte runners, chemins et conventions au projet réel, découverts en Phase 1.
