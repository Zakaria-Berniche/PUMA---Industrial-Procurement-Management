# Architecture Technique (Explications Simplifiées)

Cette section est dédiée aux curieux, administrateurs système et développeurs juniors qui souhaiteraient comprendre de quoi est fait ce projet avant d'y toucher.

Voici un résumé simplifié des briques technologiques qui composent le logiciel.

---

## 1. Fondation : React.js (Le Squelette)

- **Qu'est-ce que c'est ?** C'est une bibliothèque inventée par Facebook (Meta) pour construire des interfaces utilisateurs.
- **Pourquoi l'avoir choisie ?** Au lieu de créer des dizaines de pages web (Accueil, Profil, Dashboard) avec des codes copiés/collés, React nous permet de créer des petits "morceaux de legos" (des "Composants" comme un bouton, un menu, une carte). On les assemble ensuite pour créer toute l'application. C'est rapide, et si on modifie le lego "bouton", il se met à jour absolument partout d'un coup.

## 2. Le Moteur : Vite.js (La Ferrari)

- **Qu'est-ce que c'est ?** C'est un outil très moderne qui remplace l'ancien "Webpack". Il est responsable du démarrage de l'application et de son "emballage".
- **Pourquoi l'avoir choisi ?** Le code source de l'application pèse lourd avec tous ses espaces et ses commentaires pour les humains. Quand on tape `npm run dev`, Vite compile ça en un quart de seconde. Quand l'ordinateur sauvegarde un fichier, la page réagit instantanément sans rechargement lourd. C'est un gain de temps massif pour un développeur.

## 3. Le Magasin de Données : Zustand (Le Cerveau)

- **Qu'est-ce que c'est ?** C'est un gestionnaire d'état Global ("State Manager").
- **Pourquoi l'avoir choisi ?** Zustand synchronise l'interface en temps réel. Désormais, il est relié à notre API pour envoyer et recevoir les données du serveur de manière asynchrone et sécurisée.

## 4. Le Serveur : Express.js (Le Moteur Backend)

- **Qu'est-ce que c'est ?** Un cadre de travail pour Node.js qui permet de créer des serveurs web et des API très rapidement.
- **Pourquoi l'avoir choisi ?** Il gère toutes les requêtes provenant de l'interface (création de tâche, modification de site) et communique avec la base de données SQLite. C'est le point central de la logique métier.

## 5. La Base de Données : SQLite (La Mémoire)

- **Qu'est-ce que c'est ?** Une base de données relationnelle légère qui ne nécessite pas de serveur séparé (elle tient dans un seul fichier `.sqlite`).
- **Pourquoi l'avoir choisi ?** C'est la solution idéale pour des applications industrielles locales ou de taille moyenne. Elle offre la puissance du SQL sans la complexité d'installation d'un MySQL ou PostgreSQL.

## 6. La Peinture : Vanilla CSS (Le Pinceau)

- **Qu'est-ce que c'est ?** Du CSS standard moderne pour un contrôle total sur l'esthétique "premium" et "glassmorphism" de Puma.

## 7. Qualité et Tests : Vitest

- **Qu'est-ce que c'est ?** Un framework de tests ultra-rapide conçu pour Vite.
- **Pourquoi l'avoir choisi ?** Il garantit que chaque modification du code ne casse pas les fonctionnalités existantes (calculs, formats de dates, etc.).


---

La philosophie générale du code a été la **modularité**. Le dossier `src/` contient chaque fichier bien séparément, des icônes réutilisables, et une architecture extrêmement prédictible. N'importe quel développeur "Fullstack" de la décennie pourra reprendre ce code en 15 minutes.
