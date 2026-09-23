# Informations sur l'application Puma

## Description Générale

Cette application est une plateforme de gestion de tâches et de supervision géographique conçue pour les différents sites de Grupopuma (usines, carrières, showrooms et dépôts). Elle permet de suivre l'avancement des projets, d'assigner des tâches aux collaborateurs et d'avoir une vue d'ensemble sur l'activité de l'entreprise.

## Fonctionnalités Principales

1. **Dashboard (Tableau de bord)** : Vue d'ensemble des statistiques, des tâches récentes et de l'activité globale.
2. **Kanban** : Gestion visuelle des tâches par statut (À faire, En cours, En révision, Terminé).
3. **Tâches** : Liste détaillée de toutes les tâches avec filtres et options de tri.
4. **Calendrier** : Vue chronologique des échéances et des tâches planifiées.
5. **Paramètres** : Gestion des utilisateurs, des sites et des informations de l'entreprise.

## Liste des Sites Actuels

L'application gère actuellement les sites suivants :

- Usine Grupopuma Sidi Bel Abbes
- Usine Grupopuma Constantine
- Usine Grupopuma Bouira
- Carrière Grupopuma Constantine
- Showroom Grupopuma Alger
- Depot Grupopuma HTA

## Types de Sites

- Usine
- Showroom
- Dépôt
- Carrière

## Rôles Utilisateurs

- **Administrateur** : Accès complet à toutes les fonctionnalités et paramètres.
- **Manager** : Gestion d'un site spécifique et de ses collaborateurs.
- **Employé** : Accès à ses propres tâches et mise à jour de leur statut.

## Technologies Utilisées

- **Frontend** : React 19, TypeScript, Vanilla CSS, Vite
- **Gestion d'état** : Zustand (Asynchrone avec API)
- **Backend** : Node.js, Express.js
- **Base de données** : SQLite (via better-sqlite3)
- **Qualité & Tests** : Vitest, ESLint 9, Prettier
- **Composants UI** : Radix UI, Lucide React (icônes)
- **PDF** : jsPDF (Génération de rapports avec Lazy Loading)
- **Drag & Drop** : @hello-pangea/dnd (pour le Kanban)
- **Calendrier** : react-big-calendar
