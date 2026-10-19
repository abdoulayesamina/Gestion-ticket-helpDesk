# HelpDesk

Application web de gestion de tickets de support technique. Elle sert de support aux exercices DevOps.

| Composant | Technologie | Dossier | Port par défaut |
|-----------|-------------|---------|-----------------|
| Frontend | React 18 + TypeScript + Vite | [frontend/](frontend/) | 5173 |
| Backend (API REST) | Python 3.11+ / FastAPI / SQLAlchemy 2 / Alembic | [backend/](backend/) | 8000 |
| Base de données | PostgreSQL 14+ | — | 5432 |

Le frontend, le backend et PostgreSQL sont trois composants séparés. Le frontend ne parle qu'à l'API, et l'API est le seul composant qui accède à PostgreSQL.

```
Navigateur ──► Frontend (Vite, :5173) ──HTTP/JSON──► API FastAPI (:8000) ──SQL──► PostgreSQL (:5432)
```

---

## Fonctionnalités

- Connexion par JWT avec des comptes de démonstration.
- Tableau de bord : nombre de tickets ouverts, en cours et résolus, répartition par priorité, tickets récents.
- Liste des tickets avec recherche plein texte et filtres par statut et par priorité. Les filtres sont gardés dans l'URL.
- Création, modification et suppression de tickets, et page de détail.
- Droits par rôle :
  - **Utilisateur** : voit et modifie uniquement ses propres tickets. Il ne peut pas changer le statut.
  - **Agent** : voit tous les tickets et peut changer leur statut.
  - **Administrateur** : peut tout faire, y compris supprimer n'importe quel ticket.
- Gestion des pannes :
  - si l'API est injoignable, si PostgreSQL est indisponible (réponse HTTP 503) ou si la session a expiré, l'interface affiche un message explicite avec un bouton « Réessayer » ;
  - un indicateur interroge `/ready` toutes les 30 secondes et affiche l'état du système.
- Interface en français, responsive, avec thème clair ou sombre selon le système.

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | `admin@helpdesk.local` | `admin123` |
| Agent support | `agent@helpdesk.local` | `agent123` |
| Utilisateur | `user@helpdesk.local` | `user123` |
| Utilisateur | `lucas@helpdesk.local` | `user123` |

Sur la page de connexion, il suffit de cliquer sur un compte pour se connecter.

---

## Prérequis

- **Python 3.11 ou plus récent**
- **Node.js 18 ou plus récent** (avec npm)
- **PostgreSQL 14 ou plus récent**, installé en local (sous Windows : installeur EDB, sous macOS : `brew install postgresql`, sous Debian/Ubuntu : `apt install postgresql`)

## 1. Préparer PostgreSQL

Créer un utilisateur et une base dédiés, par exemple avec `psql` connecté en superutilisateur `postgres` :

```sql
CREATE USER helpdesk WITH PASSWORD 'helpdesk';
CREATE DATABASE helpdesk OWNER helpdesk;
```

## 2. Lancer le backend

```bash
cd backend

# Environnement virtuel
python -m venv .venv
# Windows (PowerShell) :
.\.venv\Scripts\Activate.ps1
# Linux / macOS :
source .venv/bin/activate

pip install -r requirements.txt

# Configuration (modifier si besoin)
cp .env.example .env        # Windows : Copy-Item .env.example .env

# Création du schéma (migrations Alembic)
alembic upgrade head

# Données de démonstration (n'insère rien si la base contient déjà des utilisateurs)
python -m app.seed

# Démarrage de l'API avec rechargement automatique
uvicorn app.main:app --reload --port 8000
```

Une fois l'API démarrée :

- Swagger (documentation interactive) : <http://localhost:8000/docs>
- ReDoc : <http://localhost:8000/redoc>
- Liveness : <http://localhost:8000/health>
- Readiness : <http://localhost:8000/ready>

## 3. Lancer le frontend

```bash
cd frontend
npm install
cp .env.example .env        # Windows : Copy-Item .env.example .env
npm run dev
```

Ouvrir ensuite <http://localhost:5173>.

---

## Lancement avec Docker Compose

Les trois composants tournent dans des conteneurs. Les valeurs sensibles sont lues depuis `helpdesk/.env` (modèle : [.env.example](.env.example)).

```bash
# Une seule fois : le volume est déclaré "external", il doit exister
docker volume create helpdesk_data

docker compose up -d --build                          # construit et démarre db, backend, frontend
docker compose run --rm backend alembic upgrade head  # migrations (sans effet si déjà appliquées)
docker compose run --rm backend python -m app.seed    # données de démo (sans effet si déjà présentes)
```

- Frontend : <http://localhost:5173>
- API : <http://localhost:8000> (Swagger : <http://localhost:8000/docs>)
- PostgreSQL : `localhost:5432` (pour DBeaver)

```bash
docker compose ps              # état des services
docker compose logs -f backend # journaux du backend
docker compose down            # arrête et supprime les conteneurs (le volume et les données restent)
```

> Ne lancez pas en même temps `uvicorn` ou `npm run dev` à la main : ils utilisent les mêmes ports (8000 et 5173).

---

## Configuration

### Backend : [backend/.env.example](backend/.env.example)

| Variable | Défaut | Description |
|----------|--------|-------------|
| `DATABASE_URL` | *(vide)* | URL complète, par exemple `postgresql://user:pass@host:5432/db`. Si elle est définie, elle remplace les variables `POSTGRES_*`. Les schémas `postgres://` et `postgresql://` sont acceptés. |
| `POSTGRES_HOST` | `localhost` | Hôte PostgreSQL |
| `POSTGRES_PORT` | `5432` | Port PostgreSQL |
| `POSTGRES_USER` | `helpdesk` | Utilisateur |
| `POSTGRES_PASSWORD` | `helpdesk` | Mot de passe |
| `POSTGRES_DB` | `helpdesk` | Nom de la base |
| `DB_CONNECT_TIMEOUT` | `5` | Délai maximal (en secondes) pour se connecter à la base |
| `JWT_SECRET` | `change-me-in-production` | Clé de signature des jetons. **À changer.** |
| `JWT_EXPIRE_MINUTES` | `480` | Durée de validité d'une session |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Origines autorisées, séparées par des virgules |
| `LOG_LEVEL` | `INFO` | `DEBUG`, `INFO`, `WARNING` ou `ERROR` |

Les variables d'environnement du système ont priorité sur le fichier `.env`.

### Frontend : [frontend/.env.example](frontend/.env.example)

| Variable | Défaut | Description |
|----------|--------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | URL de l'API. Vite l'intègre au code au moment de `npm run dev` ou `npm run build`. |

> **Port 8000 déjà occupé ?** Lancez l'API sur un autre port (`--port 8010`, par exemple) et mettez `VITE_API_URL=http://localhost:8010` dans `frontend/.env`.

---

## Endpoints de l'API

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/health` | non | L'API répond (ne teste pas la base). Renvoie toujours 200. |
| GET | `/ready` | non | L'API et PostgreSQL répondent. Renvoie 200, ou 503 si la base est injoignable. |
| POST | `/api/auth/login` | non | Connexion, renvoie un jeton JWT |
| GET | `/api/auth/me` | oui | Utilisateur connecté |
| GET | `/api/tickets` | oui | Liste des tickets. Paramètres : `status`, `priority`, `q`, `limit`, `offset` |
| GET | `/api/tickets/stats` | oui | Compteurs pour le tableau de bord |
| POST | `/api/tickets` | oui | Création d'un ticket |
| GET | `/api/tickets/{id}` | oui | Détail d'un ticket |
| PUT | `/api/tickets/{id}` | oui | Modification d'un ticket (mise à jour partielle) |
| DELETE | `/api/tickets/{id}` | oui | Suppression d'un ticket |

Valeurs possibles :

- statut : `open`, `in_progress`, `resolved` ;
- priorité : `low`, `medium`, `high`, `critical`.

Toute erreur de connexion à PostgreSQL pendant une requête renvoie une réponse **503** :

```json
{ "detail": "La base de données est indisponible. Réessayez dans quelques instants.", "code": "DATABASE_UNAVAILABLE" }
```

---

## Migrations et données de démonstration

```bash
cd backend
alembic upgrade head                           # applique les migrations
alembic downgrade base                         # supprime tout le schéma
alembic revision --autogenerate -m "message"   # génère une migration après modification de app/models.py
alembic check                                  # vérifie que les modèles et les migrations correspondent

python -m app.seed            # insère les données de démo si la base est vide
python -m app.seed --reset    # vide les tables puis réinsère les données de démo
```

## Structure du projet

```
helpdesk/
├── backend/
│   ├── alembic/                  # Migrations de base de données
│   │   └── versions/0001_initial_schema.py
│   ├── alembic.ini
│   ├── app/
│   │   ├── main.py               # Application FastAPI, CORS, gestion des erreurs de base
│   │   ├── config.py             # Lecture des variables d'environnement (pydantic-settings)
│   │   ├── database.py           # Moteur SQLAlchemy et sessions
│   │   ├── models.py             # Modèles ORM (User, Ticket)
│   │   ├── schemas.py            # Schémas Pydantic (entrées et sorties de l'API)
│   │   ├── security.py           # Hachage des mots de passe (PBKDF2), JWT, utilisateur courant
│   │   ├── seed.py               # Données de démonstration
│   │   └── routers/              # health.py, auth.py, tickets.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                  # Client HTTP, gestion des erreurs, endpoints
│   │   ├── components/           # Layout, badges, formulaire, alertes, état système…
│   │   ├── context/              # AuthContext (session)
│   │   ├── pages/                # Connexion, tableau de bord, liste, détail, formulaires
│   │   ├── types.ts              # Types et libellés en français
│   │   └── index.css             # Styles (thème clair/sombre, responsive)
│   ├── package.json
│   └── .env.example
└── README.md
```

## Commandes utiles

| Commande | Où | Effet |
|----------|----|-------|
| `npm run dev` | frontend | Serveur de développement |
| `npm run build` | frontend | Vérification TypeScript, puis build de production dans `dist/` |
| `npm run preview` | frontend | Sert le build de production |
| `npm run typecheck` | frontend | Vérification TypeScript seule |
| `uvicorn app.main:app --host 0.0.0.0 --port 8000` | backend | Démarrage sans rechargement automatique (proche de la production) |
