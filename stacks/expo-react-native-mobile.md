# STACK PRESET — Expo SDK 57 + React Native + TypeScript (mobile Android/iOS)

> **Instructions a `/generate-architecture`** : Si ce fichier est passe en argument, **utiliser les choix ci-dessous tels quels** et **sauter completement la Phase 2 (questionnaire interactif)**. Ne poser aucune question sur le framework, la navigation, le state management, le stockage local ou le style. N'adapter que **les features et modeles de donnees** a partir des user stories / specs fournies.
>
> **Une seule question reste a poser** : quels **modules optionnels** (§10) le projet retient. Ne pas les deviner — un module retenu a tort impose des contraintes couteuses et sans objet.

> **Version preset** : 1.0
> **Cible** : Applications mobiles metier, toutes verticales — livraison, commerce, sante, terrain, services. Le noyau (§1 a §9) vaut pour **toutes** ; les contraintes propres a une verticale vivent en §10, et **uniquement** si le module est retenu.
> **Origine** : Extrait d'un produit mobile hors-ligne a fort enjeu, generalise. Aucune reference au domaine d'origine dans le noyau.

> **Ce que ce preset apporte** : non pas *quoi* installer — une recherche le donne — mais *pourquoi* chaque convention existe et *quel defaut muet elle previent*. En mobile, la majorite des defauts couteux **ne produisent aucune erreur** : un style ignore en silence, une classe web sans effet, une donnee perdue entre deux ecritures, une tache de fond que le constructeur ne lance jamais. Les sections 5, 7 et 8 sont la valeur principale du document.

---

## 1. Metadata du preset

| Champ | Valeur |
|-------|--------|
| Nom stack | `expo-react-native-mobile` |
| Type d'app | Mobile native via Expo (development build), **jamais Expo Go** |
| Plateformes | Android en primaire. iOS **seulement si une porte iOS est financee** — sinon, le declarer hors perimetre plutot que le laisser implicite |
| Langue | Identifiants en anglais. Interface multilingue, langues livrees **simultanement** |
| Backend | **Optionnel** (module M2). Un depot separe, jamais de workspace partage : les types TS sont **dupliques volontairement** cote application |
| Prefixe projet | A choisir des le depart (ex. `fv-`, `dl-`, `sh-`). Il nomme les composants partages (`components/<prefixe>-*.tsx`), les tokens de theme (`--<prefixe>-*`), les cles de stockage et le domaine de test. **Jamais deux prefixes dans un depot** : un grep de porte rend zero occurrence du prefixe d'un produit voisin |

---

## 2. Tech stack fige

| Couche | Choix | Note |
|---|---|---|
| Runtime | **Expo SDK 57**, development build | `create-expo-app --template default@sdk-57` — **verifier le champ `expo` de `package.json` avant le premier commit** |
| Langage | TypeScript **strict**, zero `any` ni `as any` hors code genere | |
| Navigation | **expo-router** (routage par fichiers) | `src/app/` est **routes-only** |
| Style | **nativewind** + **tailwindcss@^3**, versions **a l'exact** | `withNativeWind(config, { inlineRem: 16 })` |
| Etat ephemere | **Zustand**, ecran uniquement (etape courante, repli ouvert, chargement) | Aucune donnee metier durable en memoire |
| Etat serveur | **A DEFINIR selon le module M1** : sans hors-ligne, TanStack Query convient ; avec hors-ligne, il est **proscrit** (§10 M1) | |
| Stockage local | **expo-sqlite**, depots types a la main, **pas d'ORM** | Migrations par `PRAGMA user_version` |
| Secrets locaux | **expo-secure-store** | Voir M8 pour l'accessibilite et la survie |
| Formulaires | react-hook-form + zod, erreurs par **codes courts stables** | Jamais une phrase en dur comme message |
| i18n | i18next + **eslint-plugin-i18next en mode `all`** | `keySeparator: false`, `nsSeparator: false` |
| Tests | jest-expo + @testing-library/react-native ; **expo-router/testing-library** en configuration **separee** | Totaux cites separement |
| Bout en bout | **Maestro**, sur un development build reellement construit et installe | C'est la porte |
| Node | **≥ 22.13**, fige par `.nvmrc` et `engines` | |

---

## 3. Structure de repertoires de reference

```
app/
  src/
    app/                    # ROUTES ONLY — aucun fichier utilitaire ici
      _layout.tsx
      index.tsx
      (tabs)/ …
    features/<domaine>/     # tout le metier
      components/
      hooks/
      repository/           # seul acces aux donnees locales
      schemas/
      stores/
    components/<prefixe>-*  # partage : sans etat, tokens uniquement,
                            # libelles traduits recus en proprietes
    db/
      open.ts               # MONOPOLE d'ouverture de base
      migrations/
    lib/
    config/site.ts          # nom du produit, jamais ecrit en dur
    i18n/
  assets/
  .maestro/
```

**Zero import inter-features.** Le partage remonte dans `components/<prefixe>-*`. La chaine imposee est : ecran → composant de feature → hook → `repository/` → `db/open.ts`. Un module de synchronisation, s'il existe, vit **a cote** de cette chaine, jamais dedans.

---

## 4. Les monopoles — la structure qui rend une regle greppable

Une regle qu'on peut enfreindre a trente endroits n'est pas une regle. Chaque preoccupation transverse a **un seul point de passage**, et un grep de porte rend zero occurrence ailleurs :

| Preoccupation | Monopole | Ce que le grep interdit ailleurs |
|---|---|---|
| Ouverture de base | `db/open.ts` | toute autre ouverture, tout `PRAGMA key` |
| Emission reseau | `sync/http.ts` ou `api/client.ts` | tout `fetch` / `axios` direct dans un composant |
| Nom du produit | `config/site.ts` | le nom ecrit en dur |
| Couleur | tokens de theme | toute valeur hexadecimale en ligne, toute couleur litterale |
| Regle metier a seuil | un service dedie | tout `if (x > <nombre>)` dans un ecran |

Poser l'indirection **des le premier jour**, pas le jour ou elle servira : son interet est de permettre un changement d'implementation sans toucher aux ecrans, et ce jour-la il est trop tard pour l'introduire.

---

## 5. Doctrines — les regles qui ont un motif

### 5.1 Expo Go est interdit, development build des le premier commit
Une bibliotheque native absente du binaire ne produit pas un avertissement : elle produit un **crash a l'execution**, que l'on cherche des jours durant dans le code metier. Boucle locale : `npx expo run:android`.

### 5.2 `src/app/` est routes-only, sans exception
Un fichier utilitaire pose la devient une **route atteignable par lien profond**. Personne ne le decouvre avant qu'un utilisateur y arrive.

### 5.3 Les couleurs ne cascadent pas
Une classe `text-*` posee sur une `<View>` est ignoree **silencieusement**. Tout texte passe par le composant `<prefixe>-text`. C'est la premiere chose a verifier quand un style « ne s'applique pas ».

### 5.4 Les defauts du web ne valent pas sur telephone
Points de rupture hors de la plage d'un telephone, base `rem` a 14, selecteur `.dark { }`, classes web-only : quatre pieges dont **aucun ne leve d'erreur**. Mise en page **a une colonne, sans largeur fixe en pixels** ; valeurs en dp posees depuis l'appareil de reference, jamais heritees.

### 5.5 La mise a l'echelle de police est active par defaut
Toute maquette est validee **a 200 %** de police systeme, sur appareil reel. **Aucune hauteur fixe sur un conteneur de texte.** Cibles tactiles **≥ 48 dp**, portees par les composants partages.

### 5.6 Le cache est efface par le systeme
Repertoire de **documents** pour tout ce qui doit survivre. **Aucune URI absolue persistee** — chemins relatifs uniquement, sans quoi rien ne resout apres une mise a jour.

### 5.7 Une permission est un changement de binaire
Un changement de permission **ne passe pas** par une mise a jour a distance : nouveau binaire, redistribution. Et un refus est un **etat terminal** cote systeme : la surface concernee est **absente**, jamais grisee — un bouton grise fait retenter indefiniment.

### 5.8 La tache de fond est un bonus, jamais une promesse
Les optimiseurs de batterie de certains constructeurs ne la lancent jamais. Ne **jamais** ecrire dans l'interface qu'une operation se fait automatiquement.

### 5.9 Zero texte en dur, y compris dans les proprietes
En React Native une grande part du texte vu par l'utilisateur vit dans des **props** (libelle d'accessibilite, texte d'invite), que la regle de lint par defaut ne controle pas. D'ou le mode `all`, obligatoire.

### 5.10 Ne jamais inventer une valeur
Aucun seuil, plafond, duree, effectif ou metrique n'entre dans le depot sans source citee. Ce qui manque s'ecrit **`A DEFINIR` + l'action qui le determinera**. Une valeur posee « provisoirement » n'est jamais retiree sans grep de porte.

### 5.11 Prebuild n'est pas une commande de routine
`npx expo prebuild --clean` dans **trois cas et trois seulement** : bibliotheque native ajoutee ou mise a jour, configuration d'application modifiee, montee de SDK. Depister **avant** installation avec `npx expo-doctor@latest`.

---

## 6. Conventions de code

- Fichiers en **`kebab-case.ts(x)`**, identifiants **en anglais**.
- **Erreurs par codes courts stables**, jamais des phrases ; le rendu les traduit.
- **Vocabulaires fermes** : une valeur ajoutee au code sans sa contrainte en base **doit** faire echouer l'ecriture.
- SQLite : `journal_mode = WAL`, `foreign_keys = ON`. **Pas de booleen** : `INTEGER NOT NULL CHECK (x IN (0,1))`. Horodatages en **millisecondes epoch UTC**, localises a l'affichage.
- Chemins **absolus** dans toute commande : `cd` ne persiste pas entre deux appels d'outil.
- Epinglages **a l'exact** pour tout ce qui touche le style et le natif — un `^` laisse entrer une majeure et casse la compilation sur une installation banale.

---

## 7. Pieges deja payes — symptome → cause → reflexe

**Socle et construction**
1. Le projet est en SDK N-3 alors qu'on visait N → `create-expo-app` sans `--template` → toujours `--template default@sdk-<N>`, verifie avant le premier commit.
2. L'application plante instantanement alors que le bundle compile → module natif absent du binaire → development build, jamais Expo Go ; ne pas chercher dans le code metier.
3. Une bibliotheque native installee n'est pas vue → le binaire est anterieur a la dependance → `prebuild --clean` puis `run:android`.
4. Une bibliotheque ne marche pas et on veut revenir a l'ancienne architecture → **impossible depuis le SDK 55**, l'option est ignoree → changer de bibliotheque, pas d'architecture.
5. `tsc` echoue en integration continue sur des types de routes introuvables → routes typees generees au demarrage du serveur de developpement, git-ignorees → les generer **avant** le typecheck dans le job.
6. Rendu ou memoisation inexplicables → le compilateur React est actif par defaut → **premier interrupteur a basculer** avant de suspecter le code.
7. Un fichier utilitaire dans `src/app` devient une route → routes-only → le deplacer, aucune exception.

**Style et interface**
8. Le mode sombre ne s'applique jamais → selecteur `.dark { }` copie du web → **`.dark:root`**.
9. Une classe `text-*` sur une `<View>` n'a aucun effet, **sans erreur** → les couleurs ne cascadent pas → tout texte via `<prefixe>-text`.
10. La typographie est plus petite que la maquette → base `rem` de 14 en natif → `inlineRem: 16` des l'initialisation.
11. Des points de rupture testes ne se declenchent **jamais** sur telephone → valeurs par defaut heritees du web, hors plage mobile → les redefinir en dp reels.
12. Un degrade, une grille ou une barre fixe corrects en apercu web sont absents sur l'appareil → classes web-only ou partielles → la porte d'interface est un **vrai appareil**, jamais un navigateur.
13. Le bundler gele a 99,9 % apres ajout d'images ou de jeux de donnees → le scanner de style traverse les repertoires et parse du binaire → ces repertoires **jamais** dans un glob de contenu.
14. Le style ne compile plus apres une installation banale → le peer range laisse entrer la majeure suivante → versions **a l'exact**.
15. La mise en page explose chez un utilisateur, parfaite en developpement → mise a l'echelle de police active → aucune hauteur fixe, maquettes validees a 200 %.
16. Des carres vides a la place de caracteres accentues ou etendus → sous-ensemble de police ampute → embarquer une police complete, verifier **glyphe par glyphe sur appareil reel**.

**Systeme et cycle de vie**
17. Des fichiers disparaissent tout seuls → ecriture dans le cache → repertoire de **documents**. Et les chemins qui ne resolvent plus apres mise a jour viennent d'URI **absolues** persistees.
18. Un extrait trouve en ligne pour le systeme de fichiers **leve** a l'execution → l'ancienne API namespace est depreciee et leve → uniquement les classes `File` / `Directory` / `Paths`.
19. La tache de fond ne s'execute jamais chez certains utilisateurs → optimiseur de batterie → le fond est un bonus.
20. Les utilisateurs perdent une fonction apres une mise a jour → un **changement de permission ne passe pas** a distance → nouveau binaire, redistribution planifiee.

**Tests et discipline**
21. La porte est verte sur la foi d'un build et d'un `tsc` → confusion entre compiler et fonctionner → une feature n'est finie qu'apres un **run de bout en bout live vert sur un binaire reellement construit et installe**, chiffres cites.
22. Un rouge est conclu « aleatoire » → un seul passage → rejeu **en isolation**, puis verification sur arbre vierge. Un temps mural aberrant est une machine en veille.
23. La porte affiche un total ininterpretable → configuration de test trop large melant unitaires et bout en bout → **configurations separees, chiffres cites separement**.
24. Un selecteur de bout en bout echoue « par ambiguite » → le meme identifiant monte deux fois → identifiants **uniques par instance montee**.
25. Une valeur de vocabulaire ferme n'est jamais atteinte, sans erreur ni journal → **la famille la plus couteuse : declare et jamais exerce** → chaque valeur a un test qui l'**emet reellement**. Compter des lignes couvertes ne prouve rien.
26. Un test de garde passe alors que la fonctionnalite est cassee → assertion negative seule, qu'une fonction morte satisfait → **toute assertion negative doublee d'une assertion positive dans le meme test**.
27. Un identifiant de test disparait apres une reorganisation, une autre suite casse plus tard → greper **toutes** les suites et rejouer les impactees.
28. Un processus lance pour une porte meurt vers dix minutes → le harness tue les processus d'arriere-plan → lancer **detache** avec redirection de sortie.

---

## 8. Doctrine de test

**L'auteur des tests n'est pas l'auteur du code.** Sur le corpus d'origine, la relecture de code et la revue de plan ont trouve **zero** defaut d'execution ; les suites ecrites par un auteur distinct et le bout en bout live en ont trouve la totalite. Ce n'est pas une preference de methode, c'est une mesure.

**Trois portes, et ce que chacune voit seule** : les unitaires voient la logique pure ; la navigation voit ce qu'un ecran monte reellement ; le bout en bout live voit ce que ni l'un ni l'autre ne peut voir — un binaire, un appareil, un parcours. **Les totaux ne s'additionnent jamais.**

**La porte de validation** — une feature est finie quand tout ceci est vrai **et cite avec ses chiffres reels** : typecheck et lint verts ; suites unitaires et de navigation vertes, **comptees separement** ; run de bout en bout live vert sur development build installe, « N passes / M echoues » et duree ; **passe en mode developpement** sur tous les ecrans, dans **toutes les langues livrees** — certaines validations ne s'executent qu'en mode developpement et un build de production ne les voit pas ; **greps d'invariants a zero** ; **couverture de vocabulaire**, chaque valeur fermee atteinte par un test qui l'emet.

---

## 9. Securite baseline

- Aucun secret dans une URL, jamais dans un journal, jamais renvoye par une API.
- Toute cle de perimetre est **resolue cote serveur** a partir d'un jeton — **jamais recue d'un client**. Un predicat de securite bati sur une valeur non authentifiee documente une intention, il ne garde rien.
- Refus indistinct : jeton absent, inconnu ou revoque repondent **le meme code**. Un code differencie est un oracle d'existence.
- Ce qui est ecrit en clair sur l'appareil est lisible par quiconque tient l'appareil. La menace principale d'une application mobile est le **telephone perdu, vole ou revendu**, pas le reseau.

---

## 10. Modules optionnels — a retenir explicitement, jamais par defaut

Chaque module ajoute des contraintes **couteuses et justifiees**. Un module retenu a tort impose un travail sans objet ; un module oublie se paie en refonte. Poser la question, ne pas deviner.

### M1 — Hors-ligne d'abord et synchronisation
*Pour : terrain, zones blanches, livraison rurale, sante communautaire. Contre : toute application qui suppose le reseau.*
- **TanStack Query devient proscrit** : son cache peremptoire ne peut pas s'ecrire dans la meme transaction que la donnee metier. Grep de porte contre son entree.
- **Une entite et sa ligne de file s'ecrivent dans UNE seule transaction exclusive.** Une ligne de file inseree apres commit perd silencieusement la donnee si l'application est tuee entre les deux.
- La transaction **non exclusive** englobe toute requete active pendant son cours, y compris ecrite hors de son scope, et un rollback l'emporte : **exclusive uniquement**, grep a zero.
- **`SENT` uniquement apres lecture d'un 2xx.** `PENDING → INFLIGHT → SENT` ; un delai depasse ramene en `PENDING` et **l'idempotence** tranche le rejeu (cle produite par le client, unique cote serveur).
- **Un seul drain a la fois** : mutex memoire **plus** garde en base.
- L'indicateur systeme **declenche**, une sonde serveur **decide** — l'indicateur de joignabilite d'Internet n'en est pas un.
- **Rituel de migration avant chaque livraison** : installer N-1, creer des donnees, installer N par-dessus, verifier que tout survit. Une migration ne se valide **jamais** sur base vide.
- Compteur « N elements en attente d'envoi » **permanent** dans l'interface.

### M2 — Backend d'API
*Pour : tout ce qui depasse l'appareil.*
- Depot separe, types **dupliques** cote application, contrat = l'API REST.
- Controleur = routage pur, service sans etat, **objet de validation obligatoire par route**.
- Enveloppe de reponse uniforme. Le cloisonnement s'ecrit **dans le `where`**, sur un perimetre resolu serveur.
- Migrations toujours en deux temps : generation puis **edition manuelle** — un declencheur, un `REVOKE` ou un index partiel ne sont generes par aucun outil.

### M3 — Paiement
*Pour : commerce, livraison, abonnement.*
- Montants en **unites majeures** dans le domaine et en base ; conversion en unites mineures **uniquement** dans l'adaptateur, au contact de l'API du prestataire.
- Commission, taux de change et frais **figes a la transaction**, jamais retroactifs.
- Webhooks : verification de signature **et** idempotence par reference unique.
- Pattern adaptateur, interface commune — jamais un prestataire cable en dur.

### M4 — Cartographie et geolocalisation
*Pour : livraison, terrain, proximite.*
- La permission de localisation est un **etat terminal** en cas de refus (§5.7) : prevoir le parcours degrade **des la conception**, pas apres.
- Le suivi en arriere-plan releve de §5.8 **et** des politiques de magasin : ne rien promettre dans l'interface.
- Consommation de batterie : la precision maximale en continu est un defaut produit, pas une qualite.

### M5 — Notifications
*Pour : commerce, livraison, messagerie.*
- Permission = etat terminal. Un utilisateur qui refuse ne doit pas perdre l'information : prevoir un canal de repli **dans l'application**.
- L'arrivee d'une notification n'est **jamais** garantie : elle declenche, elle ne transporte pas la verite.

### M6 — Media et camera
*Pour : preuve de livraison, catalogue, scan.*
- Permission = etat terminal.
- **Aucune URI absolue persistee** (piege 17) — les chemins de media sont le premier endroit ou cette faute apparait.
- Redimensionner **avant** stockage et envoi ; un cliche brut d'appareil moderne sature une file de synchronisation.

### M7 — Inference embarquee
*Pour : vision, classification hors ligne. Contre : tout le reste — ce module est couteux.*
- Le format d'artefact et le moteur d'inference sont une **zone gelee** : en changer reecrit la chaine d'export et le budget de latence.
- Verifier l'**integrite** d'un artefact telecharge **et** rejouer des **vecteurs de reference** : deux gardes differentes, toutes deux obligatoires. Un artefact corrompu donne n'importe quoi **sans erreur**.
- Toute performance se mesure sur l'**appareil cible reel**, jamais sur emulateur ni sur machine de developpement.
- L'ordre des canaux d'un tenseur depend de la plateforme : un test par plateforme sur une image aux couleurs connues.

### M8 — Comptes, authentification et donnees sensibles locales
*Pour : tout ce qui porte une identite ou un secret.*
- Cle produite par un generateur **asynchrone** : le synchrone retombe sur un generateur non cryptographique en developpement. Grep de porte.
- Cle deposee **sans exigence biometrique** : ajouter une empreinte detruirait l'acces. Un verrouillage applicatif se fait par code separe.
- Accessibilite **« apres le premier deverrouillage »**, sinon toute operation de fond echoue telephone verrouille.
- **Le magasin securise ne survit pas a une desinstallation** alors que le fichier de base, lui, peut survivre : detecter l'etat « donnees presentes, cle absente » et proposer une **reinitialisation explicite** plutot qu'une boucle de plantage.

---

## 11. Commandes dev standardisees

```bash
npx expo-doctor@latest        # depistage AVANT toute installation native
npx expo run:android          # boucle locale : construit et installe
npx expo prebuild --clean     # UNIQUEMENT : natif ajoute/maj, config modifiee, montee de SDK
npx expo start --dev-client   # iteration JS sur le binaire deja installe
npm run typecheck             # tsc --noEmit (generer les routes typees avant, en CI)
npm run lint                  # ESLint + eslint-plugin-i18next en mode all
npm run test:unit             # configuration dediee
npm run test:nav              # configuration dediee, chiffres cites a part
maestro test .maestro/        # LA PORTE, sur le build local ci-dessus
```

Prerequis : Node ≥ 22.13, Android Studio avec emulateur, **un appareil physique representatif du parc cible** — obligatoire pour toute porte d'interface ou de performance.

---

## 12. Ordre d'implementation recommande

1. Socle : projet, navigation, theme et tokens, i18n, **portes mecaniques des le depart**
2. Stockage local et migrations (+ M8 si retenu)
3. Le domaine metier central, sans reseau
4. M2 si retenu : contrat d'API, puis M1 si retenu : file et synchronisation
5. Les modules restants, un par un
6. Ecrans secondaires, accessibilite, mise a l'echelle de police
7. Distribution : icone, ecran de demarrage, signature, rituel de migration

**Verrou d'ordre** : les portes mecaniques et les monopoles (§4) se posent a l'etape 1. Les ajouter plus tard revient a les faire respecter sur du code deja ecrit contre eux.

---

## 13. Commits

Format **Conventional Commits avec emoji** `<emoji> <type>: <description>`. Types : `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`. Commits atomiques, un par etape logique du plan. **Aucune mention d'IA ou d'outil** dans un message de commit.
