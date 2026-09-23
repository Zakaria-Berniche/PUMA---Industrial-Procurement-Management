# ==========================================
# Étape 1 : Construction (Build)
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Installation des dépendances
COPY package.json package-lock.json* ./
RUN npm install

# Copie du code et build du frontend
COPY . .
RUN npm run build

# ==========================================
# Étape 2 : Exécution (Runtime)
# ==========================================
FROM node:20-alpine

WORKDIR /app

# Copier uniquement le nécessaire pour l'exécution
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server

# Variable d'environnement pour le port
ENV PORT=3001
EXPOSE 3001

# Lancement du serveur Full-Stack via tsx (TypeScript runtime, pas besoin de compiler)
CMD ["npx", "tsx", "server/index.ts"]
