# Guide de Déploiement en Production

Vous adorez le rendu final en local sur votre ordinateur, et vous souhaitez le rendre accessible au reste de l'entreprise via une véritable URL (ex: `https://puma.votre-usine.dz`) ?

Ce tutoriel va vous expliquer comment "fermer le carton" (packager) et placer l'application sur un vrai serveur. C'est remarquablement simple pour ce type de plateforme.

---

## 1. La Commande de Compilation ("Build")

Le code d'interface doit être compilé avant d'être servi par le backend.

1. Ouvrez votre **Terminal**.
2. Tapez la commande suivante :
   ```bash
   npm run build
   ```
3. Cette commande génère un dossier optimisé nommé `dist/`.

---

## 2. Lancement du Serveur de Production

Contrairement à une simple application web, Puma nécessite que le serveur Node.js soit en cours d'exécution pour fonctionner.

1. Assurez-vous d'avoir le dossier `dist/` et le dossier `server/` sur votre serveur de production.
2. Lancez le serveur avec Node.js :
   ```bash
   node server/index.js
   ```
3. L'application est alors accessible sur le port **3001** (ou le port défini par la variable d'environnement `PORT`). Le serveur s'occupe de servir à la fois l'API et l'interface interface visuelle.

---

## 3. Déploiement via un Conteneur (Recommandé)

Pour un déploiement professionnel et sans accroc, il est fortement recommandé d'utiliser **Docker**.
Consultez le guide **`06_docker.md`** pour savoir comment emballer l'interface, le serveur et la base de données dans un seul composant prêt pour la production.
