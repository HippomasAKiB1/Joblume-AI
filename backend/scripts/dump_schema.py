import sys
import os
from sqlalchemy import create_engine, inspect, text

def to_psycopg2_url(raw_url: str) -> str:
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

def dump_schema(output_file: str, db_url: str = None):
    if not db_url:
        db_url = os.environ.get("STAGING_DIRECT_URL") or os.environ.get("DIRECT_DATABASE_URL")
    if not db_url:
        raise RuntimeError("STAGING_DIRECT_URL or DIRECT_DATABASE_URL environment variable must be set")

    engine = create_engine(to_psycopg2_url(db_url))
    inspector = inspect(engine)

    tables = sorted(inspector.get_table_names(schema="public"))
    lines = []
    lines.append("-- JobLume AI Schema Snapshot")
    lines.append(f"-- Schema: public | Tables count: {len(tables)}\n")

    with engine.connect() as conn:
        for table in tables:
            lines.append(f"-- Table: {table}")
            lines.append(f"CREATE TABLE {table} (")
            cols = inspector.get_columns(table, schema="public")
            col_defs = []
            for col in cols:
                name = col['name']
                t = str(col['type'])
                null_str = "NULL" if col['nullable'] else "NOT NULL"
                default_str = f" DEFAULT {col['default']}" if col.get('default') is not None else ""
                col_defs.append(f"    {name} {t} {null_str}{default_str}")

            # Primary Key
            pk = inspector.get_pk_constraint(table, schema="public")
            if pk and pk.get('constrained_columns'):
                col_defs.append(f"    CONSTRAINT {pk.get('name') or table + '_pkey'} PRIMARY KEY ({', '.join(pk['constrained_columns'])})")

            # Foreign Keys
            fks = inspector.get_foreign_keys(table, schema="public")
            for fk in fks:
                col_defs.append(f"    CONSTRAINT {fk.get('name')} FOREIGN KEY ({', '.join(fk['constrained_columns'])}) REFERENCES {fk['referred_table']} ({', '.join(fk['referred_columns'])})")

            # Unique Constraints
            uqs = inspector.get_unique_constraints(table, schema="public")
            for uq in uqs:
                col_defs.append(f"    CONSTRAINT {uq.get('name')} UNIQUE ({', '.join(uq['column_names'])})")

            lines.append(",\n".join(col_defs))
            lines.append(");\n")

            # Indexes
            indexes = inspector.get_indexes(table, schema="public")
            for idx in indexes:
                unique_str = "UNIQUE " if idx.get('unique') else ""
                lines.append(f"CREATE {unique_str}INDEX {idx['name']} ON {table} ({', '.join(idx['column_names'])});\n")

    engine.dispose()

    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"[OK] Dumped {len(tables)} tables to {output_file}")
    print(f"[OK] Total lines: {len(lines)}")
    print(f"[OK] Tables: {', '.join(tables)}")

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else r"C:\tmp\staging-schema-before.sql"
    url = sys.argv[2] if len(sys.argv) > 2 else None
    dump_schema(out, url)
