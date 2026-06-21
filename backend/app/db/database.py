from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings


engine = create_async_engine(
    settings.DATABASE_URL,
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
