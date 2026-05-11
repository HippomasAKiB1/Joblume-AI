# JobLume AI

An end-to-end intelligent career management platform enabling users to generate highly tailored, ATS-optimized resumes and accompanying professional assets leveraging integrated large language models.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Core Features](#core-features)
4. [Technical Stack](#technical-stack)
5. [Local Development & Setup](#local-development--setup)
6. [Environment Configuration](#environment-configuration)
7. [API Documentation](#api-documentation)
8. [Subscription & Access Controls](#subscription--access-controls)
9. [Production Deployment](#production-deployment)
10. [License](#license)

---

## Project Overview

JobLume AI solves key challenges in the modern digital hiring landscape. Rather than traditional boilerplate management, it bridges technical analysis with generation algorithms. By recursively analyzing inputted Job Descriptions against dynamic Resume datasets, it calculates missing semantics, optimizes action verbs, and executes dynamic tailoring workflows, significantly lowering response rejection rates.

## System Architecture

The platform operates as a decoupled micro-architecture:
- **Client Environment:** An optimized SPA (Single Page Application) authored in TypeScript/React, utilizing scoped contexts for synchronized system state and responsive UI flows.
- **Application Server:** A distributed FastAPI service enforcing high-throughput asynchronous non-blocking interactions. Manages model interaction via OpenRouter routing, transaction validation via SQLAlchemy ORM, and safe token serialization.
- **Database Layer:** Relational storage tier supporting multi-tenant segmentation with native indexing for user metrics, documents, and analytical reports.

## Core Features

### Intelligent Synthesis
- **Contextual Resume Generation:** Structured templating systems capable of extrapolating dynamic markdown syntax into finalized design artifacts.
- **Bespoke Job Tailoring:** Semantic analysis engines parse specific external Job Descriptions and algorithmically mutate existing bullets to higher keyword parity.
- **Automated ATS Scoring:** Mathematical evaluations providing percentage ratings based on formatting reliability, keyword presence, and lexical densities.

### Workflow Management
- **Cover Letter Automation:** Direct generation of professional business vectors synced precisely to extracted JD context.
- **Application Surveillance:** Comprehensive lifecycle tracking board mapping user progression across "Applied", "Interviewing", "Offer", and "Archived" pipelines.
- **Exports & Artifacts:** High fidelity exports generating dynamic PDF outputs using consistent typography pipelines.

## Technical Stack

| Component | Integration | Description |
| :--- | :--- | :--- |
| **Frontend UI** | React 18 | Composable component library utilizing Hooks and Context patterns. |
| **Programming Language** | TypeScript | Explicit static typing ensuring contract stability across API vectors. |
| **Backend Server** | FastAPI | Asynchronous Python framework optimized for execution speed and security. |
| **Relational Database** | PostgreSQL | High-performance persistence supporting production deployments. |
| **AI Provider** | OpenRouter | LLM routing aggregate capable of directing tasks to auto-optimizing models. |
| **Security Layer** | PyJWT + Passlib | OAuth2 specification enforcing cryptographic password hashing. |
| **Design Utilities** | Vanilla CSS3 | Bespoke atomic-style design system without external dependency bloat. |

## Local Development & Setup

### Minimum Requirements
- Node.js Version 18.0.0 or greater
- Python Version 3.10 or greater
- Virtual Environment manager (`venv` / `conda`)

### 1. Frontend Implementation
```bash
# Enter distribution directory
cd frontend

# Resolve package manifest dependencies
npm install

# Launch localized execution server
npm run dev
```
Access via localhost: `http://localhost:5173`

### 2. Backend Implementation
```bash
# Enter service directory
cd backend

# Initialize localized virtual sandbox
python -m venv venv

# Activate sandbox context (Windows)
venv\Scripts\activate 

# Active sandbox context (macOS / Unix)
source venv/bin/activate

# Register requirements library
pip install -r requirements.txt

# Fire application execution engine
uvicorn app.main:app --reload --port 8000
```
Interactive REST documentation automatically generates at: `http://localhost:8000/docs`

## Environment Configuration

A valid `.env` file configuration is requested at the root of the backend subdirectory. Ensure appropriate credentials are supplied:

```ini
# Core Persistence URI
DATABASE_URL=sqlite+aiosqlite:///./joblume.db

# Cryptographic Hash Integrity
JWT_SECRET=YOUR_SECURE_NON_GUESSABLE_KEY
ACCESS_TOKEN_EXPIRE_MINUTES=60

# LLM Orchestration Parameters
OPENROUTER_API_KEY=YOUR_OPENROUTER_KEY
OPENROUTER_MODEL=openrouter/auto

# CORS Cross-Origin whitelisting targets
FRONTEND_URL=http://localhost:5173
```

## API Documentation

Major REST specification mappings established within the service container:

### Security & Users
- `POST /auth/register` — Account creation and automatic hash persistence.
- `POST /auth/login` — Token acquisition and verification.
- `POST /user/upgrade` — Dynamic subscription unlocking via secure phrase integration.

### Document Engines
- `POST /resume/create` — Core structure generation.
- `GET /resume/list` — Multi-tenant collection access.
- `GET /resume/{id}/export/pdf` — Raw bytes download generation.

### AI Operations
- `POST /ai/tailor-job` — Recursive tailoring calculation execution.
- `POST /ai/ats-score` — Resume parsing and static evaluation.
- `POST /ai/generate-cover-letter` — Asset drafting protocol.

## Subscription & Access Controls

The platform enforces specific role-based access tiers via standard `subscription_tier` metadata controls within the underlying SQL definitions.
- **Free Tier:** Standard creation and storage limitations.
- **Pro Tier:** Unlocks algorithmic modules including direct JD Tailoring, dynamic PDF analysis, and automated ATS evaluations.

*Note: Subscription transitions are currently authorized through pre-authorized validation phrases executed server-side.*

## Production Deployment

### Client Hosting (Vercel)
Recommended orchestration requires utilizing a Vercel dashboard pipeline pointed at the repository frontend root. Build configuration requirements:
- Build Command: `npm run build`
- Artifact Directory: `dist`
- Configuration requirement: Assign `VITE_API_URL` variable referencing target backend origin.

### Service Containerization (Render)
Recommended implementation involves utilizing defined Dockerfile configurations for unified deployment. 
- Platform: Docker Native Runtime
- Connection Hook: Expose relevant HTTP Port specified by platform metadata.
- Maintenance check: Configure root health check targeting `/health` endpoint.

---

## License

This system is distributed under formal private implementation guidance. Unauthorized duplication or execution without direct approval of the project creator is prohibited.