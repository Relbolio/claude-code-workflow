# STACK PRESET — Next.js 16 + NestJS 11 + Prisma 7 + PostgreSQL

> **Instructions a `/generate-architecture`** : Si ce fichier est passe en argument, **utiliser les choix ci-dessous tels quels** et **sauter completement la Phase 2 (questionnaire interactif)**. Ne poser aucune question sur le framework, la base de donnees, le state management, l'architecture pattern ou les librairies. N'adapter que **les features et modeles de donnees** a partir des user stories / specs fournies en premier argument.

> **Version preset** : 2.0
> **Cible** : Applications web fullstack metier (frontend + API backend) avec authentification, autorisation fine, donnees sensibles, journal opposable, i18n, et regles metier a garde-fous.
> **Origine** : Extrait de deux produits valides en production, dont un logiciel de gestion a fort enjeu juridique (delais de forclusion, secret professionnel, journal opposable). Generique — aucune reference au domaine metier d'origine.

> **Ce qui a change depuis la 1.0** : le preset ne decrit plus seulement *quoi* installer, mais *pourquoi* chaque convention existe et *quel defaut elle previent*. Les sections 4 (doctrines), 6 (pieges deja payes) et 7 (doctrine de test) sont nouvelles et sont **la valeur principale du document** — une architecture generee sans elles compile, passe ses tests, et casse en production sur des pannes muettes.

---

## 1. Metadata du preset

| Champ | Valeur |
|-------|--------|
| Nom stack | `nextjs-nestjs-prisma` |
| Type d'app | Web fullstack (Next App Router + API NestJS separee) |
| Plateformes | Web (desktop + mobile responsive, **concu mobile-first**). Mobile natif non couvert. |
| Langue | Identifiants en anglais. UI multilingue (FR + EN par defaut, livres **simultanement**). |
| Monorepo | Oui, mais **frontend et backend independants** : un `package.json`, un `tsconfig.json`, un `node_modules/` par cote. **Pas** de workspaces npm/pnpm/turbo. **Pas** de package partage. Les types TS sont dupliques volontairement cote frontend. |
| Prefixe projet | A choisir des le depart (ex. `av-`, `kg-`, `bm-`). Il nomme les composants partages (`components/<prefixe>-*.tsx`), les tokens CSS (`--<prefixe>-*`), les stores et les cles de stockage. **Ne jamais melanger deux prefixes** dans un depot : un grep de porte doit rendre zero occurrence du prefixe d'un produit voisin. |

---

## 2. Tech stack fige (remplace la Phase 2 de `/generate-architecture`)

### 2.1 Frontend

| Couche | Choix | Version plancher |
|--------|-------|------------------|
| Framework | **Next.js (App Router)** | 16+ |
| UI | **React + TypeScript strict** | React 19+ / TS 5+ |
| Styling | **Tailwind CSS** | 4+ |
| Composants | **shadcn/ui** (CLI `shadcn`, primitives `@base-ui/react`) | CLI 4+ |
| State serveur | **TanStack Query** | 5+ |
| State client | **Zustand** | 5+ |
| HTTP client | **Axios** (instance unique + interceptors) | 1+ |
| Formulaires | **React Hook Form + Zod + `@hookform/resolvers`** | RHF 7+ / Zod 4+ |
| i18n | **next-intl** — sans prefixe d'URL, **registre de namespaces explicite** (voir §4.6) | 4+ |
| Icones | **lucide-react** | 1+ |
| Toasts | **sonner** | 2+ |
| Utils classes | `clsx` + `tailwind-merge` + `class-variance-authority` | - |
| Dates | `date-fns` | 4+ |
| Themes | `next-themes` (clair/sombre) | 0.4+ |
| Tests unitaires | **Runner Playwright, configuration DEDIEE sans `webServer`** (voir §7.4) | 1.5+ |
| Tests E2E | **Playwright** sur build de **production** | 1.5+ |
| Linter | ESLint + `eslint-config-next` + `prettier` | - |

### 2.2 Backend

| Couche | Choix | Version plancher |
|--------|-------|------------------|
| Framework | **NestJS** | 11+ |
| Language | **TypeScript strict, zero `any`** (ni `as any`) hors code genere | 5+ |
| ORM | **Prisma + driver adapter `@prisma/adapter-pg`** (obligatoire en Prisma 7). Datasource dans `prisma.config.ts`, pas dans `schema.prisma`. | 7+ |
| Database | **PostgreSQL** — **verifier la version REELLE de la cible** | 14+ |
| Auth | **JWT** (`@nestjs/jwt`) + **Passport** (JWT, OAuth si besoin) | - |
| Hachage | `bcrypt` (cout >= 12) | 6+ |
| Scheduler | `@nestjs/schedule` (voir doctrine cron §4.9) | 6+ |
| Validation | `class-validator` + `class-transformer`, `ValidationPipe` globale `whitelist` + `forbidNonWhitelisted` | - |
| Config | `@nestjs/config` type-safe + `dotenv` | - |
| API docs | `@nestjs/swagger` sur `/api/docs` | - |
| Rate limiting | `@nestjs/throttler` | 6+ |
| Tests | Jest (unitaires) + **Supertest sur base REELLE** (integration) | - |
| Realtime (si besoin) | Socket.IO via `@nestjs/websockets` | - |
| Storage (si besoin) | S3 ou driver local, derriere une **interface** | - |
| Email / SMS / Push (si besoin) | Derriere une **interface**, jamais appele en dur | - |

⚠️ **La version de PostgreSQL n'est pas un detail.** En 14, `NULLS NOT DISTINCT` n'existe pas : tout index unique tolerant au NULL doit s'ecrire en **index partiel SQL brut**. Verifier la version de la cible AVANT d'ecrire le premier `@@unique`.

### 2.3 Architecture patterns

| Cote | Pattern |
|------|---------|
| Frontend | **Feature-first** : `src/features/<domaine>/{api, components, hooks, schemas}/`. **Zero import inter-features** — le partage remonte dans `src/components/<prefixe>-*`. |
| Backend | **Module NestJS par domaine** : controller = **routage pur**, service **stateless** (tout l'etat en base), DTO `class-validator` **obligatoire par endpoint**. |
| Inter-modules | **Contrats transactionnels** (`common/contracts/`) : interfaces exposant uniquement des methodes `...InTx(tx, …)`, injectees **par jeton**, jamais par classe concrete. Voir §4.4. |
| Global | Contrat REST `/api/v1/*`, enveloppe uniforme `{ data, message, statusCode }` (TransformInterceptor). |

---

## 3. Structure de repertoires de reference

### 3.1 Frontend (`frontend/`)

```
frontend/
├── .env.local / .env.example
├── next.config.ts · tsconfig.json · package.json
├── playwright.config.ts                 # E2E — testDir: "./tests/e2e" (voir §7.4)
├── playwright.unit.config.ts            # Unitaires — SANS webServer
│
├── public/                              # favicon, logo, icones, manifest
│
├── tests/
│   ├── unit/                            # Tests purs (schemas, utils, parite i18n)
│   ├── e2e/                             # Parcours de bout en bout
│   ├── helpers/                         # auth, db, ui (drainToasts, assertNoHorizontalScroll)
│   └── global-setup.ts                  # Purge e2e — imports STATIQUES uniquement
│
└── src/
    ├── i18n/
    │   ├── config.ts                    # Locales, defaut, type Locale
    │   ├── get-messages.ts              # REGISTRE EXPLICITE des namespaces (§4.6)
    │   ├── negotiate-locale.ts          # Negociation serveur, cookie-first
    │   ├── request.ts                   # getRequestConfig (timeZone produit CONSTANT)
    │   └── messages/{fr,en}/<namespace>.json
    │
    ├── app/                             # ROUTAGE PUR — aucune logique metier
    │   ├── layout.tsx · not-found.tsx · error.tsx
    │   ├── (auth)/                      # connexion, inscription, reinitialisation…
    │   ├── (app)/                       # apres authentification
    │   │   ├── layout.tsx               # Shell : h-svh overflow-hidden, seul <main> scrolle
    │   │   └── <domaine>/page.tsx
    │   └── (admin)/                     # si back-office distinct
    │
    ├── config/
    │   ├── site.ts                      # SOURCE UNIQUE du nom produit (§4.7)
    │   ├── navigation.ts                # Gating FAIL-CLOSED par role ET capacite
    │   ├── api.ts                       # API_ENDPOINTS — registre unique des URL
    │   └── constants.ts                 # dont APP_TIME_ZONE
    │
    ├── lib/
    │   ├── api-client.ts                # Instance Axios + interceptors
    │   ├── api-error.ts                 # Code court -> message traduit
    │   ├── translate-field-error.ts     # Whitelist FERMEE de codes (§4.6)
    │   └── utils.ts                     # cn()
    │
    ├── types/                           # Miroir des types backend, DUPLIQUES
    ├── stores/                          # Zustand — etat CLIENT uniquement
    │
    ├── features/<domaine>/
    │   ├── api/                         # Fonctions pures, une par geste (§4.3)
    │   ├── components/ · hooks/ · schemas/ · types.ts
    │
    └── components/
        ├── ui/                          # shadcn genere — ne pas editer sauf primitif casse
        ├── <prefixe>-*.tsx              # Partages : stateless, libelles EN PROPS
        └── providers/
```

### 3.2 Backend (`backend/`)

```
backend/
├── .env / .env.example
├── prisma.config.ts                     # Datasource + driver adapter (PRISMA 7)
├── nest-cli.json · tsconfig.json · tsconfig.build.json
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/                      # TOUJOURS --create-only puis edition (§4.8)
│   ├── seed.ts                          # Provisionnement minimal
│   └── seed-dev.ts                      # Jeu de demonstration, MARQUE (§4.10)
│
├── scripts/
│   ├── check-invariants.sh              # Greps de porte versionnes (§7.5)
│   └── <smoke>.ts                       # Appels reels a un tiers, HORS suites
│
├── src/
│   ├── main.ts                          # CORS (dont exposedHeaders), ValidationPipe, Swagger
│   ├── app.module.ts
│   │
│   ├── config/                          # Config type-safe par domaine
│   │
│   ├── common/
│   │   ├── constants/audit-actions.const.ts   # CATALOGUE FERME (§4.5)
│   │   ├── contracts/                   # Interfaces ...InTx + jetons (§4.4)
│   │   ├── decorators/                  # current-user, roles, public, audit-log, scope
│   │   ├── guards/ · interceptors/ · filters/ · pipes/
│   │   └── utils/                       # civil-date, crypto, hash
│   │
│   └── modules/
│       ├── prisma/                      # PrismaService global
│       ├── auth/ · users/ · team/
│       ├── access/                      # LE constructeur de predicat unique (§4.2)
│       ├── audit/                       # Journal append-only (§4.5)
│       ├── <domaine>/                   # {controller, service, dto/, crons/, *.util.ts}
│       ├── notifications/               # Catalogue ferme + regroupement (§4.9)
│       ├── search/ · storage/ · settings/
│
└── test/
    ├── support/{harness,purge,fixtures}.ts
    ├── <domaine>.e2e-spec.ts            # Supertest sur base REELLE
    └── jest-e2e.json
```
---

## 4. Doctrines — les regles qui ont un motif

> Chaque regle ci-dessous est suivie du **defaut qu'elle previent**. Une regle dont on a oublie le motif est une regle qu'on « harmonise » un jour, en cassant ce qu'elle protegeait. Reprendre les motifs dans les commentaires du code genere.

### 4.1 Le refus indistinct — 404, jamais 403

Sur tout perimetre ou l'**existence d'un objet est elle-meme une information** (dossier, patient, commande d'un autre client), un objet hors perimetre repond **404**, exactement comme un objet inexistant.

**Ce que previent la regle** : un 403 est un oracle d'existence. Repondre « interdit » sur un identifiant et « introuvable » sur un autre permet d'enumerer ce qui existe sans y avoir droit. Les references etant souvent sequentielles, cela cartographie le volume d'activite.

**Corollaires, tous obligatoires** :
- Un code d'erreur **unique** couvre « inexistant », « autre organisation » et « non habilite ». Trois codes distincts reintroduisent l'oracle.
- Aucun message « N elements masques » : il reconstitue par difference ce que le cloisonnement retire.
- Un objet lie mais non accessible s'affiche **sans son identifiant** — un UUID est un oracle aussi sur qu'un nom.
- **Exception legitime** : quand l'utilisateur interroge **sa propre configuration** depuis un ecran visible, repondre 404 l'empecherait de comprendre qu'il doit agir. La un **403 est correct**. Documenter l'exception a l'endroit ou elle est prise.
- Un 403 pour **capacite de role** (« reserve a l'administrateur ») est licite s'il est atteint **apres** le controle de perimetre : il ne revele alors l'existence de rien.

### 4.2 Le cloisonnement s'ecrit DANS le `where`

**Un seul constructeur de predicat** dans tout le produit (`modules/access/`), plus son jumeau SQL si des requetes brutes existent. Il est compose dans la clause `where`, jamais applique apres coup.

**Ce que previent la regle** : un `count()` non cloisonne suivi d'un filtre est un **bug de securite**, pas une inefficacite. « 47 resultats » puis 3 affiches annonce qu'il existe 44 objets caches — et les deux chiffres sont individuellement justes, donc rien ne se declenche.

**S'applique a** : listes, **compteurs**, **totaux**, **facettes**, agregats, KPI, suggestions d'autocompletion et **exports**. Total, facettes et page doivent sortir de la **meme interrogation**, au **meme instantane transactionnel**, avec un **seul `now` injecte** — evalues a deux instants, ils divergent au passage d'une expiration de droit.

**Trois predicats separes divergeront** au premier ajustement, et c'est celui qu'on oublie de corriger qui laisse fuir. Si plusieurs regimes de portee coexistent (par objet, par permission fonctionnelle), les rendre en **une expression** parametree par le type d'objet.

### 4.3 Deux regimes d'ecriture : corriger n'est pas requalifier

Distinguer, jusque **dans l'URL** :
- **CORRECTION TRACEE** (`PATCH /objets/:id`) — « l'outil s'est trompe ». Motif obligatoire, journal avant/apres, **aucun evenement metier emis**.
- **GESTE METIER NOMME** (`POST /objets/:id/<geste>`) — un **fait** a eu lieu ; il **emet son evenement**, auquel des automatismes peuvent etre abonnes.

**Ce que previent la regle** : un `PATCH` fourre-tout acceptant un champ metier fait **disparaitre le fait** — donc l'automatisme abonne — sans erreur et sans log. Cote client, une facade `updateX(patch)` unique retablit exactement ce que le decoupage serveur s'interdit : **une fonction par geste** dans la couche API.

Cote interface : **boutons distincts**, panneaux distincts, et le panneau de correction **n'expose jamais** les champs metier. Un formulaire unique ferait requalifier a qui voulait corriger une coquille.

### 4.4 Contrats transactionnels — briser les cycles sans `forwardRef`

Quand deux modules se dependent mutuellement (A cree un objet de B dans SA transaction, B cree un objet de A dans la sienne), **ne pas** utiliser `forwardRef` ni un bus d'evenements asynchrone : declarer dans `common/contracts/` des **interfaces n'exposant que des methodes `...InTx(tx, …)`**, plus un jeton d'injection.

**Ce que previent la regle** : un bus asynchrone **rompt la transaction** — l'objet second peut ne jamais naitre alors que le premier est commite. `forwardRef` masque un couplage bidirectionnel qui finira par produire un cycle de resolution au demarrage.

**Regles d'application** :
- Le module **implemente** son contrat et le **fournit par jeton**, en `useExisting` — **jamais `useClass`** : une seconde instance aurait son propre etat et **deux chemins d'ecriture** pour le meme objet.
- Le consommateur injecte le **jeton**, jamais la classe.
- Un jeton dont l'implementation arrive plus tard s'injecte en **`@Optional()`**, et l'absence est **journalisee**, jamais ignoree — sinon le geste s'accomplit silencieusement sans son effet.
- Si un module doit emettre un fait appartenant a un autre domaine sans l'importer, extraire une **fonction pure** partagee plutot que de cabler la dependance de module.

### 4.5 Le journal est append-only, et son vocabulaire est ferme

- **Catalogue ferme** des actions (`const … as const` → type union). Ecrire une action hors catalogue **ne compile pas** : c'est la garde fail-closed du journal.
- Chaque code a son **miroir i18n FR + EN livre dans le meme commit**, sinon l'ecran affiche un code brut.
- Immuabilite garantie **en base** : trigger PL/pgSQL + `REVOKE UPDATE, DELETE` sur le role applicatif + test de garde. Une discipline de service ne suffit pas.
- Les mutations ecrivent **dans leur transaction** ; seules les **lectures** sont en fire-and-forget, et coalescees (ouvrir un journal et faire defiler dix pages doit produire **une** ligne, pas dix — sinon le journal s'auto-alimente et noie les actions reelles).
- Une correction s'ecrit par une **ligne compensatoire** qui laisse la premiere visible. **On ne compense jamais une compensation.**
- Deux roles PostgreSQL : un role applicatif **bride** et un role de migration.

⚠️ **Un vocabulaire ferme doit etre EMIS.** Une valeur ajoutee a un enum de faits sans qu'aucun geste ne la produise cree une **panne muette** : l'utilisateur configure un automatisme dessus et n'obtient rien, sans erreur ni log. **Verifier par un test qu'un automatisme abonne au fait produit reellement son effet** — compter les evenements ne suffit pas.

### 4.6 i18n — trois pieges qui ne se voient qu'en `npm run dev`

1. **Aucun point dans une cle plate.** next-intl 4 reserve le point au **nesting** : `"a.b": "…"` est **rejete a l'initialisation** (`INVALID_KEY`). Cette validation ne s'execute **qu'en `next dev`** — ni le build de production, ni Playwright ne la voient, et elle casse **toutes** les pages en developpement. Tout dictionnaire code → libelle indexe par un code pointe est stocke **neste** ; la lecture `t('a.b')` resout via le nesting sans changer l'appelant.
2. **Registre explicite des namespaces** dans `get-messages.ts`. Un namespace absent produit un `MISSING_MESSAGE` **invisible au build**. Ecrire un **test mecanique** qui balaie les sources, releve chaque `useTranslations('<ns>')` et verifie la declaration.
3. **Codes courts pour les erreurs de formulaire.** Les schemas Zod n'emettent jamais un message par defaut : ils emettent un **code stable** (`required`, `tooLong`, `mismatch`), resolu par un helper sur **whitelist fermee**. Ajouter un code = FR + EN + whitelist, dans le meme commit.

**Porte obligatoire** : une passe `npm run dev` **FR et EN sur toutes les routes** avant livraison, relevant `INVALID_KEY` / `MISSING_MESSAGE` / `IntlError`. Aucune autre porte ne les voit.

Ajouter un test de **parite FR/EN** et un test d'**absence de cle pointee** sur tous les dictionnaires.

### 4.7 Nom du produit et theme — sources uniques

- **Nom du produit** : jamais ecrit en dur. Source unique cote front (`config/site.ts`, alimente par une variable d'environnement avec defaut), variable d'environnement cote back. Dans les dictionnaires, utiliser un **jeton litteral** substitue au chargement des messages **cote serveur ET client** — pas un placeholder ICU, qui obligerait chaque appelant a passer la valeur.
- **Tokens de theme uniquement** : zero couleur en dur, zero HEX inline, et **zero classe Tailwind composee dynamiquement** — `bg-[var(--x-${n})]` n'est **jamais compile** ; utiliser un `Record` **statique** de classes completes, ou un `style` inline.
- Si une charte par organisation est prevue, la **rampe de criticite** (couleurs d'alerte) est declaree **hors** des tokens de marque : une alerte doit rester lisible meme si l'organisation a choisi la meme teinte partout. Le controle de contraste s'evalue **pendant la saisie**, pas apres enregistrement.

### 4.8 Migrations — Prisma ne genere pas la moitie de ce dont on a besoin

**`prisma migrate dev --create-only` puis edition manuelle, TOUJOURS.** Prisma ne genere ni index partiels, ni colonnes generees, ni triggers, ni `REVOKE`, ni partitionnement, ni contraintes `CHECK` — et un `migrate dev` non controle **veut supprimer** les colonnes qu'il ne comprend pas (`tsvector`, par exemple).

**Trois pieges verifies** :
- **55P04** : une valeur d'enum ne peut pas etre **utilisee** dans la transaction qui l'ajoute → toute evolution d'enum se livre en **deux migrations**, la premiere ne contenant **que** les `ALTER TYPE`. Si l'ordre de l'enum compte (c'est son ordre de tri), inserer avec `AFTER '<valeur PREEXISTANTE>'`, en ecrivant les ajouts **en ordre inverse** pour ne jamais viser un label cree dans la meme transaction.
- **Horodatage de migration inferieur au precedent.** Prisma nomme d'apres l'heure locale et applique par **ordre lexicographique du nom de dossier**. Des qu'une migration a ete renommee a la main, la suivante peut recevoir un horodatage **inferieur** et s'appliquer **avant** celle dont elle depend — l'echec est un message de contrainte incomprehensible, tres loin de la cause. **Reflexe** : apres chaque `--create-only`, comparer le nom produit au dernier dossier de `migrations/` et renommer si necessaire (le nom, jamais le contenu).
- **`ADD COLUMN … NOT NULL` sec** echoue sur toute base deja peuplee. Livrer en trois pas : colonne nullable → `UPDATE` de reprise → `SET NOT NULL`. Un `DEFAULT ''` laisserait des lignes vides et illisibles.

**Contraintes en base plutot que gardes applicatives seules** : une regle qui vit uniquement dans un service sera contournee par un script d'import ou un correctif SQL. Doubler les invariants qui comptent par un `CHECK` ou un index partiel — la base ne depend d'aucune discipline.

### 4.9 Concurrence, compteurs et taches planifiees

**Anti-course** : jamais de read-then-write. Un `updateMany` **conditionne a l'etat observe** (0 ligne modifiee → 409). Quand la sequence elle-meme doit etre protegee (lire → compter → ecrire), ajouter un **verrou consultatif** en tete de transaction : le `updateMany` protege la colonne, le verrou protege la sequence.

⚠️ Le verrou consultatif se prend avec **`$executeRaw`**, jamais `$queryRaw` — ce dernier echoue a deserialiser un `void` et fait remonter une erreur de base sur **toutes** les mutations.

**Ordre canonique de verrouillage**, declare une fois et respecte partout. Un ordre different entre deux chemins d'ecriture produit un interblocage **qui ne se manifeste qu'en production, sous charge**. Quand plusieurs objets du meme type sont verrouilles, les **trier** (par identifiant) avant de prendre les verrous.

**Compteurs denormalises** : mis a jour **dans la meme transaction** que leur source canonique, explicitement designee. Preferer un **recalcul par agregat** a un `{ increment }` : l'increment suffit au cas nominal mais **derive au premier chemin oublie** (compensation, correction, import), et la derive est silencieuse.

**Crons** — chacun :
- `if (process.env.CRONS_DISABLED === '1') return;` en **premiere ligne** ;
- expression **par variable d'environnement**, jamais en dur ;
- lot **borne**, `try/catch` **par item** (un item en echec n'emporte pas le lot) ;
- **cle de deduplication reservee AVANT tout effet de bord** — un cron s'execute sur chaque instance ;
- **declare comme provider** : un cron non declare n'est **jamais enregistre**, sans aucune erreur au build, au boot ni en test ;
- predicat de selection qui **garantit la progression** : selectionner « les N premiers » sans exclure les deja traites reboucle sur les memes.

⚠️ Dans une transaction PostgreSQL, une **violation de contrainte avorte la transaction entiere** : un `try/catch` autour d'un `create` par item n'attrape rien d'utile. Utiliser `createMany({ skipDuplicates: true })` — une seule instruction.

**Notifications** : catalogue **ferme**, types critiques **non desactivables** (fail-closed), **regroupement quotidien** des types qui surviennent en rafale. Laisser le choix **entre deux types** plutot qu'entre le bruit et le filet : si couper les rappels ordinaires imposait de couper toute la famille, l'utilisateur couperait aussi l'urgence.

### 4.10 Ne jamais inventer une valeur

Quand une donnee de reference conditionne une decision a consequence (un delai, un seuil, un taux, une posologie), **la livrer vide** plutot que devinee, et rendre l'absence **visible** :
- un etat dedie (« en attente ») plutot qu'une absence silencieuse ou une valeur par defaut ;
- un **motif d'absence** distinguant les causes, car la correction n'appartient pas a la meme personne ;
- un **bandeau permanent non refermable** tant que la configuration est incomplete.

**Non-retroactivite** : toute instance derivee d'une regle porte le **snapshot** de la regle **et de sa version**. Editer la regle ne recalcule **jamais** les instances existantes ; le recalcul est **explicite**, objet par objet, avec **apercu avant application**. Une reforme **ajoute une version** (append-only) ; une duree ne se modifie jamais.

**Jeu de demonstration** : si un seed pose des valeurs non verifiees, les **marquer** (`provenance: DEMO_UNVERIFIED`), afficher un bandeau non refermable partout ou elles s'affichent, et **garder les exports et les envois externes**. Le provisionnement d'une organisation reelle reste vide.

### 4.11 Montants et dates

- **Montants** : `Decimal(18,2)` en **unites MAJEURES**. Aucune division par 100, aucune colonne `...Minor`. **Chaines decimales de bout en bout** — jamais un `number` intermediaire : un flottant arrondit `1000.10` et, cumule, cesse d'egaler la somme qu'il solde. Conversion en unites mineures **uniquement** dans l'adapter du prestataire, au contact de son API.
- **Code ISO exact** de la devise cible, et **refuser explicitement** le code voisin confondable plutot que de le laisser absent : un rejet muet « code inconnu » n'apprend rien.
- **Decimales saisissables par devise** : refuser plutot qu'arrondir. Arrondir fait diverger le montant saisi du montant stocke, ecart invisible jusqu'au rapprochement.
- **Aucune ecriture financiere n'est supprimable** : annulation par **compensation motivee** de signe oppose. Un numero de piece n'est alloue qu'a **l'emission** — un brouillon abandonne ne troue pas la sequence.
- **Fuseau produit CONSTANT**, declare une fois (`APP_TIME_ZONE`), sans store ni detection navigateur. Dates civiles en `YYYY-MM-DD` parsees explicitement — **jamais `new Date("YYYY-MM-DD")`**, interprete UTC et decale d'un jour. Sur une colonne `@db.Date`, ecrire **midi UTC** : minuit bascule d'un jour au fuseau cible.
- Un decompte affiche (« J-3 ») est calcule **serveur**. Cote client, `staleTime` court + invalidation **a la bascule de jour civil du fuseau produit** : un onglet laisse ouvert la nuit afficherait une valeur perimee sur l'objet meme dont le produit tire sa valeur.

### 4.12 Secrets

Une cle d'API tierce vit **exclusivement en variable d'environnement**. **Jamais en base** — la table de reglages correspondante n'a volontairement **aucune colonne** pour la recevoir, et le motif est ecrit dans le schema pour qu'aucune evolution n'en glisse une. Jamais en dur, jamais renvoyee par une API, jamais dans une variable `NEXT_PUBLIC_*`.

**Grep de porte** : zero occurrence du prefixe de cle dans le depot. Si un test doit citer un prefixe, le **recomposer** plutot qu'exempter le fichier — une exemption couvre le jour ou la chaine trouvee est une vraie cle.

Verifier l'absence de colonne de secret **sur `information_schema`**, pas par relecture : un grep ne voit pas une colonne vide ajoutee « pour plus tard ».
---

## 5. Conventions frontend

- **Pages App Router = routage pur.** Aucune logique metier, aucun JSX complexe : elles deleguent a `features/`.
- **Zero import inter-features.** Le partage remonte dans `components/<prefixe>-*`, **stateless**, recevant ses **libelles deja traduits en props** — un composant transverse ne connait aucun namespace, sinon chaque feature devrait aligner ses cles sur les siennes.
- **Chaine imposee** : composant → hook → `features/<x>/api/` → `apiClient` → `API_ENDPOINTS`. Aucune requete directe dans un composant.
- **Zustand = etat CLIENT uniquement.** Les donnees serveur vivent dans TanStack Query.
- **Mobile-first 375 px** : styles de base pour le mobile puis `md:`/`lg:`. Jamais de largeur fixe en px ; multi-colonnes demarrant en **1 colonne** ; toute `<table>` sous `overflow-x-auto`. **Verification visuelle a 375 px avant livraison**, sur les ecrans **porteurs de donnees** — un ecran vide ne deborde jamais.
- **Shell** : `h-svh overflow-hidden`, **seule la zone `<main>` scrolle**, et elle porte `relative` — un `absolute` sans ancetre positionne echappe au scroll et etend le body.
- **Un seul rendu DOM** pour desktop et mobile. Un `hidden md:block` duplique les `data-testid` et fait echouer tout selecteur strict par ambiguite, sans que rien ne soit casse a l'ecran.
- **Menu fail-closed** : la navigation se construit du role **reel**. Tant qu'il est inconnu, elle rend une **liste vide** — jamais un menu complet « en attendant ». Gating aussi par **capacite** quand une fonction peut etre desactivee : si le backend rend 404 sur ses routes, l'entree ne doit pas exister.
- **Bandeaux permanents contre bulles d'aide** : une information a valeur juridique ou reglementaire (decharge, avertissement, provenance non verifiee) est un **bandeau non refermable**. Une information qu'on doit pouvoir **prouver avoir presentee** ne peut pas dependre d'un clic. Les bulles d'aide expliquent une notion **la ou on la rencontre**, jamais dans un glossaire final.
- **Un geste refuse rend un message comprehensible**, jamais un code brut.
- **Bouton desarme plutot qu'echouant** : offrir un bouton qui repondra toujours en erreur est une promesse qu'on ne tient pas. Et un geste devenu impossible **disparait** plutot que d'etre grise.

---

## 6. Pieges deja payes — a ne pas repayer

| # | Piege | Symptome | Parade |
|---|---|---|---|
| 1 | **`tsbuildinfo` + `deleteOutDir`** | `MODULE_NOT_FOUND` au boot apres suppression de `dist/` : le build incremental ne re-emet rien | Purger `dist/` **et** `*.tsbuildinfo` — script `build:clean` dedie, utilise avant toute porte |
| 2 | **`prisma generate` non rejoue** | `TS2339` sur des valeurs d'enum neuves | `generate` **explicite** apres chaque `migrate` |
| 3 | **PostgreSQL 14, pas 15+** | `NULLS NOT DISTINCT` inconnu | Index uniques tolerants au NULL en **index partiels SQL brut** |
| 4 | **Primitif shadcn casse a la generation** | Onglets poses a cote du panneau, clics intercepts, **aucune erreur console** | Verifier chaque primitif genere ; corriger dans `components/ui/` en documentant la raison |
| 5 | **`<Select>` base-ui sans prop `items`** | Le declencheur affiche la **cle brute** — les `Item` vivent dans un Portal demonte a la fermeture | Passer systematiquement `items` (registre valeur → libelle) |
| 6 | **`shadcn add` bumpe une dependance epinglee** | Regression silencieuse d'une librairie de dates ou de formulaire | Verifier `package.json` apres chaque `add` |
| 7 | **Fixture `page` Playwright recreee par test** | La session disparait entre deux tests | Suite a session longue : **une page unique en `beforeAll`** |
| 8 | **`timezoneId` Playwright different du fuseau applicatif** | « resolved to 2 elements » — la bascule de fuseau percute l'hydratation streamee | Fixer `timezoneId` **egal** a `APP_TIME_ZONE` |
| 9 | **Toasts au-dessus des panneaux** | Un clic « ne fait rien » | `drainToasts()` **avant** toute re-interaction |
| 10 | **`oklch()` normalise en `lab()` par Chromium** | Impossible d'asserter la valeur brute d'un token | Mesurer la couleur **resolue** sur une sonde DOM |
| 11 | **Timeout client plus court que le timeout serveur** | Le client abandonne un traitement qui aboutit | Client **plus patient** que le serveur, toujours |
| 12 | **`Content-Disposition` absent d'`exposedHeaders`** | Un `fetch` cross-origin ne peut pas lire le nom d'un export | L'ajouter au CORS |
| 13 | **`waitUntil: "networkidle"` sur une app qui sonde** | Timeout | `domcontentloaded` + attente explicite. *(`networkidle` reste correct sur une page `file://`.)* |
| 14 | **`testDir` Playwright englobant les unitaires** | Les tests unitaires rejoues derriere un build de 5 min, chiffre de porte **ininterpretable** | `testDir: "./tests/e2e"` + configuration unitaire dediee **sans `webServer`** |
| 15 | **Processus d'arriere-plan tues vers 10 min** (selon l'outillage) | Une porte longue s'interrompt sans resultat | Backend **detache** pour tout run de porte ; **decouper** la porte (build+unitaires, puis integration) |
| 16 | **Ecriture de fichier en mode texte sous Windows** | Retours chariot doubles → diffs illisibles, tests de parite en echec sur des valeurs « identiques » | Ecrire en `newline=''` (ou binaire) tout fichier destine au depot |
| 17 | **Build/test lance pendant qu'un agent ecrit** | Erreurs de compilation prises pour des defauts | **Ne jamais** builder pendant une ecriture concurrente — y compris la sienne |
| 18 | **Artefacts `.next/dev/types/`** | `tsc` rouge sur du code genere apres une passe `next dev` | Purger `.next` avant un typecheck de porte |
| 19 | **Cle etrangere `Restrict` oubliee dans la purge de test** | **Toutes** les suites rougissent, y compris celles qui ignorent le module fautif | Etendre la purge a **chaque** nouvelle table, enfants avant parents |
| 20 | **Purge de test qui ne converge pas** | Organisations fantomes accumulees, faisant echouer plus tard la purge d'une suite **innocente** | Ramassage des orphelins ; `SAVEPOINT` par suppression ; re-verification apres coup |

---

## 7. Doctrine de test — la partie qui trouve les vrais defauts

### 7.1 La regle qui produit les trouvailles

**La suite de test d'un module est ecrite par un intervenant DISTINCT de celui qui a ecrit le code.**

Un auteur qui teste son propre code teste **ce qu'il a voulu ecrire**, pas ce qu'il a ecrit. Sur le produit d'origine, cette seule separation a revele : des codes d'erreur declares et **jamais leves**, un service de garde **non exporte** donc inoperant, un refus trompeur sur course perdue, des registres de sondes **vides** rendant des gardes inertes, et un ecran de configuration qui aurait ete servi **vide**. Aucun n'etait visible a la relecture — tous se presentaient comme du code raisonnable.

### 7.2 Assertion negative = assertion positive dans le MEME test

Toute verification de cloisonnement (« l'autre organisation obtient 404 ») est **doublee d'un controle positif** dans le meme test. Sans lui, une route cassee repondant 404 a tout le monde **se lit comme un cloisonnement qui fonctionne**.

Meme regle pour un garde-fou : verifier qu'il **refuse** ce qu'il doit refuser **et** qu'il **laisse passer** ce qui est legitime. Une garde qui refuse tout passe le premier test tout en rendant la fonction inutilisable.

### 7.3 Ce qu'une assertion doit viser

- **L'etat en base**, pas la reponse HTTP, quand la question est « qu'est-ce qui a ete ecrit ».
- **La forme du JSON** (`not.toHaveProperty`), pas l'affichage, quand la question est « ce champ est-il transmis ». Un champ envoye puis masque cote client est un champ **divulgue**.
- **Le compteur d'appels d'un simulacre**, pas le code HTTP, quand la question est « une donnee est-elle sortie ». Un 404 prouve qu'une route a refuse ; il ne prouve pas qu'aucun octet n'est parti.
- **Le contenu recu par le simulacre**, champ par champ, quand la question est « qu'est-ce qui est transmis ». Semer des donnees-pieges et verifier qu'aucune ne sort — **et** que les champs autorises sortent bien, sinon un contexte vide ferait passer le test.
- **L'echec injecte APRES des ecritures reelles**, quand la question est « la transaction defait-elle tout ». Injecter l'echec en tete ne prouve rien.
- **Un automatisme reellement configure**, quand la question est « ce fait declenche-t-il quelque chose ». Compter les evenements ne prouve pas qu'ils sont ecoutes.
- **Une concurrence reelle** (`Promise.all`), quand la question est « deux gestes simultanes ». Lances sequentiellement, ils ne testent rien.

### 7.4 Les trois portes, et ce que chacune voit seule

| Porte | Ce qu'elle seule detecte |
|---|---|
| **Unitaires (Jest / runner rapide)** | Logique pure : calculs, cascades, machines d'etat, parite i18n |
| **Integration sur base REELLE (Supertest)** | Resolution d'injection au demarrage, contraintes de base, transactions, courses, cloisonnement effectif |
| **Bout en bout live (Playwright, build de PRODUCTION)** | Que l'utilisateur peut reellement accomplir le parcours |
| **Passe `npm run dev` FR+EN sur toutes les routes** | Les erreurs i18n — **aucune autre porte ne les voit** |

Ajouter selon le produit : porte de **performance** sur volumetrie realiste (injecter les donnees couteuses **directement en base**, jamais via le pipeline lent — la porte mesure la fonction, pas le pipeline), et **smoke reel** d'un tiers payant, **archive et tenu HORS des suites** (un test dependant d'un service tiers rougit un jour sans raison, et apprend a ignorer un rouge).

**Garde-fou de couverture** : un test qui **enumere les routes montees** et exige le decorateur de cloisonnement sur chacune. Si un contributeur ajoute une route sans lui, ce test rougit **en la nommant**. Verifier une fois qu'il mord reellement, en retirant le decorateur volontairement.

### 7.5 Portes mecaniques

Un script versionne (`scripts/check-invariants.sh`) verifiant : zero `any`, zero reference a un produit voisin, zero couleur en dur, zero HEX inline, zero classe composee dynamiquement, zero cle d'API, zero import inter-features, zero logique metier dans `app/`, identifiants toujours versionnes, et zero mention d'IA dans les messages de commit. **Exclure le code genere et les lignes de commentaire** — un grep qui compte la regle elle-meme crie au loup.

### 7.6 Un rouge n'est jamais un « flake » sur un seul run

Rejouer **en isolation**, puis `git stash` sur arbre vierge pour etablir si le defaut est pre-existant. Diagnostiquer explicitement : **defaut du produit** (corriger le produit) ou **hypothese fausse du test** (corriger le test) — et **dire lequel**. Citer les chiffres reels (`N passed / M failed`, duree).

Un temps mesure aberrant (plusieurs heures) n'est pas un temps de test : c'est une machine en veille.

---

## 8. Securite baseline

| Aspect | Implementation |
|--------|---------------|
| Auth | JWT access court + refresh avec **rotation** et detection de rejeu |
| Passwords | bcrypt cout >= 12. **Politique validee cote SERVEUR uniquement** — une regex cliente serait une seconde source de verite, muette le jour ou l'organisation durcit sa politique |
| Refus indistincts | Identifiant inconnu et mot de passe errone → **meme message**. Reinitialisation → **meme confirmation** que le compte existe ou non. Jeton d'invitation inexistant, expire, annule ou consomme → **meme 404** |
| Rate limiting | Global + surcharge sur login, reinitialisation, demandes d'acces, exports |
| Validation | `ValidationPipe` globale `whitelist` + `forbidNonWhitelisted`. **L'absence d'un champ dans le DTO EST la garde** — preferer un type qui ne l'accepte pas a une condition d'execution qu'on peut deplacer |
| Row-level | Predicat **dans le `where`**, depuis l'acteur resolu **en base**. **Jamais** de confiance dans un identifiant du body/query : toute FK recue est **re-scopee** avant usage |
| Transport / CORS | TLS obligatoire, HSTS. Whitelist explicite d'origines, `exposedHeaders` pour les telechargements |
| Secrets | Voir §4.12. Le frontend ne recoit que des cles publiables |
| Journalisation | L'intercepteur de log ecrit `methode url statut duree` et **rien d'autre**. Tout secret transite dans le **corps**, jamais dans l'URL |
| Documents sensibles | Chiffrement par enveloppe (cle par document + version de cle). **Aucun lien de telechargement direct** : l'acces passe par le controle de droits, et chaque lecture est tracee |
| Webhooks | Verification de signature + idempotence par reference unique du fournisseur |
| OWASP | Injection (requetes parametrees, **jamais d'interpolation** en SQL brut), Broken Auth, XSS, CSRF, exposition de donnees |

---

## 9. Dependances — listes de reference

Reprendre les listes de la version 1.0 en ajustant : `next` **^16**, `react` **^19.2**, `@playwright/test` en devDependency des **deux** cotes, `prettier` cote frontend. Ajouter selon le domaine seulement — un adapter de paiement, d'email, de SMS ou de stockage **derriere une interface**, jamais appele en dur depuis un service metier.

---

## 10. Commandes dev standardisees

```bash
# Backend (API)
cd backend && npm install && cp .env.example .env
npm run prisma:generate && npm run prisma:migrate
npm run start:dev
npm run build:clean && node dist/main    # AVANT toute porte
npm run test                             # unitaires
npm run test:e2e                         # integration sur base REELLE
npm run seed:dev                         # jeu de demonstration MARQUE

# Frontend
cd frontend && npm install && cp .env.example .env.local
npm run dev                              # passe FR + EN obligatoire avant livraison
npm run build && npm run lint
npm run test:unit                        # configuration rapide, SANS webServer
npm run test:e2e                         # Playwright, backend demarre et CRONS_DISABLED=1
```

---

## 11. Ordre d'implementation recommande

| Phase | Contenu |
|-------|---------|
| 1 | **Socle** : config type-safe, `common/` (guards, interceptors, filtres), PrismaService, tokens de theme, i18n FR+EN **avec son registre**, shell et route groups |
| 2 | **Journal + cloisonnement AVANT tout metier** : catalogue d'actions ferme, immuabilite en base, **constructeur de predicat unique**, garde-fou de couverture des routes |
| 3 | **Auth** : inscription, connexion, refresh avec rotation, invitations, refus indistincts |
| 4 | **Roles et habilitations** : le modele d'autorisation, avant qu'un module metier ne le suppose |
| 5 | **Referentiels et reglages** — **avant** les modules qui les consomment. Un parametre economique ou reglementaire est livre en base **versionnee** avant sa premiere lecture |
| 6 | **Contrats transactionnels** (`common/contracts/`) — des que deux modules metier se dependent |
| 7..N | **Modules metier, un par un**, chacun avec **sa suite d'integration ecrite par un intervenant distinct**. Aucun module n'est declare termine sans elle |
| N+1 | **Recherche** (predicat unique, total et facettes dans la meme requete) |
| N+2 | **Frontend** : socle et composants partages, puis features metier |
| N+3 | **Portes finales** : bout en bout live, passe `npm run dev` FR+EN sur **toutes** les routes, verification 375 px, performance, smoke reel archive |

---

## 12. Commits

Format **Conventional Commits avec emoji** : `<emoji> <type>: <description>`. Types : `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`. Commits **atomiques**.

Le corps du commit dit **pourquoi**, pas quoi : le diff dit deja quoi. Un commit qui corrige un defaut trouve par une porte **nomme le defaut et sa consequence** — c'est ce qui rend l'historique utile trois ans plus tard.

⚠️ **Jamais de `Co-Authored-By`** ni aucune mention d'assistance IA dans un message de commit.

---

*Preset `nextjs-nestjs-prisma` v2.0 — a passer en 2e argument a `/generate-architecture`. Adapter uniquement les features metier a partir des user stories fournies en 1er argument. Les sections 4, 6 et 7 ne sont pas adaptables : elles encodent des defauts deja payes.*
