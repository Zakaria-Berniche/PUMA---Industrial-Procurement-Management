# Introduction à Puma Industrial Task Management

Bienvenue dans la documentation technique de **Puma Industrial Task Management**.

Ce classeur a été rédigé pour vous permettre de comprendre, d'installer et d'utiliser cette application même si vous débutez complètement en informatique ou en programmation.

---

## 📌 Qu'est-ce que ce logiciel ?

**Puma** est une plateforme sur-mesure de gestion de tâches ("Task Management") destinée au secteur industriel.
Plutôt que d'utiliser des outils génériques complexes ou des tableurs Excel compliqués à maintenir, Puma permet aux employés (acheteurs, responsables de site, membres du comité de direction) de :

- Créer et suivre des tickets (Tâches).
- Connaître exactement à quelle étape se trouve un dossier (Workflow métier).
- Pouvoir bloquer certaines validations aux seuls directeurs pour des questions de sécurité financière et de logistique.
- Avoir un tableau de bord global de toutes les opérations.

Le profil typique d'un utilisateur de Puma est une personne de terrain ou de bureau impliquée dans la logistique, la production ou les achats, au sein de plusieurs sites physiques (Centrales, usines, dépôts...).

---

## 🛠️ Composition du logiciel (Architecture Full-Stack)

Puma a évolué vers une architecture professionnelle complète, robuste et performante :

1. **Interface Utilisateur (Front-End) :** Développée avec **React 19**, elle offre une expérience fluide et réactive. Elle gère l'affichage, la cartographie interactive et les interactions en temps réel.
2. **Serveur de Données (Back-End) :** Une API propulsée par **Node.js et Express** gère désormais toute la logique métier, la sécurité et la communication avec la base de données.
3. **Base de Données (Stockage) :** Les informations ne sont plus limitées à votre navigateur. Elles sont sauvegardées de manière sécurisée dans une base de données **SQLite** (`puma_database.sqlite`), garantissant que vos tâches et configurations sont conservées durablement.

Cette architecture permet une gestion multi-utilisateurs réelle et une intégrité des données professionnelle.

---

## 🔰 Prérequis pour le technicien / administrateur

Avant de passer à la suite (et au chapitre de l'Installation), vous aurez besoin que votre ordinateur de travail possède :

1. **Une connexion internet** (Pour télécharger les composants lors de la toute première installation).
2. **Un système d'exploitation classique** (Windows 10/11, macOS, ou n'importe quelle petite distribution Linux).
3. Quelques petits logiciels de base que nous verrons dans le chapitre "02_installation".

Prêt(e) ? Rendez-vous sur la page **`02_installation.md`** !
