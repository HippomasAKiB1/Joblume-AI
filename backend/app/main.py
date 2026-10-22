from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sentry_sdk
import structlog
from app.core.config import settings
from app.core.logging_config import init_logging
from app.db.database import init_db
from app.routers import auth, users, resumes, ai, applications, admin

# Initialize structured logging
init_logging()
logger = structlog.get_logger(__name__)

# Initialize Sentry SDK before FastAPI app creation
if settings.SENTRY_DSN_BACKEND:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN_BACKEND,
        environment=settings.ENVIRONMENT,
        traces_sample_rate=0.1,
        send_default_pii=False,  # DO NOT send user PII to Sentry
    )
    logger.info("Sentry initialized successfully", environment=settings.ENVIRONMENT)
else:
    logger.info("SENTRY_DSN_BACKEND is not set; skipping Sentry initialization")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: verify database connection
    await init_db()
    logger.info("Application startup complete")
    yield
    # Shutdown
    logger.info("Application shutdown complete")


app = FastAPI(
    title="JobLume AI API",
    description="AI-powered Resume & Job Application Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "https://joblume-ai.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(resumes.router)
app.include_router(ai.router)
app.include_router(applications.router)
app.include_router(admin.router)


@app.get("/")
async def root():
    return {"message": "JobLume AI API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/debug/sentry-test")
async def sentry_test():
    raise RuntimeError("sentry test")
