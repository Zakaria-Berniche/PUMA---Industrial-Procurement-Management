# Guide de Déploiement Docker (Spécial DSI)

Ce guide est destiné à l'équipe **DSI** pour assurer un déploiement robuste, sécurisé et maintenable de la plateforme **Puma** via Docker.

---

## 🏗️ Architecture du Conteneur

L'application repose sur un **Dockerfile hybride** utilisant un build multi-étape ("Multi-stage build").

1.  **Stage Build** : Utilise une image Node.js Alpine pour compiler le frontend (Vite/React) et générer les actifs statiques dans le dossier `/dist`.
2.  **Stage Runtime** : Produit une image légère contenant uniquement le serveur d'API Node.js et les fichiers compilés. Le serveur Express gère à la fois les appels API et le service des fichiers statiques.

---

## Procédure de Déploiement Rapide

Le déploiement est orchestré par **Docker Compose**.

### 1. Construction et Lancement

Depuis la racine du projet, exécutez :

```bash
docker-compose up -d --build
```

- `--build` : Assure la recompilation des sources.
- `-d` : Lance les services en mode détaché (arrière-plan).

### 2. Vérification du Service

Le conteneur expose l'application sur le port **8080** par défaut (mappé sur le port interne 3001).
Vérifier l'état avec :

```bash
docker ps
# Accès : http://<ip-serveur>:8080
```

---

## 💾 Gestion de la Persistence (Critique)

La base de données est un fichier **SQLite** (`puma_database.sqlite`). Pour éviter toute perte de données lors de la mise à jour ou de la suppression du conteneur, le dossier `./database/` de l'hôte est monté dans le conteneur :

- Le dossier `./database/` est créé automatiquement s'il n'existe pas.
- La base de données est stockée dans `./database/puma_database.sqlite` sur l'hôte.
- La variable d'environnement `DB_PATH` indique au serveur le chemin exact à utiliser.

> [!CAUTION]
> Assurez-vous que le dossier `./database/` sur l'hôte possède les permissions d'écriture pour l'utilisateur exécutant le processus Node dans le conteneur (UID 1000 par défaut sur Alpine).

---

## 🔧 Maintenance et Administration

### Initialisation des Données (Seed)

Pour injecter les utilisateurs et sites de référence dans une nouvelle instance :

```bash
docker exec -it puma_server npx tsx server/seed.ts
```

### Accès aux Logs

```bash
docker logs -f puma_server
```

### Sauvegarde

La sauvegarde se résume à copier le fichier `puma_database.sqlite` présent à la racine du dossier projet sur l'hôte. Il est recommandé de verrouiller ou d'arrêter brièvement le conteneur durant la copie pour garantir l'intégrité atomique du fichier.

---

## ⚙️ Variables d'Environnement

Le conteneur supporte les variables suivantes dans le `docker-compose.yml` :

- `NODE_ENV` : Positionné sur `production` pour optimiser les performances.
- `PORT` : Port interne du serveur (par défaut 3001).

---

> [!IMPORTANT]
> **Sécurité** : En l'état, l'application utilise une authentification simulée. Pour une exposition sur internet, il est impératif de configurer un reverse-proxy (Nginx/Traefik) gérant le SSL/TLS en amont du port 8080.
