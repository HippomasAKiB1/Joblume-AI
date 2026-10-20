# JobLume AI — Environment & Deployment Setup Guide

This document describes environment setup, configuration prerequisites, and post-deployment administrative procedures for JobLume AI.

---

## 1. Environment Variables Reference

The application requires the following environment variables. In production, configure these within your platform dashboard (e.g., Render, Vercel). Do **NOT** commit `.env` files or secrets to git.

### Backend Environment Variables (`backend/`)

| Variable Name | Description | Example / Recommended Value |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (asyncpg/psycopg2) | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | Secret key used to sign authentication JWTs | 40+ char cryptographically random string |
| `JWT_ALGORITHM` | Hashing algorithm for tokens | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifespan | `60` |
| `OPENROUTER_API_KEY` | OpenRouter API Key for AI resume operations | Dashboard-managed secret (`sync: false`) |
| `OPENROUTER_MODEL` | Default model identifier | `openrouter/auto` |
| `FRONTEND_URL` | Origin allowed for CORS | `https://joblume-ai.vercel.app` |
| `ADMIN_USERNAME` | (Optional) Admin email identifier | Defaults to `hippomasakib` |
| `ADMIN_PASSWORD` | Mandatory for running administrative seed script | Rotated strong credential |

---

## 2. Database Migrations & Initialization

- **Automatic Migrations:** On container startup, the backend automatically applies Alembic migrations via:
  ```bash
  alembic upgrade head
  ```
- **Driver Support:** The migration runner dynamically uses `psycopg2` via `to_sync_driver_url()` in `alembic/env.py`, while the FastAPI runtime uses `asyncpg` configured with SSL and pooled connection settings.

---

## 3. Provisioning the Administrator Account (Manual Step)

Administrative seeding is an explicit, one-time manual operation. The script is **no longer executed on container startup**, preventing automated password overrides during deployment cycles.

### To provision or update an administrator account:

#### On a live container (e.g., Docker / Kubernetes / Render Shell):
```bash
docker exec -it <container_id_or_name> sh -c "ADMIN_PASSWORD='<your-strong-password>' python scripts/seed_admin.py"
```

#### Locally or via remote shell:
```bash
ADMIN_PASSWORD="<your-strong-password>" python backend/scripts/seed_admin.py
```

### Safety Rules:
- In production (`ENVIRONMENT=production` or `RENDER=true`), `seed_admin.py` will fail loudly with a `RuntimeError` if `ADMIN_PASSWORD` is not explicitly provided.
- In local development, if `ADMIN_PASSWORD` is omitted, the script generates a secure ephemeral password, logs it once to stdout, and never persists it to disk.

---

## 4. Local Development Prerequisites

1. **Install Pre-Commit Hooks (Mandatory):**
   ```bash
   pre-commit install
   ```
   Ensures Gitleaks and token filters run automatically before every git commit.

2. **Backend Setup:**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
