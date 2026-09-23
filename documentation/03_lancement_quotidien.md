# Lancement Quotidien de l'Application

Maintenant que votre ordinateur possède l'environnement Node.js (cf module 02), le lancement du projet est extrêmement simple.

Il faut savoir que ce type d'application moderne ne se lance pas en double-cliquant sur un fichier `.exe` ! Elle se "sert" sur votre propre ordinateur via une adresse Web locale.

---

## Mettre l'application en route (Mode Développeur ou Local)

1. Ouvrez votre dossier projet dans **Visual Studio Code**.
2. Ouvrez le Terminal (menu `Terminal` > `Nouveau Terminal`).
3. Tapez la commande suivante :

   ```bash
   npm run dev
   ```

4. Appuyez sur **`Entrée`**.
5. **Nouveauté :** Cette commande lance maintenant **deux services** en même temps :
   - Le serveur d'interface (**Frontend**) sur `http://localhost:3000`.
   - Le serveur de données (**Backend API**) sur `http://localhost:3001`.

6. **Ne fermez surtout pas cette fenêtre**, sinon l'application et sa base de données s'arrêteront.

---

## Ouvrir l'application dans son navigateur

1. Ouvrez votre navigateur (Chrome de préférence).
2. Allez sur : **`http://localhost:3000/`**.
3. Le site chargera ses données depuis le serveur backend automatiquement.

---

## Gestion des Données (SQLite)

Contrairement aux versions précédentes, Puma utilise une véritable base de données stockée dans le fichier `puma_database.sqlite`.

- **Initialisation :** Si vous voulez repartir de zéro avec les comptes de démonstration officiels, tapez la commande suivante dans un nouveau terminal :
  ```bash
  npx tsx server/seed.ts
  ```
- **Persistance :** Toutes vos modifications (tâches créées, changements de profil) sont désormais permanentes et stockées sur le disque dur, pas seulement dans votre navigateur.

---

## Utilisation Fictive (Données et Comptes de Démo)

Le mot de passe pour TOUS les comptes est : **`password123`**

### Liste des Comptes de Tests :

- **Pôle Informatique :** `zakaria.b@puma.com` (Admin)
- **Direction Achat :** `hadi.k@puma.com` (Responsable Global)
- **Direction Générale :** `mehdi.t@puma.com` (Responsable Global)
- **Management Terrain :** `ramzy.l@puma.com` (Responsable Local - Sidi Bel Abbes)
- **Collaborateurs :** `imen.m@puma.com`, `kawter.a@puma.com`, `fatima.h@puma.com`
