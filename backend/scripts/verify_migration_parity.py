#!/usr/bin/env python3
"""
Database Migration & Row Count Parity Verification Script
Compares table-by-table row counts between two database endpoints
(e.g., Supabase vs Neon Main, or Neon Main vs Neon Staging).
"""

import sys
import os
import argparse
from typing import Dict, List, Tuple
from sqlalchemy import create_engine, text, inspect
from urllib.parse import urlparse

# Tables required for Phase A validation
TARGET_TABLES = [
    "users",
    "resumes",
    "applications",
    "cover_letters",
    "ats_reports",
    "alembic_version",
]

def to_psycopg2_url(raw_url: str) -> str:
    """Ensures connection string uses psycopg2 synchronous driver and preserves/enforces sslmode=require."""
    if not raw_url:
        raise ValueError("Database URL cannot be empty")

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
            raw_url = "postgresql+psycopg2://" + raw_url[len(prefix):]
            break

    # Guarantee sslmode=require for remote postgres hosts if not already specified
    if "neon.tech" in raw_url or "supabase.co" in raw_url:
        if "sslmode=" not in raw_url:
            separator = "&" if "?" in raw_url else "?"
            raw_url += f"{separator}sslmode=require"

    return raw_url

def mask_url(url: str) -> str:
    """Masks database credentials for safe logging."""
    try:
        parsed = urlparse(url)
        netloc = parsed.netloc
        if "@" in netloc:
            creds, host = netloc.split("@", 1)
            user = creds.split(":")[0] if ":" in creds else creds
            netloc = f"{user}:***@{host}"
        return f"{parsed.scheme}://{netloc}{parsed.path}"
    except Exception:
        return "<masked-url>"

def get_row_counts(db_url: str) -> Dict[str, Tuple[int, bool]]:
    """
    Queries row counts for all target tables in the specified database within the 'public' schema.
    Returns dict mapping table_name -> (count, exists_flag).
    Non-existent tables return (0, False) gracefully without crashing.
    """
    conn_str = to_psycopg2_url(db_url)
    engine = create_engine(conn_str)
    counts = {}

    with engine.connect() as conn:
        inspector = inspect(engine)
        existing_tables = set(inspector.get_table_names(schema="public"))

        for table in TARGET_TABLES:
            if table in existing_tables:
                res = conn.execute(text(f'SELECT COUNT(*) FROM "{table}"'))
                counts[table] = (res.scalar() or 0, True)
            else:
                counts[table] = (0, False)  # Graceful fallback: 0 rows, marked absent

    engine.dispose()
    return counts

def main():
    parser = argparse.ArgumentParser(description="Verify database table row parity between source and target.")
    parser.add_argument("--source", default=os.getenv("SOURCE_DATABASE_URL") or os.getenv("DATABASE_URL"),
                        help="Source database URL (e.g. Supabase or Neon main)")
    parser.add_argument("--target", default=os.getenv("TARGET_DATABASE_URL") or os.getenv("STAGING_DATABASE_URL"),
                        help="Target database URL (e.g. Neon Staging)")
    parser.add_argument("--inspect-only", action="store_true",
                        help="Only inspect row counts on source database without comparing to a target.")
    args = parser.parse_args()

    if not args.source:
        print("[!] Error: Source database URL must be provided via --source or DATABASE_URL.")
        sys.exit(1)

    print("=" * 75)
    print(" JobLume AI — Database Migration Parity Audit")
    print("=" * 75)
    print(f"[*] Source Database: {mask_url(args.source)}")

    try:
        source_counts = get_row_counts(args.source)
    except Exception as e:
        print(f"[!] Error querying source database: {e}")
        sys.exit(1)

    if args.inspect_only or not args.target:
        print("\n--- Source Database Table Snapshot ---")
        print(f"{'Table Name':<20} | {'Row Count':<12}")
        print("-" * 35)
        for tbl in TARGET_TABLES:
            cnt, exists = source_counts.get(tbl, (0, False))
            cnt_str = str(cnt) if exists else "0 (not found)"
            print(f"{tbl:<20} | {cnt_str:<12}")
        print("=" * 75)
        if not args.target:
            print("[INFO] No target database specified. Supply --target to run comparative parity verification.")
        sys.exit(0)

    print(f"[*] Target Database: {mask_url(args.target)}")
    try:
        target_counts = get_row_counts(args.target)
    except Exception as e:
        print(f"[!] Error querying target database: {e}")
        sys.exit(1)

    print("\n" + "=" * 75)
    print(f"{'Table':<18} | {'Source':<10} | {'Target':<10} | {'Diff':<8} | {'Status'}")
    print("-" * 75)

    all_matched = True
    for tbl in TARGET_TABLES:
        s_cnt, s_exists = source_counts.get(tbl, (0, False))
        t_cnt, t_exists = target_counts.get(tbl, (0, False))

        s_str = str(s_cnt) if s_exists else "0 (absent)"
        t_str = str(t_cnt) if t_exists else "0 (absent)"

        if not s_exists and not t_exists:
            diff_str = "0"
            status = "MATCH (both absent)"
        elif s_exists != t_exists:
            diff_str = "N/A"
            status = "SCHEMA MISMATCH"
            all_matched = False
        else:
            diff = t_cnt - s_cnt
            diff_str = f"{diff:+d}" if diff != 0 else "0"
            if diff == 0:
                status = "MATCH [OK]"
            else:
                status = f"MISMATCH ({abs(diff)} rows)"
                all_matched = False

        print(f"{tbl:<18} | {s_str:<10} | {t_str:<10} | {diff_str:<8} | {status}")

    print("=" * 75)
    if all_matched:
        print("[SUCCESS] Full migration parity verified. 0 missing or mismatched rows.")
        sys.exit(0)
    else:
        print("[FAILURE] Migration parity check failed. Inspect table differences above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
