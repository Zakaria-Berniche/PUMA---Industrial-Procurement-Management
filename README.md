<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PUMA - Industrial Procurement Management

PUMA est une plateforme professionnelle de gestion des achats, approvisionnements et sourcing IA conçue pour le secteur industriel (Grupopuma).

Cette version inclut une architecture Full-Stack complète et sécurisée avec :
- **Frontend** : React 19, Vite, TailwindCSS v4, Zustand.
- **Backend** : Node.js, Express, Rate Limiting, Helmet, JWT, Bcrypt.
- **Database** : SQLite (`better-sqlite3` avec mode WAL et migrations automatiques).

## Lancement Local

**Prérequis :** Node.js 20+ installé.

1. **Installation des dépendances :**
   ```bash
   npm install
   ```

2. **Fichier d'environnement :**
   Copiez `.env.example` vers `.env.local` et définissez vos variables (`JWT_SECRET`, `GEMINI_API_KEY`).

3. **Lancement du serveur & frontend en simultané :**
   ```bash
   npm run dev
   ```

L'interface sera accessible sur `http://localhost:3000` et l'API sur `http://localhost:3001`.

## Tests & Linter

```bash
npm run test  # Lancement des 36 tests Vitest (Backend + Frontend)
npm run lint  # Validation ESLint et typage TypeScript (tsc)
npm run build # Compilation de production
```

## Documentation

Pour plus de détails, consultez le dossier [documentation/](./documentation/01_introduction.md).

