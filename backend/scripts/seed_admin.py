import sys
import os
import asyncio
from sqlalchemy import select

# Push backend root into sys path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.database import AsyncSessionLocal
from app.models.user import User
from app.auth.jwt_handler import get_password_hash

ADMIN_USERNAME = "hippomasakib"
ADMIN_PASSWORD = "REDACTED_ADMIN_PASSWORD"

async def seed_admin():
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
