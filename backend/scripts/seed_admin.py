import sys
import os
import secrets
import asyncio
from sqlalchemy import select

# Push backend root into sys path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.database import AsyncSessionLocal, init_db
from app.models.user import User
from app.auth.jwt_handler import get_password_hash

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "hippomasakib")
is_production = os.getenv("ENVIRONMENT", "").lower() == "production" or os.getenv("RENDER") == "true"

raw_password = os.getenv("ADMIN_PASSWORD")
if not raw_password:
    if is_production:
        raise RuntimeError(
            "FATAL SECURITY ERROR: ADMIN_PASSWORD environment variable must be set in production environments. "
            "Refusing to generate ephemeral credentials on live deployment."
        )
    raw_password = secrets.token_urlsafe(16)
    print("\n" + "=" * 70)
    print(f"[SECURITY] Generated ephemeral administrator password for '{ADMIN_USERNAME}':")
    print(f"           {raw_password}")
    print("           (Copy this now. It is never persisted in files or git.)")
    print("=" * 70 + "\n")

ADMIN_PASSWORD = raw_password

async def seed_admin():
    # Make sure database is initialized and tables exist
    print("[*] Initializing database schema...")
    await init_db()

    print(f"[*] Checking presence of administrator '{ADMIN_USERNAME}'...")
    async with AsyncSessionLocal() as db:
        # Detect if user already exists
        q = await db.execute(select(User).where(User.email == ADMIN_USERNAME))
        existing_user = q.scalar_one_or_none()

        if existing_user:
            print("[!] User already exists. Promoting and resetting password to ensure correctness.")
            existing_user.is_admin = True
            existing_user.password_hash = get_password_hash(ADMIN_PASSWORD)
            existing_user.full_name = "Akib (Admin)"
        else:
            print("[+] Provisioning fresh administrator record...")
            new_admin = User(
                full_name="Akib (Admin)",
                email=ADMIN_USERNAME,
                password_hash=get_password_hash(ADMIN_PASSWORD),
                is_admin=True,
                subscription_tier="premium"
            )
            db.add(new_admin)
        await db.commit()
        print("[OK] Successfully secured administrator record.")

if __name__ == "__main__":
    asyncio.run(seed_admin())
