export const meta = {
  name: 'revue-plan-autonome',
  description: 'Revue de plan en boucle autonome : choisit une lentille neuve a chaque tour, fait contre-verifier la passe precedente par un tiers, applique les survivants, et s arrete sur la regression mesuree',
  whenToUse: "Apres /create-impl-plan, quand on veut durcir un plan sans decider a l avance du nombre de passes. La boucle choisit ses lentilles, fait verifier chaque passe par la suivante et decide seule quand s arreter. Args : { racine, plan, spec, journal?, maxPasses?, seuilRegression? }",
  phases: [
    { title: 'Lentille' },
    { title: 'Contre-verification' },
    { title: 'Revue' },
    { title: 'Falsification' },
    { title: 'Application' },
    { title: 'Reconciliation' },
    { title: 'Bilan' },
  ],
}

// ---------------------------------------------------------------------------
// Parametres
// ---------------------------------------------------------------------------
const A = args || {}
const RACINE = A.racine
const PLAN = A.plan
const SPEC = A.spec || '(aucune spec fournie)'
const JOURNAL = A.journal || `${RACINE}/_plans/journal-revues.md`
const MAX_PASSES = A.maxPasses || 8            // garde-fou dur
const SEUIL_REGRESSION = A.seuilRegression || A.seuilIatrogene || 0.33
const BILAN = A.bilan || `${RACINE}/_plans/bilan-revues-autonome.md`

if (!RACINE || !PLAN) {
  throw new Error('args requis : { racine, plan } — et de preference { spec, journal }')
}

const CONTEXTE = `
Racine du projet  : ${RACINE}
Plan a durcir     : ${PLAN}
Spec source       : ${SPEC}
Journal des passes: ${JOURNAL}

Lis le CLAUDE.md du projet pour ses conventions, ses regles non negociables et
ses pieges deja payes. Lis le journal pour savoir ce qui a deja ete dit.

REGLE CARDINALE — ne jamais inventer un fait.
Tout constat s appuie sur une citation fichier:ligne, ou sur une commande de lecture
executee dont tu cites la sortie. Si tu ne peux pas prouver, tu ecris que tu ne peux
pas prouver et tu en fais une reserve. Un constat non source est pire qu un constat absent.
`

// ---------------------------------------------------------------------------
// Ordre des lentilles — l experience, pas le hasard
// ---------------------------------------------------------------------------
// Mesure faite sur un corpus reel (plan de 1500 lignes, 5 passes, 40 constats) :
// les lentilles d EXISTENCE rapportent le plus (« cette chose existe-t-elle, qui la
// produit, qui l appelle »), et la lentille de FALSIFIABILITE DES GARDES rapporte
// beaucoup MOINS quand elle est jouee en premier — parce qu elle fige des compteurs
// et des perimetres que les lentilles d existence invalident ensuite. Six des dix
// defauts croises de ce corpus venaient de la.
const ORDRE_RECOMMANDE = [
  'ATTEIGNABILITE — pour chaque chose que le plan declare (endpoint, ecran, fichier, commande), qui la SERT, qui l APPELLE, et quelle autorisation la laisse passer ? Y compris pour l acteur qui n a encore ni session ni role.',
  'CYCLE DE VIE — suivre une ligne de donnee de sa naissance a sa mort a travers TOUTES les etapes : quel geste la fait sortir de chaque etat, et que se passe-t-il quand personne ne la consomme ?',
  'SECRETS ET CANAUX HORS SYSTEME — pour chaque valeur a usage unique que le plan fabrique, par quel chemin exact devient-elle observable, pour l acteur legitime ET pour le harnais de test ; et ce chemin est-il ferme en production ?',
  'FIDELITE AU DISQUE — chaque fait que le plan affirme de l existant est-il vrai du code aujourd hui ? Ouvrir et citer.',
  'FALSIFIABILITE DES GARDES — pour chaque garde mecanique NEUVE, existe-t-il une implementation de bonne foi qui la laisse VERTE tout en violant ce qu elle pretend tenir ?',
]

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const S_LENTILLE = {
  type: 'object', additionalProperties: false,
  required: ['continuer', 'lentille', 'question', 'justification', 'deja_epuisees'],
  properties: {
    continuer: { type: 'boolean', description: 'false s il ne reste aucune question neuve qui vaille une passe' },
    lentille: { type: 'string', description: 'Nom court de la lentille retenue' },
    question: { type: 'string', description: 'La question exacte que cette passe pose au plan, et qu aucune precedente n a posee' },
    justification: { type: 'string', description: 'Pourquoi cette question maintenant, et ce qu elle peut reveler que les autres ne pouvaient pas voir' },
    deja_epuisees: { type: 'array', items: { type: 'string' }, description: 'Lentilles relevees dans le journal' },
  },
}

const S_CONTRE = {
  type: 'object', additionalProperties: false,
  required: ['verifiees', 'regressions', 'introuvables', 'verdict'],
  properties: {
    verifiees: { type: 'integer', description: 'Nombre de corrections de la passe precedente effectivement retrouvees dans le plan' },
    regressions: {
      type: 'array', maxItems: 20,
      description: 'Corrections de la passe precedente qui ont CASSE un acquis anterieur, ou introduit une incoherence',
      items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'titre', 'preuve', 'degat', 'correctif'],
        properties: {
          id: { type: 'string', description: 'Identifiant du constat de la passe precedente en cause' },
          titre: { type: 'string' },
          preuve: { type: 'string', description: 'fichier:ligne AVANT et APRES, ou les deux passages contradictoires' },
          degat: { type: 'string', description: 'Ce qui ne tient plus, concretement' },
          correctif: { type: 'string', description: 'Le texte a ecrire pour reparer' },
        },
      },
    },
    introuvables: { type: 'array', maxItems: 20, items: { type: 'string' }, description: 'Corrections annoncees au journal mais ABSENTES du plan — le journal ment' },
    verdict: { type: 'string' },
  },
}

const S_REVUE = {
  type: 'object', additionalProperties: false,
  required: ['constats', 'synthese'],
  properties: {
    synthese: { type: 'string' },
    constats: {
      type: 'array', maxItems: 20,
      items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'severite', 'titre', 'preuve', 'pourquoi', 'recommandation'],
        properties: {
          id: { type: 'string' },
          severite: { type: 'string', enum: ['CRITIQUE', 'IMPORTANT', 'MINEUR'] },
          titre: { type: 'string' },
          preuve: { type: 'string', description: 'fichier:ligne, ou commande + sortie. Obligatoire.' },
          pourquoi: { type: 'string' },
          recommandation: { type: 'string' },
        },
      },
    },
  },
}

const S_FALSIF = {
  type: 'object', additionalProperties: false,
  required: ['verdicts'],
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'refute', 'motif', 'severite_corrigee'],
        properties: {
          id: { type: 'string' },
          refute: { type: 'boolean', description: 'true si le constat est faux, deja traite ailleurs, ou repose sur une lecture erronee' },
          motif: { type: 'string', description: 'La preuve de la refutation, ou ce qui resiste a la tentative' },
          severite_corrigee: { type: 'string', enum: ['CRITIQUE', 'IMPORTANT', 'MINEUR', 'REFUTE'] },
        },
      },
    },
  },
}

const S_APPLI = {
  type: 'object', additionalProperties: false,
  required: ['appliques', 'ecarts', 'resume'],
  properties: {
    appliques: { type: 'integer' },
    ecarts: { type: 'array', maxItems: 20, items: { type: 'string' } },
    resume: { type: 'string' },
  },
}

// ---------------------------------------------------------------------------
// Boucle
// ---------------------------------------------------------------------------
const histo = []
let passe = 0
let motifArret = 'garde-fou maxPasses atteint'
let derniere = null   // { numero, lentille, survivants } de la passe precedente

while (passe < MAX_PASSES) {
  if (budget.total && budget.remaining() < 150_000) { motifArret = 'budget de jetons epuise'; break }

  passe++
  const numero = `${passe}`

  // --- 1. Choix de la lentille -------------------------------------------
  phase('Lentille')
  const suggeree = ORDRE_RECOMMANDE[passe - 1]
  const L = await agent(
    `${CONTEXTE}

Tu choisis la LENTILLE de la passe ${numero}.

Une passe de revue ne voit pas « les defauts du plan » : elle voit les defauts que
sa QUESTION rend visibles. Reposer une question deja posee ne rend rien. Ton travail
est donc de trouver une question NEUVE et FECONDE, ou de constater qu il n en reste plus.

${suggeree
  ? `LENTILLE SUGGEREE POUR CETTE POSITION DANS LA BOUCLE (l ordre est le fruit d une
mesure, pas d une preference — les lentilles d existence rapportent plus quand elles
sont jouees tot, et la falsifiabilite des gardes rapporte moins quand elle est jouee
en premier parce qu elle fige des comptes que les autres invalident ensuite) :

  ${suggeree}

Adopte-la, ou ecarte-la en ECRIVANT pourquoi elle ne s applique pas a ce plan.`
  : `Aucune lentille suggeree pour cette position : les cinq lentilles a fort rendement
sont derriere toi. Choisis librement, ou reponds continuer=false.`}

DEROULE
1. Lis ${JOURNAL} s il existe : releve TOUTES les lentilles deja employees.
2. Lis ${PLAN} et ${SPEC} en diagonale — assez pour juger ce qui n a pas ete regarde.
3. Choisis UNE question neuve, ou reponds continuer=false.

AUTRES LENTILLES QUI ONT PAYE SUR DES CORPUS REELS (inspire-toi, n y sois pas enferme) :
coherence avec la spec · ordre et dependances des etapes · les invariants un par un ·
les pieges deja payes du CLAUDE.md · le declare-jamais-exerce · l executabilite sur ce
poste aujourd hui · la tenue de la porte de validation · le domaine sensible du projet
(argent, sante, donnees personnelles) · adversariale : ce qui casse en premier · le
lecteur etranger qui execute a la lettre sans acces au corpus · la topologie des
inconnues (reserves et A DEFINIR comme graphe) · falsification des affirmations fortes.

⚠️ LENTILLE INTERDITE DANS LA BOUCLE : « ce que les passes precedentes ont casse en
reparant ». Elle est TAUTOLOGIQUE — sa reponse est par construction proche de 100 %,
et elle declencherait l arret quel que soit l etat reel du plan. Ce travail est fait
en continu par la phase de CONTRE-VERIFICATION, puis une derniere fois par la phase de
RECONCILIATION en cloture. Ne la choisis pas.

REPONDS continuer=false SI, ET SEULEMENT SI : toute question neuve que tu peux
formuler porterait sur du CODE EXECUTE plutot que sur le document. C est le vrai
signal : quand il ne reste que des faits d execution, la revue documentaire a fini
son travail. Ne dis pas false par prudence ni par fatigue — dis-le parce que la
prochaine question exige un terminal, pas une relecture.`,
    { label: `lentille-p${numero}`, phase: 'Lentille', schema: S_LENTILLE, effort: 'high' },
  )

  if (!L) { motifArret = 'choix de lentille perdu'; break }
  if (!L.continuer) { motifArret = `plus de lentille documentaire feconde : ${L.justification}`; break }
  log(`Passe ${numero} — lentille « ${L.lentille} » : ${L.question}`)

  // --- 2. Contre-verification de la passe PRECEDENTE ----------------------
  // Le defaut mesure sur corpus reel : la falsification INTRA-passe a refute 0 constat
  // sur 30, tandis qu une relecture CROISEE en a trouve 10. On ne se relit pas soi-meme
  // utilement. Cette phase confie donc les corrections DEJA APPLIQUEES de la passe N-1
  // a un tiers qui n a ni ecrit ni falsifie ces constats, et qui juge le RESULTAT dans
  // le plan plutot que le raisonnement qui l a produit.
  let regressions = []
  let tauxRegression = 0
  if (derniere) {
    phase('Contre-verification')
    const CV = await agent(
      `${CONTEXTE}

Tu es le CONTRE-VERIFICATEUR. Tu n as ecrit aucun de ces constats et tu n as pas vu le
raisonnement qui les a produits — c est voulu, et c est ta valeur.

La passe ${derniere.numero} (« ${derniere.lentille} ») a applique les corrections
ci-dessous dans ${PLAN}. Ton travail n est PAS de les rejuger sur le fond : c est de
verifier ce qu elles ont FAIT au document.

CORRECTIONS ANNONCEES
${JSON.stringify(derniere.survivants.map(c => ({ id: c.id, titre: c.titre, recommandation: c.recommandation })), null, 2)}

POUR CHACUNE, ouvre ${PLAN} et etablis :
  a) EST-ELLE LA ? Le journal peut annoncer une ecriture qui n a pas eu lieu. Une
     correction annoncee et absente va dans « introuvables » — c est un mensonge de
     journal, et c est grave : le porteur du projet croit le point ferme.
  b) A-T-ELLE CASSE UN ACQUIS ? Une correction touche un endroit ; le plan en parle
     souvent a trois. Cherche les mentions RESTEES a l ancien etat : comptes repetes
     (nombres d etapes, d endpoints, de regles, de fichiers), listes fermees, plages
     de lignes citees, liens « Depend de », renvois entre etapes, tableaux de couverture.
  c) DEUX PASSAGES SE CONTREDISENT-ILS MAINTENANT ? Un chiffre qui dit sept ici et
     huit la est une regression, meme si les deux valeurs ont ete vraies un jour.
  d) LA CORRECTION A-T-ELLE INTRODUIT UN FAIT NON OBSERVE ? Une version, une mesure,
     un chemin qui n existe pas au disque.

Tu DOIS lire ${PLAN} toi-meme. Un verdict rendu sans ouvrir le fichier ne vaut rien.
Tu NE MODIFIES RIEN : tu rends les correctifs, un autre agent les ecrira.

Si tout tient, dis-le franchement et rends une liste vide. Un rapport court et honnete
vaut mieux qu un rapport gonfle — et ce chiffre pilote l ARRET de la boucle.`,
      { label: `contre-verif-p${numero}`, phase: 'Contre-verification', schema: S_CONTRE, effort: 'xhigh' },
    )

    if (CV) {
      regressions = CV.regressions || []
      const base = derniere.survivants.length || 1
      tauxRegression = regressions.length / base
      log(`Passe ${numero} — contre-verification de la passe ${derniere.numero} : ${CV.verifiees} corrections retrouvees, ${regressions.length} regressions, ${(CV.introuvables || []).length} introuvables (taux ${Math.round(tauxRegression * 100)} %)`)

      // Les regressions sont reparees IMMEDIATEMENT, avant que la passe courante
      // n ecrive par-dessus. Une regression laissee ouverte se propage.
      if (regressions.length || (CV.introuvables || []).length) {
        await agent(
          `${CONTEXTE}

Tu es l AUTEUR du plan. Un contre-verificateur independant a examine ce que la passe
${derniere.numero} a ecrit dans ${PLAN} et a trouve ceci.

REGRESSIONS — corrections qui ont casse un acquis, ou qui se contredisent entre elles
${JSON.stringify(regressions, null, 2)}

INTROUVABLES — corrections annoncees au journal mais absentes du plan
${JSON.stringify(CV.introuvables || [], null, 2)}

TA TACHE
1. Repare chaque regression a l endroit exact ou elle porte, et ECRIS les corrections
   introuvables qui manquent reellement.
2. Un COMPTE repete a plusieurs endroits est la cause dominante de ces regressions.
   Quand tu en repares un, cherche TOUTES ses occurrences (grep le nombre en chiffres
   ET en lettres) et rends-les coherentes — ou, mieux, ecris-le a UN seul endroit et
   fais-y renvoyer les autres.
3. INTERDIT ABSOLU : inventer un fait, une version, une mesure.
4. Journalise dans ${JOURNAL}, EN AJOUT, sous le titre exact :

### Contre-verification de la passe ${derniere.numero} (menee a la passe ${numero})

en listant chaque regression reparee et chaque introuvable ecrite.`,
          { label: `reparation-p${numero}`, phase: 'Contre-verification', effort: 'high' },
        )
      }
    }
  }

  // --- 3. Revue ------------------------------------------------------------
  phase('Revue')
  const R = await agent(
    `${CONTEXTE}

Tu es l AUDITEUR de la passe ${numero}. Ta lentille, et rien d autre :

  LENTILLE : ${L.lentille}
  QUESTION : ${L.question}
  POURQUOI : ${L.justification}

Lentilles deja epuisees, dont redire un constat serait un ECHEC de ta passe :
${L.deja_epuisees.map(x => `  - ${x}`).join('\n') || '  (aucune : premiere passe)'}

DEROULE
1. Lis ${JOURNAL} pour savoir ce qui est deja dit.
2. Lis ${PLAN} EN ENTIER — vraiment, pas en diagonale. Puis ${SPEC}.
3. Ouvre le corpus et le disque autant que ta lentille l exige. Tu peux executer des
   commandes de LECTURE pour etablir un fait. Aucune commande qui modifie quoi que ce soit.
4. Rends tes constats, strictement sous ta lentille.

TU NE MODIFIES AUCUN FICHIER. Un autre agent appliquera.

EXIGENCES
- Chaque constat porte une PREUVE citable.
- Chaque recommandation est applicable telle quelle : le texte a ecrire, ou l ecrire.
- Severite honnete. CRITIQUE = le plan produit du travail faux, perdu, ou une decision
  irreversible mal prise. Un faux CRITIQUE coute la credibilite de toute la passe.
- ⚠️ Une recommandation qui MODIFIE UN COMPTE (nombre d etapes, d endpoints, de regles,
  de fichiers, de capacites) doit nommer TOUS les endroits du plan ou ce compte apparait.
  C est la premiere cause de regression mesuree sur ce type de boucle.
- Ne cherche PAS ce que les passes precedentes ont casse : une phase dediee s en charge,
  menee par un tiers. Ton temps est mieux employe sous ta propre lentille.
- Si ta lentille ne trouve pas grand-chose, DIS-LE et rends peu de constats. Un rapport
  court et honnete vaut mieux qu un rapport gonfle.`,
    { label: `revue-p${numero}`, phase: 'Revue', schema: S_REVUE, effort: 'xhigh' },
  )

  if (!R || !R.constats.length) { motifArret = `passe ${numero} sans constat`; break }

  // --- 4. Falsification : la revue de la revue -----------------------------
  // Chaque constat est confie a un sceptique dont la consigne est de le DETRUIRE.
  // ⚠️ TOUS les constats sont falsifies, MINEUR compris : sur corpus reel, laisser les
  // MINEUR passer sans verification faisait entrer 15 constats sur 40 dans le plan sans
  // qu aucun oeil ne les ait contredits. Les MINEUR partent en lots plus larges et a
  // effort moindre — la depense suit l enjeu, mais aucun constat n entre non verifie.
  phase('Falsification')
  const graves = R.constats.filter(c => c.severite !== 'MINEUR')
  const mineurs = R.constats.filter(c => c.severite === 'MINEUR')
  const lots = []
  for (let i = 0; i < graves.length; i += 4) lots.push({ items: graves.slice(i, i + 4), effort: 'high' })
  for (let i = 0; i < mineurs.length; i += 8) lots.push({ items: mineurs.slice(i, i + 8), effort: 'medium' })

  const verdicts = {}
  if (lots.length) {
    const rendus = await parallel(lots.map((lot, i) => () =>
      agent(
        `${CONTEXTE}

Tu es le SCEPTIQUE de la passe ${numero}. Un auditeur vient de rendre les constats
ci-dessous. Ton travail n est PAS de les confirmer : c est d essayer de les DETRUIRE.

⚠️ On ne te donne VOLONTAIREMENT ni la lentille, ni la question, ni le raisonnement qui
a produit ces constats. Tu juges la preuve et le plan, pas l intention de l auditeur.

CONSTATS A REFUTER
${JSON.stringify(lot.items, null, 2)}

POUR CHACUN, cherche activement :
  a) la preuve citee dit-elle vraiment ce que l auditeur lui fait dire ? Va la LIRE.
  b) le plan traite-t-il deja le point AILLEURS, a un endroit que l auditeur n a pas vu ?
  c) le constat repose-t-il sur une hypothese non ecrite, qui le rend faux si elle tombe ?
  d) la severite est-elle gonflee ? Un IMPORTANT presente en CRITIQUE est une refutation
     PARTIELLE : renvoie severite_corrigee au bon niveau plutot que refute=true.
  e) la recommandation, appliquee telle quelle, casserait-elle un acquis du plan ?
     Verifie en particulier les COMPTES et les listes fermees qu elle deplacerait.

Tu DOIS lire les fichiers toi-meme. Un verdict rendu sans avoir ouvert la preuve
ne vaut rien et fausse toute la boucle.

⚠️ Un taux de refutation nul sur une passe entiere est un signal, pas une reussite :
il signifie presque toujours qu on n a pas ouvert les preuves. Si tu ne refutes rien,
tu dois pouvoir citer, pour chaque constat, la ligne que tu as lue et ce qu elle disait.

En cas de doute reel apres verification, tu NE refutes PAS : un vrai defaut ecarte
coute plus cher qu un faux defaut applique. Mais un constat dont la preuve ne tient
pas doit tomber, meme s il est seduisant.`,
        { label: `falsif-p${numero}-${i + 1}`, phase: 'Falsification', schema: S_FALSIF, effort: lot.effort },
      )))

    for (const r of rendus.filter(Boolean)) for (const v of r.verdicts) verdicts[v.id] = v
  }

  const survivants = R.constats.filter(c => {
    const v = verdicts[c.id]
    if (!v) return true                       // verdict perdu : on garde, le doute profite au constat
    if (v.refute) return false
    if (v.severite_corrigee && v.severite_corrigee !== 'REFUTE') c.severite = v.severite_corrigee
    return true
  })

  const refutes = R.constats.length - survivants.length
  const nonVerifies = R.constats.filter(c => !verdicts[c.id]).length
  const nbC = survivants.filter(c => c.severite === 'CRITIQUE').length
  const nbI = survivants.filter(c => c.severite === 'IMPORTANT').length
  const nbM = survivants.filter(c => c.severite === 'MINEUR').length

  log(`Passe ${numero} — ${R.constats.length} constats, ${refutes} refutes, ${nonVerifies} non verifies, ${survivants.length} retenus (${nbC}C/${nbI}I/${nbM}M)`)

  if (!survivants.length) { motifArret = `passe ${numero} : tous les constats refutes en falsification`; break }

  // --- 5. Application -------------------------------------------------------
  phase('Application')
  const AP = await agent(
    `${CONTEXTE}

Tu es l AUTEUR du plan. La passe ${numero} (« ${L.lentille} ») a rendu ses constats,
et ils ont deja subi une falsification adversariale : ceux qui suivent ont SURVECU
a un sceptique qui cherchait a les detruire. ${refutes} ont ete ecartes.

CONSTATS RETENUS
${JSON.stringify(survivants, null, 2)}

TA TACHE
1. Applique chaque constat dans ${PLAN}, a l endroit exact ou il porte. Tu peux
   appliquer PLUS DUR que recommande. Tu ne t en ecartes que si l appliquer telle
   quelle introduirait un fait invente, une valeur non observee, une branche morte,
   ou contredirait une decision mieux fondee — et alors tu ECRIS l ecart et son argument.
2. INTERDIT ABSOLU : inventer un fait, une version, une mesure. Si une recommandation
   exige un chiffre que personne n a observe, ecris le MANQUE et l action qui le fermera.
3. ⚠️ PROPAGATION DES COMPTES — c est la premiere cause de regression mesuree sur cette
   boucle. Des qu une ecriture change un nombre (etapes, endpoints, regles, fichiers,
   capacites, violations, controles), grep ce nombre EN CHIFFRES ET EN LETTRES dans tout
   le plan et rends toutes ses occurrences coherentes. Mieux : ecris-le a UN SEUL endroit
   et fais-y renvoyer les autres. Un plan qui dit « sept » ici et « huit » la a perdu
   la confiance de son lecteur, et le lecteur a raison.
4. Garde le plan COHERENT : une correction qui touche une etape met a jour toutes ses
   mentions ailleurs (tests, portes, decisions, reserves, hors-perimetre, « Depend de »).
5. Journalise dans ${JOURNAL}, EN AJOUT a la fin, au format EXACT suivant — un agent
   de bilan recompte ces lignes, ne t en ecarte pas :

## Passe ${numero} — ${L.lentille}

**Constats** : ${nbC} CRITIQUE, ${nbI} IMPORTANT, ${nbM} MINEUR.

puis pour chaque constat : id, titre, preuve, et CE QUI A ETE ECRIT dans le plan —
cette derniere mention est lue par la contre-verification de la passe suivante, qui
ira verifier au disque que l ecriture a bien eu lieu. Termine par un paragraphe : ce
que le plan gagne, les reserves ouvertes ou fermees, et le nombre de constats refutes
en falsification (${refutes}).`,
    { label: `application-p${numero}`, phase: 'Application', schema: S_APPLI, effort: 'high' },
  )

  histo.push({
    passe, lentille: L.lentille, question: L.question,
    rendus: R.constats.length, refutes, nonVerifies, retenus: survivants.length,
    C: nbC, I: nbI, M: nbM,
    regressionsPassePrecedente: regressions.length,
    tauxRegression: Math.round(tauxRegression * 100),
  })

  derniere = { numero, lentille: L.lentille, survivants }

  // --- 6. Condition d arret : la REGRESSION MESUREE ------------------------
  // ⚠️ Ce n est PAS un ratio auto-declare par l auditeur de la passe : c est le verdict
  // d un tiers qui a ouvert le plan et compte ce que la passe precedente a casse. Une
  // boucle qui s arrete sur un chiffre que sa propre question garantit ne mesure rien.
  if (tauxRegression >= SEUIL_REGRESSION) {
    motifArret = `regression a ${Math.round(tauxRegression * 100)} % constatee par contre-verification sur la passe ${derniere.numero} (seuil ${Math.round(SEUIL_REGRESSION * 100)} %) — les corrections cassent plus qu elles ne reparent`
    log(`ARRET — ${motifArret}`)
    break
  }
}

// ---------------------------------------------------------------------------
// Reconciliation — phase de CLOTURE, jouee une fois, jamais notee
// ---------------------------------------------------------------------------
// La derniere passe appliquee n a jamais ete contre-verifiee : la boucle s arrete
// juste apres elle. Cette phase ferme ce trou, et fait la seule chose qu aucune
// lentille ne peut faire honnetement — regarder le plan comme un tout apres N series
// d ecritures. Elle n entre dans AUCUN calcul d arret : c est ce qui la rend utile.
phase('Reconciliation')
const RECO = await agent(
  `${CONTEXTE}

La boucle de revue est terminee. Motif d arret : ${motifArret}
${derniere ? `La passe ${derniere.numero} (« ${derniere.lentille} ») est la DERNIERE appliquee, et personne ne l a encore contre-verifiee.` : 'Aucune passe n a ete appliquee.'}

Tu es le RECONCILIATEUR. Tu ne cherches pas de defaut neuf : tu rends le document
coherent avec lui-meme apres ${histo.length} series d ecritures successives.

DEROULE
1. Lis ${JOURNAL} en entier, puis ${PLAN} en entier.
2. CONTRE-VERIFIE la derniere passe appliquee comme les autres l ont ete : chaque
   correction annoncee au journal est-elle REELLEMENT dans le plan ? A-t-elle casse
   un acquis anterieur ?
3. VERIFICATION NUMERIQUE MECANIQUE — le point qui a coute le plus cher sur corpus reel.
   Pour CHAQUE compte cite dans le plan (nombre d etapes, d endpoints, de regles de
   grep, de fichiers a creer, de capacites, de violations a introduire, de controles,
   de criteres d acceptation), grep sa valeur EN CHIFFRES ET EN LETTRES et verifie que
   toutes ses occurrences concordent. Toute divergence est reparee, et tu cites la
   ligne avant et apres. Si un compte est structurellement fragile parce qu il est
   repete, ecris-le a UN endroit et fais-y renvoyer les autres.
4. VERIFICATION DE COUVERTURE : chaque critere d acceptation de ${SPEC} est-il encore
   adresse par au moins une etape apres toutes ces reecritures ? Une correction peut
   avoir deplace ou dissous une etape qui portait un critere.
5. LIENS INTERNES : chaque « Depend de », chaque renvoi « voir Etape N », chaque plage
   de lignes citee pointe-t-il encore vers ce qu il designait ?
6. Journalise dans ${JOURNAL}, EN AJOUT, sous le titre exact :

## Reconciliation de cloture

en listant ce que tu as repare, et ce que tu as trouve INCOHERENT SANS POUVOIR trancher
— ces derniers points reviennent au porteur du projet, ne les invente pas.

Rends un compte rendu de 15 lignes maximum : nombre de divergences numeriques reparees,
nombre de corrections annoncees mais introuvables, criteres orphelins, liens casses, et
ce qui reste ouvert.`,
  { label: 'reconciliation', phase: 'Reconciliation', effort: 'xhigh' },
)

// ---------------------------------------------------------------------------
// Bilan
// ---------------------------------------------------------------------------
phase('Bilan')
const bilan = await agent(
  `${CONTEXTE}

La boucle de revue autonome s est arretee. Motif : ${motifArret}

HISTORIQUE DES PASSES
${JSON.stringify(histo, null, 2)}

COMPTE RENDU DE LA RECONCILIATION DE CLOTURE
${RECO || '(reconciliation perdue)'}

Ecris ${BILAN}. Recompte depuis ${JOURNAL} — ne fais pas confiance aux chiffres
ci-dessus sans les croiser.

1. LE COMPTE : constats par passe et par severite, total, part refutee en falsification,
   et part entree SANS verification (champ nonVerifies — un verdict perdu laisse passer
   un constat que personne n a contredit). Un taux de refutation TRES BAS (moins de 5 %)
   est suspect : soit les auditeurs etaient excellents, soit les sceptiques n ont pas
   ouvert les preuves. Dis lequel tu crois, avec ton motif, et cite au moins trois
   preuves que tu as toi-meme rouvertes au disque pour trancher.
2. LE RENDEMENT PAR LENTILLE : quelle question a rapporte le plus, laquelle le moins,
   et ce que cela apprend sur l ordre dans lequel poser les lentilles la prochaine fois.
   Confronte-le a l ordre recommande par le workflow : l a-t-il confirme ou dementi ?
3. LA REGRESSION : sa courbe passe par passe, telle que MESUREE par les contre-verifications
   (pas auto-declaree). Est-ce bien elle qui a arrete la boucle, ou un autre motif ?
   Le plan s est-il durci ou fragilise sur la fin ?
4. CE QUI RESTE HORS DE PORTEE d une revue documentaire, et exige du code execute.
5. ETAT FINAL : le plan est-il implementable des sa premiere etape, oui ou non, et si
   non, ce qui manque exactement. Ce qui reste du a un humain, et avant quelle etape.

Dense et honnete : le porteur du projet prend une decision d engagement sur ce document.
Rends en retour un resume de 25 lignes maximum.`,
  { label: 'bilan-autonome', phase: 'Bilan', effort: 'xhigh' },
)

return { passes: histo, motifArret, reconciliation: RECO, bilan }
