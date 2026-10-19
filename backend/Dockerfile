FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Dépendances d'abord : cette couche reste en cache tant que requirements.txt ne change pas
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Code de l'application (.env, .venv, etc. sont exclus par .dockerignore)
COPY . .

# Ne pas faire tourner l'application en root
RUN useradd --create-home --uid 1000 appuser
USER appuser

EXPOSE 8000

# La configuration (POSTGRES_HOST, JWT_SECRET...) est fournie au lancement via -e / --env-file.
# Les migrations se lancent à part : docker run --rm ... helpdesk-backend alembic upgrade head
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
