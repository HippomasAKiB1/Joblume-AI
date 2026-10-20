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
    """
    Verifies database connectivity without executing DDL statements.
    Schema management and evolutions are strictly managed via Alembic migrations.
    """
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    print("[+] Database connection verified successfully.")
