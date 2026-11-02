---
description: Mechanically cross-check the contracts between backend and frontend — routes served but never consumed, routes consumed but never served, navigation entries pointing to nonexistent pages, closed vocabularies whose values are never emitted, tokens injected but never provided, and settings screens that cannot write. Finds the defects that compile, pass every test suite, and still make a feature unreachable.
argument-hint: [--scope api|navigation|vocabularies|all]
allowed-tools: Read, Glob, Grep, Bash(ls:*), Bash(node:*), Bash(npm:*), Bash(npx:*), Bash(curl:*), Agent
---

# Audit Contracts — la dérive que personne ne regarde

Tu confrontes **mécaniquement** ce que le backend expose à ce que le frontend consomme, et ce que le code déclare à ce qu'il utilise réellement. Tu ne relis pas le code : tu **croises des listes**.

**Périmètre :** $ARGUMENTS (défaut : `all`)

---

## Pourquoi cette commande existe

Trois trous ont échappé à **toutes** les portes du produit d'origine — typecheck, lint, 963 tests unitaires, 199 tests d'intégration, 27 tests de bout en bout :

- **sept routes de réglages sans contrôleur** : les écrans s'affichaient et ne pouvaient rien écrire. La matrice qui conditionne tout le calcul de délais était donc en lecture seule pour toujours ;
- **six routes d'écriture sans aucun endpoint câblé côté client** : les gestes existaient et étaient inatteignables par un utilisateur ;
- **une entrée de menu vers une route inexistante** : un clic menait à une page d'erreur du framework.

Chacun compilait. Chacun passait ses tests. Aucun n'était visible à la relecture — parce que **le défaut n'est dans aucun des deux côtés, il est dans l'écart entre les deux**.

---

## Phase 0 — Découvrir la topologie

1. Lis `CLAUDE.md` : conventions de routage, préfixe d'API, registre d'endpoints côté client, fichier de navigation.
2. Repère les fichiers pivots :
   - backend : les décorateurs de contrôleur et de méthode ;
   - frontend : le registre centralisé d'URL, les fonctions de la couche API, le fichier de navigation ;
   - vocabulaires fermés : enums de base et constantes `as const` servant de catalogue.
3. Si le projet n'a **pas** de registre d'URL centralisé, **c'est déjà un constat** : le croisement devient impossible à automatiser. Signale-le comme finding structurel.

## Phase 1 — Les cinq croisements

### 1.1 Routes servies ↔ routes consommées

- **Liste A** : toutes les routes montées par le backend (chemin de contrôleur + chemin de méthode + verbe).
- **Liste B** : toutes les routes appelées par le frontend (registre d'URL + appels de la couche API).

Rapporte :
- **`B \ A` — consommé mais non servi.** Défaut **bloquant** : l'écran est cassé à l'exécution. C'est le plus grave des cinq.
- **`A \ B` — servi mais non consommé.** Deux lectures possibles, à trancher : soit une fonctionnalité **inatteignable** par l'utilisateur, soit une route légitimement réservée (webhook, tâche planifiée, usage inter-services). **Demande** plutôt que de supposer.

⚠️ Attention aux chemins composés : un contrôleur peut porter un préfixe paramétré, et plusieurs contrôleurs peuvent partager la même racine. Normalise les deux listes avant de comparer, et **compte** les routes de chaque côté pour vérifier que ta normalisation n'en a pas perdu.

### 1.2 Navigation ↔ pages existantes

- Chaque entrée de navigation pointe-t-elle vers une **page réellement présente** dans l'arborescence de routage ?
- Une entrée conditionnée à une capacité (fonction désactivable) est-elle bien **absente** quand la capacité l'est ? Si le backend répond « introuvable » sur une fonction éteinte, l'entrée ne doit pas exister — l'afficher mène l'utilisateur vers un écran qui **ne peut pas** exister.

### 1.3 Vocabulaires fermés ↔ émetteurs réels

Pour chaque enum ou catalogue fermé de **faits**, d'**actions** ou de **types** :

- chaque valeur est-elle **produite** quelque part dans le code ?
- chaque valeur a-t-elle son **libellé traduit**, dans **toutes** les langues ?

Une valeur jamais émise crée une **panne muette** : un utilisateur abonne un automatisme dessus et n'obtient rien, sans erreur ni log, et conclut que la fonction est cassée. Ce défaut s'est répété **trois fois** sur le produit d'origine.

### 1.4 Jetons d'injection ↔ implémentations fournies

- Chaque jeton **injecté** est-il **fourni** par un module ?
- Les jetons injectés en optionnel sont-ils **volontairement** optionnels, ou l'optionnalité masque-t-elle un câblage manquant ? Un jeton optionnel non fourni fait s'accomplir le geste **sans son effet**, silencieusement.
- Les fournisseurs utilisent-ils la forme qui réutilise l'instance existante plutôt que d'en créer une seconde ? Deux instances = deux états = deux chemins d'écriture dont un seul est testé.

### 1.5 Colonnes lues ↔ colonnes écrites

Pour les entités centrales, croise les colonnes **lues** (projections, cascades de résolution) avec les colonnes **écrites** (créations, mises à jour).

- Une colonne **lue et jamais écrite** est un niveau de configuration mort : le code la consulte, la donnée n'existera jamais.
- Une colonne **écrite et jamais lue** est soit du code mort, soit un oubli de projection.

C'est ce croisement qui a révélé, sur le produit d'origine, une dérogation par objet que la cascade consultait et que **rien ne pouvait renseigner**.

## Phase 2 — Qualifier chaque écart

Ne rends pas une liste brute. Pour chaque écart :

| Champ | Contenu |
|---|---|
| **Constat** | Le fait, avec `fichier:ligne` des deux côtés |
| **Gravité** | **Bloquant** (cassé à l'exécution) · **Fonctionnel** (inatteignable) · **Dette** (mort ou incohérent) |
| **Conséquence** | Ce que l'utilisateur vit — pas ce que le code fait |
| **Lecture alternative** | Ce qui rendrait l'écart légitime, s'il y en a une |

**Une gravité honnête.** Si tu ne trouves que de la dette, dis-le. Gonfler un écart en « bloquant » pour paraître utile fait perdre la confiance dans les vrais.

## Phase 3 — Vérifier avant d'affirmer

Un croisement par grep produit des **faux positifs** : chemins construits dynamiquement, routes montées par un module partagé, alias. Avant de rapporter :

- **ouvre le fichier** des deux côtés ;
- si un doute subsiste sur une route, **interroge l'application vivante** (`curl`) plutôt que de conclure ;
- si un nom de fichier ne correspond pas à ce que tu cherchais, **élargis le motif** avant de conclure à l'absence — une migration nommée `..._ai_assistance` ne correspond pas à un motif `*_ai`.

Ne rapporte que ce que tu as **vu**.

## Phase 4 — Rendre compte

```
AUDIT DE CONTRATS — <projet>

Routes servies : N   ·   consommées : M
  Consommé non servi (BLOQUANT) : <liste>
  Servi non consommé            : <liste, avec lecture alternative>

Navigation : N entrées
  Vers une page inexistante     : <liste>
  Conditionnement manquant      : <liste>

Vocabulaires fermés : N valeurs
  Jamais émises                 : <liste>
  Sans libellé traduit          : <liste>

Jetons : N injectés / M fournis
  Non fournis                   : <liste>
  Optionnels suspects           : <liste>

Colonnes centrales
  Lues jamais écrites           : <liste>
  Écrites jamais lues           : <liste>

Total : X bloquants · Y fonctionnels · Z dettes
```

Termine par une **recommandation d'ordre** : quoi fermer d'abord, et pourquoi.

---

## Règles importantes

- **Tu ne corriges rien.** Cette commande constate et qualifie. La correction relève d'une feature, avec sa spec et sa porte.
- **Aucun écart inventé.** Chaque ligne du rapport cite ses deux côtés.
- **PROJET-AGNOSTIQUE** — la topologie se découvre en Phase 0. Si un croisement n'a pas de sens pour ce projet, le sauter et le dire.
- Lance les cinq croisements **en parallèle** via des agents si le projet est volumineux : ils sont indépendants, et chacun produit une liste courte.
