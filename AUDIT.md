# Audit complet — PUMA (Industrial Task Management)

- **Date de l'audit :** 23/09/2026
- **Périmètre :** dépôt complet `PUMA---industrial-task-management` (frontend React 19/Vite, backend Express/SQLite, Docker, documentation)
- **Volume analysé :** 81 fichiers TS/TSX — 16 878 lignes — `dist` 2,7 Mo
- **Méthode :** lecture exhaustive du code + exécution réelle (`tsc`, `eslint`, `vitest`, `vite build`, serveur Node interrogé en HTTP, inspection directe de la base SQLite livrée)
- **Verdict global : 62/100** — socle technique solide, mais **2 défauts bloquants** et **plusieurs failles de sécurité/fonctionnelles** rendant l'état livré inexploitable en production.

---

## 1. Synthèse

| Catégorie | État |
| --- | --- |
| Typage TypeScript | ✅ `npx tsc --noEmit` → exit 0 |
| Build production | ✅ `npm run build` → succès en 13,9 s |
| Lint | ❌ Inopérant (0 erreur/0 warning sur 115 fichiers, parser TS non appliqué) |
| Tests | ❌ `2 échecs / 36` (rbac.test.ts, security.test.ts) |
| Fonctionnel cœur (création de tâche) | ❌ `500` sur la base livrée |
| Persistance des paramètres | ❌ `404` sur `PUT /api/settings/*` |
| Sécurité | ❌ 6 anomalies confirmées en direct |
| Git / Livraison | ❌ Aucun commit, binaires SQLite suivis |

### Preuves d'exécution (résultats bruts)

```text
$ npx tsc --noEmit                                        → exit code 0
$ npx eslint . -f json                                    → files: 115, errors: 0, warnings: 0
$ npx eslint --print-config src/store/slices/createDataSlice.ts
                                                          → parser: undefined  (règles TS non exécutées)
$ npx vitest run                                          → Test Files 2 failed | 2 passed (4)
                                                            Tests 2 failed | 34 passed (36)
                                                            Duration 6.23s
$ npm run build                                           → built in 13.92s (45 assets)
$ git rev-list --count HEAD                               → fatal: ambiguous argument 'HEAD' (0 commit)
```

```text
# Probes HTTP sur la base LIVRÉE (port 3001)
GET  /api/health                             → 200 {"status":"Puma Server Running","database":"Connected"}
POST /api/login (admin@puma.com/password123) → 200 (JWT 200 car.)
GET  /api/me                                 → 200 — ME_HAS_password_hash: True        ❌ FUITE
POST /api/tasks (admin, payload valide)      → 500 NOT NULL constraint failed: tasks.siteId  ❌ BLOQUANT
PUT  /api/settings/global_rules (admin)      → 404 Not Found                           ❌ BLOQUANT
POST /api/tasks (token Collaborateur)        → 500 (garde de rôle : autorisé)           ❌ RBAC
PUT  /api/users/<soi-même> (Collaborateur)   → 403                                     ❌ Profil KO
GET  /api/users (token Collaborateur)        → 200, expose smtpSettings de tous         ❌ FUITE
GET  /api/notifications (Collaborateur)      → 200, count=2, userIds=user_admin_001,u2  ❌ CLOISONNEMENT
GET  /api/users?token=<jwt>                  → 200 (token accepté en query string)      ❌ FUITE
GET  /api/unknown_endpoint                   → 200 text/html (catch-all SPA)             ⚠️ HYGIÈNE
```

```text
# Contre-épreuve sur base NEUVE (DB_PATH temporaire, ports 3011/3012)
POST /api/tasks (admin, payload valide)      → 201 ✅ (confirme la cause : schéma legacy)
PUT  /api/settings/global_rules (admin)      → 200 ✅ (confirme la cause : amorçage partiel)
POST /api/users (admin)                      → 201 puis POST /api/login (password123) → 401
   … après REDÉMARRAGE du serveur            → 200 (mot de passe par défaut attribué)   ❌ BACKDOOR
POST /api/tasks (token Collaborateur)        → 201                                     ❌ RBAC
```

---

## 2. Défauts bloquants (P0)

### P0-1 — La création de tâche échoue : `500 NOT NULL constraint failed: tasks.siteId`

- **Constat :** toute création de tâche renvoie `500` sur l'instance livrée ; le test `server/tests/rbac.test.ts:134` échoue (`expected 403 "Forbidden", got 500`).
- **Cause racine :** la base livrée contient une table `tasks` **legacy** issue d'une version antérieure :

  ```sql
  CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    siteId TEXT NOT NULL,        -- colonnes camelCase obsolètes, toujours NOT NULL
    assigneeId TEXT NOT NULL,
    status TEXT NOT NULL,
    data TEXT NOT NULL,
    ... title, department, ... site_id, assignee_id, ... updated_at   -- colonnes ajoutées ensuite
  );
  ```

  Le CRUD générique ne renseigne que les colonnes `snake_case` (`server/index.ts:521-525`) et `CREATE TABLE IF NOT EXISTS` (`server/db.ts:37-55`) n'altère jamais une table existante.
- **Contre-épreuve :** sur une base neuve, `POST /api/tasks` → **201** (fonctionne).
- **Aggravant frontend :** `src/store/slices/createTaskSlice.ts:200-203` effectue un ajout **optimiste sans rollback** (contrairement à `updateObjectiveStatus`) → la tâche apparaît dans l'UI puis disparaît au rechargement (perception de perte de saisie).
- **Correctif :** migration de reconstruction de `tasks` (nouvelle table conforme + backfill depuis `data` JSON + `DROP`/`RENAME`), script idempotent versionné, test d'intégration sur base « existante », rollback côté front.

### P0-2 — Les paramètres administrateur ne sont jamais enregistrés : `PUT /api/settings/* → 404`

- **Constat :** `PUT /api/settings/global_rules` → `404` ; en base, la table `settings` ne contient **qu'une ligne `company_info`** ; le test `server/tests/security.test.ts:271` échoue (`expected 200 "OK", got 404 "Not Found"`).
- **Cause racine :** `seedDefaults()` (`server/db.ts:445-527`) conditionne l'amorçage à `SELECT count(*) FROM settings === 0`. La base livrée contenant déjà `company_info`, les clés `global_rules`, `ai_config`, `report_config`, `analysis_settings`, `dashboard_widget_order` ne sont **jamais** créées ; le `PUT` générique renvoie 404 si la ligne n'existe pas (`server/index.ts:470`).
- **Impact métier :** seuil de validation DZD, matrice SLA, mode urgent, prompt IA, configuration PDF, ordre des widgets → **aucune persistance serveur**. Le front masque l'échec (`.catch(console.error)` dans `createDataSlice.ts:390-402` et `createAnalysisSlice.ts:49`) et affiche un succès.
- **Correctif :** `INSERT … ON CONFLICT(id) DO UPDATE` (upsert) dans le `PUT` générique ; amorçage **par clé** (vérification d'existence individuelle) ; remonter les erreurs via un toast UI.

---

## 3. Sécurité

### P1-1 — Fuite du hash de mot de passe via `GET /api/me`

- **Preuve live :** `ME_HAS_password_hash: True`.
- **Cause :** `res.json(JSON.parse(userRow.data))` (`server/index.ts:216`) renvoie le JSON brut, alors que `ensureUserPasswordHashes()` (`server/index.ts:84-100`) **écrit `password_hash` dans `data`** — vérifié en base sur les **8 utilisateurs** (`jsonHash=LEAKED_IN_DATA`).
- **Impact :** appelé à **chaque démarrage** du front (`src/App.tsx:168`), puis **persisté en localStorage** (`src/store/useStore.ts:110`) → exfiltrable via XSS, cracking hors ligne.
- **Correctif :** réutiliser `formatRowResponse('users', …)` (qui supprime le hash) ; ne plus stocker le hash dans `data`.

### P1-2 — `GET /api/users` ouvert à tous les rôles et exposant les secrets SMTP

- **Preuve live :** en Collaborateur → `200`, clés retournées `id,email,name,role,department,position,phone,themePreference,avatar,notificationPreferences,smtpSettings,siteId`.
- **Cause :** `setupCrudRoutes('users', [...], ['admin'])` ne protège que **les écritures** (`server/index.ts:372-373` et `:519`) ; `formatRowResponse` ne retire que `password_hash` (`server/index.ts:321-334`) ; `smtpSettings.pass` est stocké **en clair** (`src/pages/Profile.tsx:511`, `src/types/index.ts:96-102`).
- **Impact :** tout compte authentifié lit les coordonnées et **identifiants SMTP de tous les collègues**.
- **Correctif :** `GET` limité à soi-même / son périmètre, projection de champs, exclusion des secrets, chiffrement au repos.

### P1-3 — Création d'utilisateur = backdoor au mot de passe par défaut

- **Preuve live (base neuve) :** `POST /api/users` → **201** ; `POST /api/login` (`password123`) → **401** ; **après redémarrage du serveur** → **200**.
- **Cause :** la création d'utilisateur ne définit aucun mot de passe ; au démarrage, `ensureUserPasswordHashes()` (`server/index.ts:87`) attribue **`password123` à tout compte sans hash**.
- **Impact :** identifiants universels et prévisibles (`IDENTIFIANTS.md` les documente en clair).
- **Correctif :** mot de passe obligatoire (ou lien d'activation) à la création, suppression du remplissage par défaut, politique de complexité + `mustChangePassword`.

### P1-4 — RBAC incohérent entre backend, frontend, tests et documentation

- **Preuve live (base saine) :** `POST /api/tasks` avec un token **Collaborateur** → **201**, alors que `server/tests/rbac.test.ts:127-138` attend `403` et que `APP_INFO.md:37` documente « Employé : accès à ses propres tâches ». Cause : `setupCrudRoutes('tasks', …, ['admin','manager','collaborateur'])` et `requireRole` qui laisse passer l'égalité exacte (`server/index.ts:282-288`).
- **Preuve live :** `PUT /api/users/<soi-même>` en Collaborateur → **403** ; `requireRole('admin')` n'autorise que le rôle Admin strictement (`server/index.ts:285`) → **aucun non-admin ne peut modifier son profil** (nom, téléphone, SMTP, préférences) ; l'UI simule un succès (`src/pages/Profile.tsx:112` + `setTimeout`).
- **Frontend :** `DEFAULT_PERMISSIONS` (`src/store/slices/createPermissionsSlice.ts:15-104`) accorde **tous les droits à tous les rôles**, y compris `modules.admin: true` aux Collaborateurs → la garde `ModuleRoute` (`src/App.tsx:43-64`) ne bloque rien ; la matrice de permissions n'est **jamais persistée côté serveur** → non appliquée.
- **Correctif :** politique unique côté serveur (rôle → ressource), endpoint `/api/users/me` pour l'auto-édition, retirer `modules.admin` des rôles non admin, réconcilier tests et documentation.

### P1-5 — Notifications non cloisonnées

- **Preuve live :** `GET /api/notifications` en Collaborateur → `200`, `count=2`, `userIds=user_admin_001,u2` (notifications d'autrui).
- **Cause :** `setupCrudRoutes('notifications', ['userId'])` sans filtre `req.user` (`server/index.ts:530`) ; `PUT`/`DELETE` également ouverts → lecture **et** modification/suppression des notifications d'autrui.
- **Correctif :** filtrage serveur par `req.user.id`, interdiction d'écriture sur les notifications d'autrui.

### P1-6 — JWT accepté dans l'URL

- **Preuve live :** `GET /api/users?token=<jwt>` → `200` (`server/index.ts:188-190`) ; utilisé par `new EventSource('/api/stream?token=')` (`src/App.tsx:79`).
- **Impact :** JWT valable 24 h tracé dans les logs Nginx/Express, l'historique navigateur et le `Referer` → rejeu de session.
- **Correctif :** cookie `httpOnly` + `SameSite` (ou ticket SSE court à usage unique) ; refuser le token en query string.

### P1-7 — Endpoints IA sans contrôle de rôle, sans quota, sans validation

- `POST /api/refresh_supplier_info` et `POST /api/refresh_all_suppliers` (`server/index.ts:658-687`) : **pas de `requireRole`**, **pas de rate-limit** → tout utilisateur authentifié peut déclencher des appels Gemini facturés et réécrire les fournisseurs globaux ; `name`/`specs` sont injectés dans le prompt sans validation `zod` (injection de prompt).
- **Aggravant :** `GEMINI_API_KEY=YOUR_GEMINI_API_KEY` (`.env.local:2`) → l'échec d'appel déclenche le **fallback silencieux** qui génère de faux fournisseurs (`server/aiService.ts:134+`) présentés comme des résultats de sourcing réel.
- **Correctif :** rôle + limiter dédié + validation `zod` + mode démo explicite (bandeau « données simulées »).

### P1-8 — Hygiène API et durcissement

- `GET /api/unknown_endpoint` → **200 `text/html`** : le catch-all SPA (`server/index.ts:698`) capture les routes API inconnues → plus de 404 JSON fiable.
- `express.json()` **sans limite de taille** (`server/index.ts:42`) ; CSP Helmet avec `'unsafe-inline'` / `'unsafe-eval'` (`server/index.ts:31`) ; SSE **broadcast global** (tous les clients reçoivent tous les événements, y compris les tâches et fournisseurs d'autrui).
- Aucun log structuré, pas de `graceful shutdown`, SSE en mémoire (mono-instance uniquement).

---

## 4. Tests, qualité et outillage

### P2-1 — Tests : 2 échecs et absence d'isolation

- `npx vitest run` → `Tests 2 failed | 34 passed (36)` ; les 2 échecs correspondent à P0-1 et P0-2.
- **Aucun `DB_PATH` de test** : les tests écrivent dans la **base de dev/prod** (`server/db.ts:7`).
- `server/tests/security.test.ts:96-103` déclenche une **vraie campagne IA en tâche de fond** (`runProcurementCampaign` fire-and-forget, `server/index.ts:554`) → appels réseau et écritures asynchrones **après** la fin des tests (logs observés : « Appel à Gemini en cours… »), source de flakiness et de pollution.
- **Couverture très faible** : 4 tests backend (auth, RBAC, headers, SQL) + 1 test frontend (`src/utils/sla.test.ts` sur `workflowLinter`). Rien sur les slices Zustand (`createTaskSlice`), les composants, la génération PDF, le sourcing IA.
- **Correctif :** base temporaire par exécution, mock de `aiService`, tests CRUD complets, seuils de couverture.

### P2-2 — ESLint inopérant (faux sentiment de qualité)

- `npx eslint .` → 0 erreur / 0 warning sur 115 fichiers, alors que le code contient de nombreux `any` et même des commentaires `// eslint-disable-next-line @typescript-eslint/no-explicit-any` (`src/store/slices/createDataSlice.ts:52`).
- `npx eslint --print-config …` → **`parser: undefined`** : les règles TypeScript ne s'exécutent jamais.
- **Cause :** configuration plate mal formée (`eslint.config.js:7-23` : `files` + `extends` dans un même objet au lieu d'un `tseslint.config(js.configs.recommended, ...tseslint.configs.recommended, { files: [...] })`), et périmètre limité à `src/**` (le serveur n'est pas linté).
- **Correctif :** réécrire la configuration, couvrir `server/**`, ajouter `lint` au pipeline.

### P2-3 — Lockfile désynchronisé et dépendances mal placées

- `package-lock.json` déclare **2 dépendances absentes** de `package.json` : **`react-is`**, **`zustand-persist`** (comparaison programmatique des deux fichiers) → `npm ci` (standard CI/Docker) échoue ; `zustand-persist` n'est **importé nulle part**.
- `vite` déclaré **deux fois** (`package.json:52` en dependencies et `:80` en devDependencies).
- `shadcn` (CLI), `jsdom`, `supertest`, `@types/*`, `@vitejs/plugin-react` placés en `dependencies` alors que ce sont des outils de développement.
- Script `clean` en `rm -rf` (non portable Windows) ; aucune CI (`.github/workflows` absent) ni script de migration versionné.

### P2-4 — Dépôt Git non initialisé

- `git rev-list --count HEAD` → `fatal: ambiguous argument 'HEAD'` : **aucun commit**, tous les fichiers sont en index (`A`).
- **2 binaires SQLite stagés** : `puma_database.sqlite-shm`, `puma_database.sqlite-wal` (`.gitignore:11-12` couvre `*.sqlite` mais pas `-wal`/`-shm`).
- Aucun fichier `LICENSE` malgré l'en-tête SPDX Apache-2.0 (`src/App.tsx:1-4`). Point positif : `.env.local` est bien ignoré.
- **Correctif :** premier commit, retirer les sidecars, `.gitignore` → `*.sqlite*`, tag de version, licence.

---

## 5. Documentation

| Document | Anomalie |
| --- | --- |
| `README.md:21` | `node server/seed.js` → **fichier inexistant** (c'est `server/seed.ts`) ; aucune étape `.env.local` / `JWT_SECRET` alors que le serveur **refuse de démarrer** sans ce secret (`server/index.ts:78-80`) |
| `documentation/02_installation.md` | Installation OK, mais ne mentionne ni `.env.local`, ni le port 3001 pour l'API |
| `documentation/03_lancement_quotidien.md` | Correct sur `npm run dev` ; mentionne `npx tsx server/seed.ts` (OK) |
| `documentation/04_architecture_technique.md` | « Vanilla CSS » alors que le projet utilise **Tailwind 4** ; ne mentionne ni JWT, ni Helmet, ni rate-limiting |
| `documentation/05_deploiement_production.md:29` | `node server/index.js` → **inexistant** (le projet s'exécute via `tsx`), pas de `npm ci`, pas de variables d'environnement |
| `documentation/06_docker.md:63` | `npx tsx server/seed.ts` ne crée que `admin@puma.com` **sans mot de passe** (contredit `PumaAdmin2026!`) ; la « sauvegarde à la racine du projet » contredit le volume `./database` ; l'UID/`chown` du volume n'est pas traité |
| `APP_INFO.md:46,48` | Cite **react-big-calendar** (non installé) et **Radix UI** (le projet utilise `@base-ui/react`), « Vanilla CSS » (Tailwind 4), noms d'utilisateurs différents de `IDENTIFIANTS.md` |
| `IDENTIFIANTS.md:3` | « authentification simulée » alors que bcrypt + JWT sont en place |
| — | **Aucune documentation d'API** (endpoints, rôles requis, schémas, codes d'erreur) ni de schéma de données formel |

---

## 6. Déploiement et maintenabilité

### Docker / Nginx

- `Dockerfile:10` utilise `npm install` (au lieu de `npm ci`) : builds non déterministes et lockfile désynchronisé non détecté.
- `Dockerfile:25` copie **tout `node_modules`** (devDependencies incluses) dans l'image runtime → image inutilement volumineuse.
- `Dockerfile:34` exécute la production via `npx tsx server/index.ts` (transpilation à chaud, dépendance de développement requise en production).
- **`nginx.conf` est un fichier mort** : `docker-compose.yml` ne déclare aucun service `nginx` (Express sert les statiques) ; `gzip_types` n'inclut pas `application/javascript`.
- `docker-compose.yml:17` embarqule un `JWT_SECRET` par défaut en clair.

### Architecture backend

- **Monolithe** : `server/index.ts` (710 lignes) concentre routes, schémas `zod`, RBAC, SSE, e-mails et factory CRUD ; pas de routers/services/repositories.
- **Modèle « JSON + colonnes typées » dupliqué** (double source de vérité) → désynchronisation déjà matérialisée (cf. P0-1).
- **3 mécanismes de migration divergents** : `db.ts:104-251` (snake_case, idempotent), `server/migrate_db.ts` (écrit des colonnes **camelCase obsolètes**), `server/seed.ts` (admin seul) — plus `scratch/check_db.js`, `scratch/check_settings.js` hors sujet.
- `server/db.ts:504-516` : prompts IA par défaut **dupliqués** dans le frontend (`src/store/slices/createDataSlice.ts`).

### Frontend / store Zustand

- **Fichiers trop volumineux** : `src/pages/Procurement/index.tsx` **1111 l.**, `TaskDetailsModal.tsx` 672, `VisualWorkflowBuilder.tsx` 612, `Dashboard.tsx` 549, `createTaskSlice.ts` 566, `Profile.tsx` 525.
- **Mutations optimistes systématiquement silencieuses** : `catch(console.error)` dans ~15 endroits (`createDataSlice.ts:309-403`, `createAnalysisSlice.ts`, `createNotificationSlice.ts:27-47`) → l'UI affiche un succès même en cas d'échec serveur.
- `currentUser` (incluant `smtpSettings.pass`) **persisté en localStorage** (`useStore.ts:103-121`).
- Redondance `objective.blocks` / `objective.workflow` ; `initializeStore` recharge tout à chaque démarrage puis applique des règles SLA/récurrence côté client (`useStore.ts:126-210`), logique métier qui devrait être serveur.
- Poids du bundle : `Dashboard` 422 kB (121 kB gzip), `jspdf-autotable` 421 kB, `index` 354 kB, `Settings` 245 kB — `dist` total 2,7 Mo.

---

## 7. Points forts (à préserver)

1. **Architecture full-stack claire** : React 19 + Vite 6 + Zustand ↔ Express 4 + `better-sqlite3` ; typage TypeScript qui compile et build reproductible.
2. **Aucune injection SQL** : 100 % de requêtes préparées (`db.prepare`), y compris dans la factory CRUD générique.
3. **Bases de sécurité présentes** : Helmet, rate-limiting (login 10/15 min, IA 30, e-mail 20), bcrypt (10 rounds), JWT signé avec expiration, validation `zod` sur les écritures, `password_hash` exclu de `/api/login` et `GET /api/users`.
4. **Temps réel robuste** : SSE avec heartbeat 25 s, purge des clients morts, reconnexion client automatique (5 s), événements ciblés pour les notifications.
5. **Base de données** : WAL + `synchronous=NORMAL` + index de performance + contraintes de clés étrangères.
6. **Qualité produit** : lazy loading par page, `ErrorBoundary`, Suspense, design system cohérent, PDF généré à la demande, drag & drop Kanban.
7. **Outillage** : `.env.example`, Prettier, scripts npm cohérents, Docker multi-stage opérationnel, `nginx.conf` prêt pour SPA + SSE, documentation pédagogique accessible aux non-développeurs.
8. **Audit non destructif** : aucune donnée métier modifiée (comptages base identiques avant/après).

---

## 8. Plan d'action priorisé

### Sprint 0 — Déblocage (estimation 1 jour)

| # | Action | Fichiers concernés |
| --- | --- | --- |
| 1 | Migration de reconstruction de la table `tasks` (nouvelle table + backfill depuis `data` + `DROP`/`RENAME`), versionnée et idempotente | `server/db.ts` + `server/migrations/` |
| 2 | `upsert` (`INSERT … ON CONFLICT DO UPDATE`) sur le `PUT` générique | `server/index.ts:443-501` |
| 3 | Amorçage des paramètres **clé par clé** (au lieu du comptage global) | `server/db.ts:445-527` |
| 4 | Retirer `password_hash` de `GET /api/me` | `server/index.ts:212-220` |
| 5 | Restreindre `GET /api/users` (soi-même / admin) et masquer `smtpSettings` | `server/index.ts:376-407`, `:519` |
| 6 | Rollback + message d'erreur sur la création de tâche | `src/store/slices/createTaskSlice.ts:200-203` |

### Sprint 1 — Sécurité et cohérence RBAC (2-3 jours)

| # | Action | Fichiers concernés |
| --- | --- | --- |
| 7 | Mot de passe obligatoire à la création d'utilisateur ; supprimer l'attribution automatique de `password123` | `server/index.ts:84-100`, `:519`, `src/components/UserModal.tsx` |
| 8 | Politique RBAC unique côté serveur + endpoint `/api/users/me` (auto-édition du profil) | `server/index.ts:274-296`, `:519`, `src/pages/Profile.tsx` |
| 9 | Retirer `modules.admin` (et autres droits excessifs) aux rôles non admin ; persister la matrice côté serveur | `src/store/slices/createPermissionsSlice.ts:15-104` |
| 10 | Cloisonner les notifications par utilisateur (GET/PUT/DELETE) | `server/index.ts:530` |
| 11 | Supprimer le token JWT en query string (cookie `httpOnly` ou ticket SSE) | `server/index.ts:188-190`, `src/App.tsx:79` |
| 12 | Rôles + limiter + validation `zod` sur les endpoints IA ; désactiver le fallback silencieux | `server/index.ts:658-687`, `server/aiService.ts:134+` |
| 13 | 404 JSON pour les routes `/api/*` inconnues ; limiter `express.json({ limit })` | `server/index.ts:42`, `:693-700` |
| 14 | Rotation du `JWT_SECRET` et de la clé Gemini ; secrets par environnement | `.env.local`, `.env.example`, `docker-compose.yml:17` |

### Sprint 2 — Qualité et industrialisation (2-3 jours)

| # | Action | Fichiers concernés |
| --- | --- | --- |
| 15 | Base de test isolée (`DB_PATH` temporaire) + mock de `aiService` | `vite.config.ts:26-50`, `server/tests/*` |
| 16 | Réparer ESLint (parser TS effectif, périmètre `src` + `server`) et l'exécuter en CI | `eslint.config.js` |
| 17 | Resynchroniser `package-lock.json`, déplacer les devDependencies, `npm ci` en Docker | `package.json`, `package-lock.json`, `Dockerfile` |
| 18 | Première livraison Git : commit initial, retrait des binaires SQLite, `*.sqlite*` dans `.gitignore`, tag | `.gitignore`, dépôt Git |
| 19 | Pipeline CI : `install → lint → tsc → test → build` | `.github/workflows/ci.yml` (à créer) |
| 20 | Tests manquants : CRUD complet, slices Zustand, RBAC par ressource, PDF | `server/tests/`, `src/**/*.test.ts` |

### Sprint 3 — Documentation et dette technique (3 jours)

| # | Action | Fichiers concernés |
| --- | --- | --- |
| 21 | Corriger README/docs (`seed.ts`, `.env.local` + `JWT_SECRET`, `tsx`, Docker, sauvegarde) | `README.md`, `documentation/05`, `documentation/06`, `APP_INFO.md`, `IDENTIFIANTS.md` |
| 22 | Documenter l'API (endpoints, rôles, schémas, erreurs) et le modèle de données | `documentation/07_api.md` (à créer) |
| 23 | Découper les fichiers > 600 lignes (routers Express, modules React) | `server/index.ts`, `src/pages/Procurement/index.tsx`, … |
| 24 | Dédupliquer les défauts métier (prompts IA, blocs fonctionnels) entre store et backend | `server/db.ts`, `src/store/slices/createDataSlice.ts` |
| 25 | Décider du sort de `nginx.conf` (service `nginx` dédié) ou le supprimer | `docker-compose.yml`, `nginx.conf` |

---

## 9. Traçabilité des constats

| ID | Sévérité | Constat | Statut |
| --- | --- | --- | --- |
| P0-1 | 🔴 Bloquant | Création de tâche en `500` (schéma `tasks` legacy) | Confirmé en direct |
| P0-2 | 🔴 Bloquant | Paramètres non persistés (`PUT` → `404`) | Confirmé en direct |
| P1-1 | 🟠 Critique | `password_hash` exposé par `/api/me` | Confirmé en direct |
| P1-2 | 🟠 Critique | `GET /api/users` ouvert + secrets SMTP exposés | Confirmé en direct |
| P1-3 | 🟠 Critique | Mot de passe par défaut attribué aux nouveaux comptes après redémarrage | Confirmé en direct |
| P1-4 | 🟠 Majeur | RBAC incohérent (collaborateur ↔ tâches, auto-édition profil bloquée, front permissif) | Confirmé en direct |
| P1-5 | 🟠 Majeur | Notifications non cloisonnées | Confirmé en direct |
| P1-6 | 🟠 Majeur | JWT accepté en query string | Confirmé en direct |
| P1-7 | 🟠 Majeur | Endpoints IA sans rôle/quota/validation + fallback silencieux | Analyse de code + logs |
| P1-8 | 🟡 Modéré | Hygiène API (catch-all, CSP, SSE global, JSON non borné) | Confirmé en direct |
| P2-1 | 🟡 Modéré | 2 tests en échec, base de test non isolée, appels IA pendant les tests | Confirmé par exécution |
| P2-2 | 🟡 Modéré | ESLint inopérant | Confirmé par `--print-config` |
| P2-3 | 🟡 Modéré | Lockfile désynchronisé, dépendances mal classées, pas de CI | Confirmé par comparaison |
| P2-4 | 🟡 Modéré | Git sans commit, binaires SQLite suivis | Confirmé |
| P2-5 | 🟡 Modéré | Documentation obsolète/inexacte | Analyse documentaire |
| P3-1…n | 🔵 Mineur | Monolithe, fichiers volumineux, mutations silencieuses, poids du bundle | Analyse de code |

---

## 10. Annexes

### A. Reproductibilité des constats

```powershell
# Qualité
npx tsc --noEmit
npx eslint . -f json
npx vitest run
npm run build

# API (serveur lancé via : npx tsx server/index.ts)
$t = (Invoke-RestMethod -Method Post http://localhost:3001/api/login -ContentType 'application/json' `
      -Body '{"email":"zakaria.b@puma.com","password":"password123"}').token

# La fuite de hash sur /api/me
Invoke-WebRequest http://localhost:3001/api/me -Headers @{Authorization="Bearer $t"}

# La création de tâche en 500
Invoke-WebRequest -Method Post http://localhost:3001/api/tasks -Headers @{Authorization="Bearer $t"} `
  -ContentType 'application/json' `
  -Body '{"id":"probe","siteId":"s1","assigneeId":"u5","status":"Nouveau","title":"Probe"}' -SkipHttpErrorCheck

# Le 404 sur les paramètres
Invoke-WebRequest -Method Put http://localhost:3001/api/settings/global_rules -Headers @{Authorization="Bearer $t"} `
  -ContentType 'application/json' -Body '{"id":"global_rules","urgentModeSlaHours":4}' -SkipHttpErrorCheck

# Le token accepté en query string
Invoke-WebRequest "http://localhost:3001/api/users?token=$t" -SkipHttpErrorCheck

# Le schéma réel de la table tasks
node -e "const D=require('better-sqlite3');const db=new D('puma_database.sqlite',{readonly:true});console.log(db.prepare('select sql from sqlite_master where name=?').get('tasks').sql)"
```

### B. Contexte d'exécution

- Toutes les sondes ont été exécutées en local, contre le serveur de développement (port 3001) ou sur des bases temporaires isolées (`%TEMP%`, ports 3011/3012) supprimées après usage.
- **Aucune donnée métier n'a été modifiée** : les comptages `users / sites / tasks / settings / notifications / procurement_suppliers / global_suppliers` sont identiques avant et après l'audit (`8 / 6 / 9 / 1 / 2 / 12 / 12`).
- Le dossier `dist/` a été **reconstruit** par `npm run build` (dossier ignoré par Git) afin de valider le build de production.
- Un `npm ci --dry-run` lancé pour vérifier le lockfile n'a produit aucune écriture et peut être interrompu (`Ctrl+C`).

### C. Recommandations de suivi

1. Bloquer la mise en production tant que **P0-1** et **P0-2** ne sont pas corrigés **et couverts par des tests**.
2. Traiter **P1-1 à P1-3** comme des incidents de sécurité : rotation de `JWT_SECRET`, invalidation des sessions, information des utilisateurs concernés.
3. Mettre en place une CI (`lint + tsc + test + build`) avant toute nouvelle fonctionnalité.
4. Rejouer cet audit après correction (mêmes commandes, annexe A) pour vérifier la fermeture des constats.
5. Conserver ce document comme référence des décisions : chaque correctif doit référencer son ID (P0-1, P1-2, …) dans le message de commit.


