from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings


def normalize_database_url(raw_url: str) -> tuple[str, dict]:
    """
    Normalizes database connection strings for asyncpg.
    1. Converts postgres:// or postgresql:// to postgresql+asyncpg://
    2. Strips 'sslmode' and 'channel_binding' query parameters (not supported by asyncpg)
    3. Configures connect_args['ssl'] = 'require' if sslmode was requested or for Neon hosts
    4. Configures connect_args['prepared_statement_cache_size'] = 0 for Neon pooler endpoints
    """
    if not raw_url:
        raise ValueError("DATABASE_URL is not set")

    if not (raw_url.startswith("postgres://") or raw_url.startswith("postgresql://") or raw_url.startswith("postgresql+asyncpg://")):
        return raw_url, {}

    if raw_url.startswith("postgres://"):
        raw_url = "postgresql+asyncpg://" + raw_url[len("postgres://"):]
    elif raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+asyncpg://"):
        raw_url = "postgresql+asyncpg://" + raw_url[len("postgresql://"):]

    parsed = urlparse(raw_url)
    params = parse_qs(parsed.query)
    connect_args = {}
    had_sslmode = params.pop("sslmode", [None])[0]
    params.pop("channel_binding", None)

    if had_sslmode or "neon.tech" in (parsed.netloc or ""):
        connect_args["ssl"] = "require"
    if "-pooler." in (parsed.netloc or ""):
        connect_args["prepared_statement_cache_size"] = 0

    new_query = urlencode(params, doseq=True)
    return urlunparse(parsed._replace(query=new_query)), connect_args


DATABASE_URL, CONNECT_ARGS = normalize_database_url(settings.DATABASE_URL)

engine = create_async_engine(
    DATABASE_URL,
    connect_args=CONNECT_ARGS,
    echo=False,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


from sqlalchemy import text

async def init_db():
    import app.models  # Ensure all models are loaded onto Base.metadata
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # Baseline Alembic version so that it doesn't try to run migrations on a fresh schema
        try:
            await conn.execute(text(
                "CREATE TABLE IF NOT EXISTS alembic_version ("
                "   version_num VARCHAR(32) NOT NULL, "
                "   CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)"
                ")"
            ))
            # Check if there is already a version recorded
            result = await conn.execute(text("SELECT version_num FROM alembic_version"))
            row = result.first()
            if row is None:
                # No migration applied yet, record the baseline head revision
                await conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('4afc59cd58d6')"))
                print("[+] Baselined alembic migration history to head revision: 4afc59cd58d6")
        except Exception as e:
            print(f"[!] Warning: Failed to baseline alembic: {e}")

        # Resilient database backward compatibility migration logic for zero-downtime upgrade
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free'"))
        except Exception:
            # Soft fallback for non-PGSQL dialects/local SQLite without IF NOT EXISTS support
            try:
                await conn.execute(text("ALTER TABLE users ADD COLUMN subscription_tier VARCHAR(50) DEFAULT 'free'"))
            except Exception:
                pass # Already exists or not supported, continuing without halting service
