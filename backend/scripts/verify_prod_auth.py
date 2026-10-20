import os
import sys
import json
import urllib.request
import http.cookiejar
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

BASE_URL = os.environ.get("PROD_API_URL", "https://joblume-ai.onrender.com")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://joblume-ai.vercel.app")
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "hippomasakib")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")


def run_checks():
    print(f"=== VERIFYING PRODUCTION AUTH: {BASE_URL} ===\n")

    # 1. GET /health
    print("1. GET /health:")
    req = urllib.request.Request(f"{BASE_URL}/health", headers={"User-Agent": "AuthVerifier/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(f"Status: {resp.status}")
            print(f"Body: {resp.read().decode()}\n")
    except Exception as e:
        print(f"FAILED /health: {e}\n")

    # 2. GET /docs
    print("2. GET /docs:")
    req = urllib.request.Request(f"{BASE_URL}/docs", headers={"User-Agent": "AuthVerifier/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(f"Status: {resp.status}\n")
    except Exception as e:
        print(f"FAILED /docs: {e}\n")

    # 3. POST /auth/login with admin credentials
    print("3. POST /auth/login (Admin Credentials):")
    if not ADMIN_PASSWORD:
        print("[!] ADMIN_PASSWORD environment variable is not set. Please set $env:ADMIN_PASSWORD or define it in backend/.env to run admin login test.\n")
        return

    login_payload = json.dumps({"email": ADMIN_USERNAME, "password": ADMIN_PASSWORD}).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}/auth/login",
        data=login_payload,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "AuthVerifier/1.0",
            "Origin": FRONTEND_URL,
        },
        method="POST",
    )

    initial_cookie = None
    access_token = None
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(f"Status: {resp.status}")
            raw_cookies = resp.headers.get_all("Set-Cookie") or []
            print(f"Set-Cookie: {raw_cookies}")
            body = json.loads(resp.read().decode())
            access_token = body.get("access_token")
            print(f"Access Token Prefix: {access_token[:25]}... (length {len(access_token)})")
            print(f"User: {body.get('user', {}).get('email')}, Admin: {body.get('user', {}).get('is_admin')}\n")

            for c in raw_cookies:
                if c.startswith("refresh_token="):
                    initial_cookie = c.split(";")[0].strip()
    except Exception as e:
        print(f"FAILED /auth/login: {e}\n")
        return

    if not initial_cookie:
        print("[!] No refresh_token cookie found in response.\n")
        return

    # 4. POST /auth/refresh with that cookie -> new rotated cookie
    print("4. POST /auth/refresh (Valid Cookie):")
    req = urllib.request.Request(
        f"{BASE_URL}/auth/refresh",
        headers={
            "Cookie": initial_cookie,
            "Origin": FRONTEND_URL,
            "User-Agent": "AuthVerifier/1.0",
        },
        method="POST",
    )
    rotated_cookie = None
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(f"Status: {resp.status}")
            raw_cookies = resp.headers.get_all("Set-Cookie") or []
            print(f"Rotated Set-Cookie: {raw_cookies}")
            body = json.loads(resp.read().decode())
            new_access_token = body.get("access_token")
            print(f"New Access Token Prefix: {new_access_token[:25]}...\n")

            for c in raw_cookies:
                if c.startswith("refresh_token="):
                    rotated_cookie = c.split(";")[0].strip()
    except Exception as e:
        print(f"FAILED /auth/refresh: {e}\n")
        return

    # 5. POST /auth/refresh with the OLD cookie -> 401 (theft detection)
    print("5. POST /auth/refresh (Replay Old Cookie - Theft Detection):")
    req = urllib.request.Request(
        f"{BASE_URL}/auth/refresh",
        headers={
            "Cookie": initial_cookie,
            "Origin": FRONTEND_URL,
            "User-Agent": "AuthVerifier/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(f"Status: {resp.status}")
            print(f"Body: {resp.read().decode()}\n")
    except urllib.error.HTTPError as e:
        print(f"Expected Status: {e.code}")
        print(f"Response: {e.read().decode()}\n")
    except Exception as e:
        print(f"FAILED replay check: {e}\n")


if __name__ == "__main__":
    run_checks()
