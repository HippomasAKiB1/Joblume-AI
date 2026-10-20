import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Load backend/.env before importing FastAPI app
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Point to Neon staging if available in environment
staging_pooled = os.getenv("STAGING_POOLED_URL")
staging_direct = os.getenv("STAGING_DIRECT_URL")
if staging_pooled:
    os.environ["DATABASE_URL"] = staging_pooled
if staging_direct:
    os.environ["DIRECT_DATABASE_URL"] = staging_direct

if not os.getenv("RESEND_API_KEY"):
    os.environ["RESEND_API_KEY"] = "re_test_dummy"

import pytest
from sqlalchemy.pool import NullPool
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
import app.db.database as db_mod

# Configure NullPool for tests to prevent connection sharing across different event loops in TestClient
db_mod.DATABASE_URL, db_mod.CONNECT_ARGS = db_mod.normalize_database_url(os.environ["DATABASE_URL"])
db_mod.engine = create_async_engine(
    db_mod.DATABASE_URL,
    connect_args=db_mod.CONNECT_ARGS,
    poolclass=NullPool,
    echo=False,
    future=True,
)
db_mod.AsyncSessionLocal = async_sessionmaker(
    bind=db_mod.engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="session")
def client():
    with TestClient(app, base_url="http://testserver") as c:
        yield c
