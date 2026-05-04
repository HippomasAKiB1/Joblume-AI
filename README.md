# 🌟 JobLume AI

**AI-Powered Resume Builder & Job Application Optimizer**

Build professional, ATS-friendly resumes, tailor them to any job description, generate cover letters, and track your applications — all powered by AI.

![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)

---

## ✨ Features

- 🤖 **AI Resume Builder** — Generate professional resume content with AI
- 🎯 **Job Tailoring AI** — Match your resume to any job description
- 📊 **ATS Scanner** — Get ATS compatibility scores with improvement tips
- ✉️ **Cover Letter Generator** — AI-powered tailored cover letters
- 🎨 **7+ Premium Templates** — Modern, Harvard, Europass, Creative & more
- 📋 **Application Tracker** — Track all your job applications
- 📥 **Export** — Download resumes as PDF or DOCX
- 🌙 **Dark Mode** — Beautiful light and dark themes
- 📱 **Responsive** — Works on desktop, tablet, and mobile

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (SQLite for dev) |
| Auth | JWT + bcrypt |
| AI | OpenRouter API (openrouter/auto) |
| Styling | Vanilla CSS (Custom Design System) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL (optional, SQLite works for dev)

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings
uvicorn app.main:app --reload --port 8000
```
Backend runs at `http://localhost:8000`

API docs at `http://localhost:8000/docs`

---

## 🔐 Environment Variables

```env
DATABASE_URL=sqlite+aiosqlite:///./joblume.db
JWT_SECRET=your-super-secret-key
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=openrouter/auto
FRONTEND_URL=http://localhost:5173
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login |
| GET | `/user/profile` | Get profile |
| PUT | `/user/profile` | Update profile |
| POST | `/resume/create` | Create resume |
| GET | `/resume/list` | List resumes |
| GET | `/resume/{id}` | Get resume |
| PUT | `/resume/{id}` | Update resume |
| DELETE | `/resume/{id}` | Delete resume |
| GET | `/resume/{id}/export/pdf` | Export PDF |
| GET | `/resume/{id}/export/docx` | Export DOCX |
| POST | `/ai/tailor-job` | Tailor resume to JD |
| POST | `/ai/generate-cover-letter` | Generate cover letter |
| POST | `/ai/ats-score` | ATS score analysis |
| POST | `/ai/upload-jd` | Upload JD file |
| POST | `/applications/create` | Add application |
| GET | `/applications/list` | List applications |

---

## 🚢 Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
```

### Backend → Render / Railway
Use the included `Dockerfile` and `Procfile`.

Set environment variables in your deployment dashboard.

### Database → Neon / Supabase
Update `DATABASE_URL` to your PostgreSQL connection string:
```
postgresql+asyncpg://user:password@host:5432/joblume
```

---

## 📄 License

MIT License — Built with ❤️ by JobLume AI Team