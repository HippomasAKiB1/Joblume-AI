import sys
import os
from logging.config import fileConfig
from sqlalchemy import pool, create_engine
from alembic import context

# Configure python search path to load application modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.config import settings
from app.db.database import Base
import app.models # Ensure models are initialized to metadata stack

config = context.config

def to_sync_driver_url(raw_url: str) -> str:
    """Force psycopg2 (v2) sync driver for Alembic migrations."""
    if "sqlite+aiosqlite" in raw_url:
        return raw_url.replace("sqlite+aiosqlite", "sqlite")
    for prefix in (
        "postgresql+asyncpg://",
        "postgresql+psycopg://",
        "postgresql+psycopg_async://",
        "postgresql+psycopg2://",
        "postgresql://",
        "postgres://",
    ):
        if raw_url.startswith(prefix):
            return "postgresql+psycopg2://" + raw_url[len(prefix):]
    return raw_url


# Prioritize direct connection for Alembic DDL migrations; bypass PgBouncer pooler
raw_target_url = settings.DIRECT_DATABASE_URL
if not raw_target_url:
    raw_target_url = settings.DATABASE_URL
    if "-pooler." in raw_target_url:
        raw_target_url = raw_target_url.replace("-pooler.", ".")

sync_db_url = to_sync_driver_url(raw_target_url)
config.set_main_option("sqlalchemy.url", sync_db_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = create_engine(
        config.get_main_option("sqlalchemy.url"),
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True # Necessary for proper SQLite ALTER operations
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
