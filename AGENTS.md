# Aswilia — AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->
# ⚠️ Next.js — Lis avant de coder

Cette version de Next.js peut avoir des changements majeurs par rapport à tes données d'entraînement.
**Consulte `node_modules/next/dist/docs/` avant d'écrire du code.**
Respecte les notices de dépréciation. En cas de doute, demande.
<!-- END:nextjs-agent-rules -->

---

## 🧠 Identité du projet

Tu travailles sur **Aswilia** — une plateforme de mémoire généalogique comorienne.
- Arbre généalogique interactif
- Système Hinya (lignée matrilinéaire) et Daho (foyer familial)
- Registre comorien organisé par île, région, localité
- Export PDF, connexion entre familles

**Stack :** Next.js · TypeScript · Tailwind CSS · Vercel

---

## 🤖 Règles pour les agents

### Périmètre d'action
- N'agis **que sur les fichiers explicitement mentionnés** dans la tâche.
- Si tu identifies un fichier supplémentaire nécessaire, **demande avant de le lire ou modifier**.
- Ne fais jamais d'exploration globale du projet.

### Gestion du contexte
- **Limite stricte : 60% du contexte maximum.**
- Si tu approches cette limite, arrête-toi, résume l'état et attends des instructions.
- Charge les fichiers en **Just-in-Time** — uniquement quand tu en as besoin.
- Ne charge jamais : `node_modules/`, `.next/`, `.vercel/`, `package-lock.json`, `tsconfig.tsbuildinfo`.

### Avant chaque tâche
1. Identifie les fichiers concernés (sans les lire tous).
2. Propose un plan clair avec les étapes et fichiers touchés.
3. Attends la validation avant d'exécuter.

### Pendant la tâche
- Travaille **fichier par fichier**.
- Signale tout effet de bord détecté avant de continuer.
- Ne refactore jamais du code hors du périmètre de la tâche.

### Subagents
- Utilise des subagents isolés pour les tâches lourdes (lecture massive de fichiers, audit, migration).
- Chaque subagent a son propre contexte — ne pollue pas le contexte principal.

---

## 🚫 Interdictions strictes

- Lire tout le projet au démarrage.
- Modifier un fichier non mentionné dans la tâche.
- Installer des dépendances sans validation explicite.
- Supprimer du code sans confirmation.
- Continuer au-delà de 60% du contexte.
- Inventer des APIs ou conventions Next.js — toujours vérifier dans `node_modules/next/dist/docs/`.

---

## ✅ Conventions du projet

- **Langage :** TypeScript strict
- **Style :** Tailwind CSS uniquement, pas de CSS inline
- **Commentaires :** en français si nécessaire
- **Composants :** dans `/components`, un fichier par composant
- **Hooks :** dans `/hooks`, préfixe `use`
- **Utilitaires :** dans `/lib`
- **Routes :** App Router Next.js dans `/app`
