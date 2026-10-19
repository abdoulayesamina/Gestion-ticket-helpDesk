# ---------- Étape 1 : construction de l'application ----------
FROM node:20-alpine AS build

WORKDIR /app

# Dépendances d'abord (cache) ; npm ci installe exactement les versions du package-lock.json
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# URL de l'API vue par le NAVIGATEUR, inscrite en dur dans le JavaScript au moment du build.
# À changer avec : docker build --build-arg VITE_API_URL=http://... .
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---------- Étape 2 : image finale, uniquement nginx + fichiers statiques ----------
FROM nginx:1.27-alpine

# Remplace la configuration par défaut pour gérer les routes React (F5 sur /tickets/3, etc.)
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
