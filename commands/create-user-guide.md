---
description: Analyse un projet applicatif de bout en bout puis produit un guide utilisateur illustré (HTML + PDF) suivant un parcours métier réel et ordonné, avec de vraies captures d'écran de l'application en fonctionnement. Pensé pour une présentation à un partenaire, un investisseur ou un nouveau client.
argument-hint: [chemin du projet ou angle souhaité — optionnel]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, Workflow, TaskCreate, TaskUpdate, TaskList
---

# Create User Guide — Guide utilisateur illustré (HTML + PDF)

Tu produis un **guide utilisateur illustré** d'un projet applicatif : un document qui présente le produit **de bout en bout**, en suivant un **parcours métier réel et ordonné**, illustré par de **vraies captures d'écran** de l'application en fonctionnement.

**Input :** `$ARGUMENTS` (facultatif — chemin du projet, ou angle particulier demandé)

**Cible du document** : une personne qui ne connaît pas le produit — futur partenaire, investisseur, client, nouvel employé. Elle doit comprendre **ce que le produit fait et pourquoi c'est utile**, sans jamais avoir à connaître la technique.

**Livrables** :
```
docs/guide-utilisateur/
├── guide-utilisateur.pdf     ← le document à transmettre (tout embarqué)
├── guide-utilisateur.html    ← version web, éditable
└── images/                   ← captures d'écran réelles
```

---

## Parallélisation (gagner du temps)

L'exploration d'un projet inconnu est le poste le plus coûteux. Si le projet est volumineux (plus d'une dizaine de modules) :

- Lance **plusieurs agents d'exploration en parallèle** (Agent, ou le Workflow tool si l'utilisateur a activé ultracode / dynamic workflow) : un par domaine — parcours utilisateur et écrans, modèle de données et cycles de vie, règles métier et garde-fous, configuration et rôles.
- Donne à chacun une **consigne de sortie stricte** : ce qu'il rapporte doit être des faits cités (fichier, route, libellé), pas des impressions.
- **Ne parallélise PAS la capture d'écrans ni la rédaction** : la capture est séquentielle par nature (un seul navigateur, un seul jeu de données), et la rédaction doit avoir une seule voix.

Sinon, explore directement — c'est plus court que d'orchestrer.

---

## Phase 0 — Comprendre le projet (ne jamais sauter)

1. **Lire `CLAUDE.md`** s'il existe (nom du produit, domaine métier, stack, conventions), puis le README, les specs, les resumes de features (`_resumes/`, `docs/`, `specs/`).
2. **Identifier le métier, pas la technique** — réponds à ces questions avant d'écrire une ligne :
   - Quel problème concret le produit résout-il, et pour qui ?
   - Qui sont les **acteurs** (rôles) et que fait chacun ?
   - Quel est l'**objet central** qui traverse le produit (un dossier, une commande, un événement, un ticket, un patient) ?
   - Quel est son **cycle de vie** (les statuts qu'il traverse, dans quel ordre) ?
   - Quels **concepts métier** demandent une explication à un néophyte ?
3. **Cartographier les écrans** : `Glob` sur les routes (`app/**/page.tsx`, `pages/**`, `src/routes/**`, `lib/screens/**`…). Repérer les libellés de navigation réels — ils deviendront les chemins cités dans le guide.
4. **Repérer les rôles et le filtrage** : ce qu'un rôle voit ou ne voit pas est une information forte pour un partenaire.

## Phase 1 — Vérifier que l'application est démarrable ET peuplée

**Sans application en fonctionnement, pas de captures — donc pas de guide.** C'est le prérequis bloquant.

1. Repérer les commandes de démarrage (`package.json`, `Makefile`, `docker-compose.yml`) et les ports.
2. **Démarrer le backend puis le frontend**, en arrière-plan, et **sonder** chacun (`curl` sur une route de santé et sur une page) avant de continuer.
3. **Vérifier l'outillage de capture MAINTENANT**, pas au moment de capturer : le paquet npm et le binaire navigateur sont **deux choses distinctes** — `npx playwright install chromium` n'installe que le second. Si le projet n'a pas de tests e2e : `npm i -D @playwright/test && npx playwright install chromium`.
4. **S'assurer que des données de démonstration existent** (`npm run seed:dev` ou équivalent). Un guide illustré par des écrans vides ne vaut rien. S'il n'y a pas de seed, en créer un jeu minimal via l'API.
5. **Inventorier les données réelles** (identifiants des enregistrements, références, statuts) via l'API ou la base : le script de capture naviguera vers de **vraies pages de détail**, pas vers des listes vides.
6. **Relever de quoi s'authentifier** — sans ça la Phase 3 est bloquée :
   - les **identifiants de démonstration** (souvent affichés par le seed, sinon dans le README ou les fixtures) ;
   - la **route de connexion** et la forme exacte de sa réponse ;
   - le **schéma de session** : lis le client HTTP du frontend (`lib/axios.ts`, `api.ts`, intercepteurs) pour savoir si le jeton voyage en `localStorage`, en cookie ou en en-tête — c'est ce qui détermine comment l'injecter ;
   - s'il existe un **second acteur** (espace client, portail public, back-office séparé), note **comment obtenir son accès**. Un lien signé ou un jeton à usage unique n'est en général pas restituable par l'API : il faut souvent l'écrire en base (poser une empreinte connue) via un script jetable.
7. Choisir un **fil rouge nommé** : un client, une commande, un dossier précis qui servira d'exemple dans tout le document.

> Si l'application ne peut pas être démarrée, **arrête-toi et dis-le à l'utilisateur** avec la raison. Ne produis pas un guide sans illustrations en faisant comme si de rien n'était.

## Phase 2 — Concevoir le parcours

Construis la **table des matières comme une chronologie vécue**, pas comme une arborescence de menus.

**Deux niveaux, à ne jamais confondre.**

Les **moments** ci-dessous sont un plan de travail, **pas des titres**. Ordre canonique d'un logiciel de gestion — adapte au domaine, supprime un moment absent du produit, n'en invente aucun :

1. **Naissance** — inscription, création du compte/organisation
2. **Configuration** — identité, marque, équipe et rôles, référentiels métier, automatismes
3. **Premier usage** — créer l'entité de base (client, produit, patient…)
4. **Le cœur du métier** — ouvrir l'objet central, le faire avancer, collecter, valider
5. **La relation externe** — ce que voient les clients/partenaires/fournisseurs
6. **L'argent** — devis, facture, encaissement, reçu (si applicable)
7. **La fin de vie** — clôture, archivage, historisation
8. **Le recul** — tableaux de bord, rapports, exports

Les **sections** sont ce que le lecteur voit. **Un moment se découpe en 1 à 7 sections**, une par *action* accomplie devant un écran : « Configuration » n'en fait jamais une seule, elle en fait autant qu'il y a d'écrans de réglage réellement présents. **Vise 15 à 22 sections numérotées** — en dessous de 12, tu as écrit un sommaire, pas un guide.

**Titre de section = un verbe à l'infinitif + son complément métier** : « Constituer l'équipe », « Préparer les checklists », « Facturer et encaisser », « Piloter l'activité ». Jamais un nom de menu (« Paramètres », « Facturation »), jamais une étiquette de moment (« Configuration », « Le recul ») : lu d'affilée, le sommaire doit se lire comme une suite d'actions.

**Un seul fil narratif.** Si le produit a plusieurs acteurs (interne / client, vendeur / acheteur), n'écris pas deux parcours parallèles : le second acteur entre **comme une section du premier**, au moment exact où il est sollicité, puis on revient au fil principal.

Chaque section indique **qui** agit (le rôle) et **où** (le chemin dans l'application).

## Phase 3 — Capturer les écrans

Écris un script Playwright (ou l'outil e2e du projet) et exécute-le. **Un écran par section du parcours**, 15 à 30 captures.

### Règles de capture

- **Viewport 1440×900, `deviceScaleFactor: 2`** — les captures doivent rester nettes à l'impression.
- **Fixer `locale` et `timezoneId`** aux valeurs attendues par l'application (évite les incohérences de dates et les artefacts d'hydratation).
- **S'authentifier par l'API puis injecter la session** (`addInitScript` posant le token dans `localStorage`/cookie) — ne scripte pas le formulaire de connexion, c'est lent et fragile.
- **Capture pleine page** (`fullPage: true`) pour les écrans de configuration et de détail ; **capture viewport** pour les listes et tableaux de bord (une pleine page de liste est illisible en PDF).
- **Une identité par contexte navigateur** : espace interne, espace client/public et vue mobile sont **trois contextes distincts** (le stockage local ne se partage pas).
- **Ajouter au moins une capture mobile** (375 px) si le produit a une surface consultée au téléphone.
- Nommer les fichiers **`NN-slug.png`** dans l'ordre du parcours : le nom porte l'ordre de lecture.

### Pièges vérifiés — à éviter d'emblée

| Piège | Conséquence | Parade |
|---|---|---|
| `waitUntil: "networkidle"` | **Timeout** si l'app sonde en continu (notifications, websocket) | `domcontentloaded` + `waitForTimeout` explicite |
| Script écrit via `cat <<EOF` en Bash | Le shell interprète `\`, `$var` et les backticks → `SyntaxError` ou script silencieusement faux | Écrire les scripts avec l'outil **Write**, jamais par heredoc |
| `import` d'un paquet e2e depuis un `.mjs` | Échec de résolution du module (le paquet n'expose pas toujours d'entrée ESM) | Écrire le script en **`.cjs`** avec `require()` + `(async () => { … })()`. *(Ce n'est PAS un problème de `await` de premier niveau : un `.mjs` est toujours ESM et le supporte depuis Node 14.8.)* |
| Capture avant hydratation | Écran vide ou squelette | Attendre un testid/élément réel, puis une temporisation |
| Données de démo modifiées par la capture | Base polluée | Restaurer après coup, ou capturer en lecture seule |

### Contrôle immédiat

Après le script, **vérifie que chaque fichier existe et pèse un poids plausible**. Une capture de 3 Ko est un écran blanc.

## Phase 4 — Rédiger le HTML

Un seul fichier autonome, CSS en ligne, prêt à imprimer.

### Structure du document

1. **Couverture** — badge, titre du produit, sous-titre en une phrase, filet de couleur, et un petit tableau de contexte (parcours illustré, cas suivi, version). `break-after: page`.
2. **Sommaire** sur deux colonnes, ancré.
3. **« En une phrase »** — le produit résumé en deux ou trois lignes, en langage métier.
4. **Les sections numérotées** du parcours, chacune avec : pastille numérotée, titre, mention du rôle et du chemin, texte, encadrés, capture légendée.
5. **Récapitulatif final** — un tableau à trois colonnes : *Moment* / *Ce que fait l'utilisateur* / *Ce que fait l'application*.
6. **« Ce que l'organisation y gagne »** — 4 à 6 bénéfices concrets, formulés en gains, pas en fonctionnalités.

### Les deux types d'encadrés (c'est ce qui rend le guide pédagogique)

- **Encadré « concept » (couleur primaire)** — explique un terme métier **au moment où on le rencontre** : « Qu'est-ce qu'une checklist ? », « Qu'est-ce qu'un workflow ? », « À quoi sert le délai de traitement ? ». Deux paragraphes maximum. Sans ces encadrés, le lecteur néophyte décroche.
- **Encadré « à savoir » (couleur d'accent)** — met en avant un **garde-fou ou une intelligence du produit** : une validation qui protège, une automatisation, une règle qui évite une erreur coûteuse. C'est ce qui impressionne un partenaire, parce que ça montre que le produit a été pensé.

### CSS — les points qui comptent pour le PDF

```css
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; } /* garde les fonds colorés */
@page { size: A4; margin: 15mm 0; }
figure, table, .concept, .note { break-inside: avoid; }  /* rien ne se coupe en deux */
.cover { break-after: page; }
h2, h3 { break-after: avoid; }                            /* pas de titre orphelin en bas de page */
figure img { width: 100%; border: 1px solid var(--line); border-radius: 10px; }
figure img.phone { width: 300px; margin: 0 auto; }        /* les captures mobiles ne s'étirent pas */
```

Palette sobre : une couleur primaire, une couleur d'accent, des gris. Deux teintes suffisent.

### Règles de rédaction — non négociables

- **Vocabulaire métier uniquement.** Jamais de JWT, endpoint, migration, transaction, composant. Le lecteur est un dirigeant, pas un développeur. Écris « le client reçoit un lien personnel », pas « un token signé est émis ».
- **Le fil rouge est nommé et suivi** du début à la fin (« Marie Ngono demande un visa tourisme pour la France »). Un exemple concret vaut dix descriptions abstraites.
- **Chaque section dit qui agit et où** — « Paramètres › Équipe — administrateur ».
- **Les bénéfices sont formulés en gains**, pas en fonctionnalités : « plus d'appels *où en est mon dossier ?* » plutôt que « portail de suivi client ».
- **Ce que l'utilisateur externe ne voit jamais** mérite un encadré : c'est une préoccupation réelle de tout partenaire.
- **Aucune promesse fausse.** Ne décris que ce que l'application fait réellement — tu viens de l'explorer, tiens-t'en à ça. Si une fonctionnalité est désactivée par défaut, dis-le.
- **Légender chaque capture** d'une phrase qui apporte une information, pas qui répète le titre.

## Phase 5 — Générer le PDF

Impression du HTML par Chromium via Playwright (déjà présent si le projet a des tests e2e ; sinon `npx playwright install chromium`).

```js
// mkpdf.cjs — écrit avec l'outil Write, PAS par heredoc. Exécuté avec `node mkpdf.cjs`.
const { chromium } = require("@playwright/test");
const path = require("path");
const { pathToFileURL } = require("node:url");

// Chemins ABSOLUS depuis le dossier du script : l'outil Bash réinitialise le cwd
// entre deux appels, un chemin relatif écrirait le PDF ailleurs — ou échouerait.
const DIR = path.resolve(__dirname, "docs/guide-utilisateur");

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    // `networkidle` est ici le BON choix : sur une page file:// sans ressource
    // distante, il garantit que toutes les images sont chargées avant l'impression.
    // (La proscription du tableau des pièges vise l'application en fonctionnement.)
    await page.goto(pathToFileURL(path.join(DIR, "guide-utilisateur.html")).href, {
      waitUntil: "networkidle",
    });
    await page.pdf({
      path: path.join(DIR, "guide-utilisateur.pdf"),
      format: "A4",
      printBackground: true,          // sans ça, encadrés et couverture sortent BLANCS
      margin: { top: "14mm", bottom: "16mm", left: "0mm", right: "0mm" },
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate:
        '<div style="width:100%;font-size:8.5pt;color:#8a94a0;padding:0 18mm;display:flex;justify-content:space-between;font-family:Arial,sans-serif;"><span>NOM DU PRODUIT — Guide utilisateur</span><span class="pageNumber"></span></div>',
    });
    console.log("PDF OK");
  } catch (e) {
    console.error("ECHEC PDF:", e.message);   // sans ça, un échec ressemble à un succès
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
```

`pathToFileURL` plutôt qu'une concaténation `"file:///" + …` : elle encode les espaces et les accents (fréquents dans `C:\Users\…`) et produit une URL valide aussi bien sous Windows que sous POSIX.

**Les marges se déclarent à un seul endroit.** Sans `preferCSSPageSize: true`, ce sont les options de `page.pdf()` qui gagnent et le `@page { margin }` du CSS devient un leurre. Garde les valeurs cohérentes entre les deux, ou n'en déclare qu'une.

**Le HTML ne doit charger aucune ressource distante** (police Google, CDN) : hors ligne, en `file://`, elle échoue sans erreur visible et dégrade le PDF. Utilise une pile de polices système.

## Phase 6 — Vérifier le rendu

L'outil `Read` sur un PDF échoue si `poppler` n'est pas installé (fréquent sur Windows), et le lecteur PDF de Chromium ne se pilote pas. **Vérifie donc le HTML**, dont le PDF est l'impression fidèle.

Écris pour cela un `check.cjs` (même squelette que `mkpdf.cjs` : chemins absolus, `pathToFileURL`, `try/finally`) qui ouvre le HTML, évalue les deux contrôles ci-dessous, capture quelques sections — puis **supprime-le** en Phase 7.

1. Ouvre le HTML dans Chromium et **compte les images cassées** :
   ```js
   [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src)
   ```
   Le résultat doit être vide.
2. Vérifie l'**absence de débordement horizontal** : `document.documentElement.scrollWidth > window.innerWidth` doit être `false`.
3. **Capture 3 ou 4 sections** et **regarde-les réellement** avec `Read` : couverture, une section à encadré concept, une section à capture mobile.
4. Contrôle le **poids du PDF** : quelques Mo est normal avec des captures ; quelques Ko signifie que les images ne sont pas embarquées.

## Phase 7 — Nettoyer et rendre compte

1. **Supprimer les scripts jetables** (capture, génération, vérification) — ils n'ont pas à être versionnés.
2. **Supprimer les captures de contrôle** intermédiaires.
3. **Restaurer les données de démonstration** si la capture les a modifiées.
4. Committer les livrables si le projet est versionné, en suivant la convention de commits du dépôt.
5. **Rendre compte** :

```
Guide créé : docs/guide-utilisateur/
- guide-utilisateur.pdf ({taille}) — {N} pages
- guide-utilisateur.html + images/ ({N} captures réelles)
Parcours : {N} étapes, de {première} à {dernière}
Fil rouge : {exemple suivi}
Concepts expliqués : {liste}
```

---

## Règles importantes

- **PROJET-AGNOSTIQUE** — adapte le vocabulaire, les phases du parcours et les concepts au domaine réel. Un logiciel médical, une billetterie et un CRM n'ont ni le même objet central ni le même cycle de vie.
- **De vraies captures, jamais des maquettes** — c'est ce qui distingue un guide crédible d'une plaquette. Si l'application ne démarre pas, dis-le plutôt que de produire un document sans illustrations.
- **Le parcours prime sur l'exhaustivité** — un guide qui raconte une histoire complète bat un catalogue de toutes les fonctionnalités. Ce qui ne rentre pas dans le parcours n'entre pas dans le guide.
- **Expliquer au moment de la rencontre** — un concept se définit là où le lecteur le croise, pas dans un glossaire final que personne ne lit.
- **Langue du document = langue du projet** (specs en français → guide en français).
- **Ne jamais inventer une fonctionnalité.** En cas de doute sur un comportement, va le vérifier dans le code ou dans l'application.
- **Écrire les scripts avec Write, jamais par heredoc Bash** — le shell interprète backslashes, `$` et backticks, ce qui casse silencieusement expressions régulières et gabarits de chaîne.
- **Ne pas produire de code applicatif** — cette commande produit de la documentation. Si tu découvres un défaut du produit pendant l'exploration, **signale-le à l'utilisateur** sans le corriger de ta propre initiative.
