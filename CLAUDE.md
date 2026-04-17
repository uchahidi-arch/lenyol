# Aswilia — CLAUDE.md

## 🧭 Projet
Aswilia est une plateforme de mémoire généalogique comorienne.
Elle permet de créer des arbres familiaux, de préserver le Hinya (lignée matrilinéaire) et le Daho (foyer familial), et d'explorer un registre comorien organisé par île, région et localité.

**Stack :** Next.js · TypeScript · Tailwind CSS · Vercel

---

## ⚠️ Règles de context engineering — OBLIGATOIRES

### 1. Ne jamais dépasser 60% du contexte
- Si tu estimes que le contexte approche 60%, **arrête-toi** et dis-le moi.
- Résume ce qui a été fait, ce qui reste à faire, et attends mes instructions avant de continuer.
- Ne continue jamais au-delà de 60% — les performances chutent.

### 2. Lecture de fichiers — Just-in-Time uniquement
- **Ne lis jamais tous les fichiers du projet au démarrage.**
- Garde uniquement des références légères (chemins de fichiers).
- Ne lis un fichier que quand tu en as **réellement besoin** pour la tâche en cours.
- Fichiers à ne jamais lire sauf demande explicite :
  - `node_modules/`
  - `.next/`
  - `.vercel/`
  - `package-lock.json`
  - `tsconfig.tsbuildinfo`

### 3. Utilise le mode Plan pour les tâches complexes
- Pour toute tâche qui touche plus de 2 fichiers, commence par un **plan détaillé**.
- Liste les fichiers concernés, les modifications prévues, les risques.
- Attends ma validation avant d'exécuter.
- Vide le contexte après approbation du plan pour partir avec une fenêtre propre.

### 4. Tâches complexes → Subagents
- Si une tâche nécessite de lire beaucoup de fichiers, délègue à un subagent isolé.
- Exemples : refactoring global, migration de schéma, audit complet d'un module.

### 5. Sauvegarder avant de recommencer
- Si le contexte approche la limite, sauvegarde un résumé : ce qui est fait, ce qui reste, les décisions prises.
- Ne perds jamais la cohérence entre les sessions.

---

## 📁 Structure du projet

```
/app          → Pages et routes Next.js (App Router)
/components   → Composants React réutilisables
/hooks        → Custom hooks React
/lib          → Utilitaires, helpers, config
/public       → Assets statiques
/.claude      → Config Claude Code
```

---

## 🛠️ Comportement attendu

### Pour une nouvelle fonctionnalité
1. Demande-moi les fichiers concernés — ne les devine pas tous seul.
2. Propose un plan avant de coder.
3. Implémente fichier par fichier, valide avec moi entre chaque étape.
4. Ne modifie jamais un fichier non mentionné dans le plan.

### Pour une modification
1. Lis uniquement le fichier à modifier.
2. Propose le diff avant d'appliquer.
3. Signale tout effet de bord potentiel.

### Toujours
- Respecter les conventions TypeScript du projet.
- Utiliser Tailwind CSS pour le style.
- Ne pas installer de nouvelles dépendances sans me demander.
- Commenter en français si besoin de commentaires.

---

## 🚫 Ne jamais faire
- Lire tout le projet d'un coup.
- Modifier des fichiers hors du périmètre de la tâche.
- Continuer une tâche si le contexte dépasse 60%.
- Installer des packages sans validation.
- Supprimer du code existant sans confirmation explicite.
