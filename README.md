# Workflow de développement avec Claude Code

Des commandes qui font passer chaque fonctionnalité par les mêmes étapes, de l'idée au merge. L'idée centrale : les tests sont écrits par un agent distinct de celui qui a écrit le code.

**À lire en premier :** ouvrez [`workflow.html`](workflow.html) dans un navigateur. Il présente le rôle de chaque commande, quand l'utiliser, et quand lancer tout le cycle automatiquement. Le détail complet est dans [`commands/WORKFLOW_GUIDE.md`](commands/WORKFLOW_GUIDE.md).

```text
Spec → Contrats → Plan → Revue → Checklist de tests → Code
     → Tests par un agent distinct → Mutations → Porte de validation
     → Commit → Merge → Résumé
```

## Installer

Il faut [Claude Code](https://claude.com/claude-code).

```bash
git clone https://github.com/Relbolio/claude-code-workflow.git
cd claude-code-workflow
mkdir -p ~/.claude/commands ~/.claude/stacks ~/.claude/workflows
cp commands/* ~/.claude/commands/
cp stacks/* ~/.claude/stacks/
cp workflows/* ~/.claude/workflows/
```

## Démarrer sur un projet

```text
/claude-md
/create-feature-spec "ma fonctionnalité"
/create-impl-plan _specs/ma-fonctionnalite.md
```

`/claude-md` écrit le fichier que Claude lit à chaque session : c'est lui qui rend le workflow obligatoire dans le projet.

## Contenu

| Dossier | Contenu |
|---|---|
| `commands/` | Les commandes du cycle de vie, et le guide `WORKFLOW_GUIDE.md` |
| `stacks/` | Préréglages de pile pour `/generate-architecture` : conventions et pièges déjà rencontrés |
| `workflows/` | `revue-plan-autonome` : revue de plan en boucle, avec arrêt mesuré |
