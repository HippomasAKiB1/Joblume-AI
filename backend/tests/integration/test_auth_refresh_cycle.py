import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings


def test_auth_refresh_cycle():
    client = TestClient(app, base_url="http://testserver")

    # 1. Register a fresh test user
    uid = uuid.uuid4().hex[:8]
    email = f"cycle_{uid}@example.com"
    user_pass = f"P@ss_{uid}_T3st!"
    full_name = "Refresh Cycle Test"

    reg_resp = client.post(
        "/auth/register",
        json={"full_name": full_name, "email": email, "password": user_pass},
    )
    assert reg_resp.status_code == 200, reg_resp.text
    reg_data = reg_resp.json()
    assert "access_token" in reg_data
    assert "refresh_token" in client.cookies
    initial_cookie = client.cookies["refresh_token"]
    assert initial_cookie

    # 2. Call /auth/refresh with valid cookie -> new access token + rotated cookie
    refresh_resp = client.post("/auth/refresh")
    assert refresh_resp.status_code == 200, refresh_resp.text
    refresh_data = refresh_resp.json()
    assert "access_token" in refresh_data
    assert "refresh_token" in client.cookies
    rotated_cookie = client.cookies["refresh_token"]
    assert rotated_cookie != initial_cookie

    # 3. Theft detection: reuse old cookie after rotation -> 401 session invalidated
    theft_client = TestClient(app, base_url="http://testserver")
    theft_client.cookies.set("refresh_token", initial_cookie, path="/auth")
    theft_resp = theft_client.post("/auth/refresh")
    assert theft_resp.status_code == 401, theft_resp.text
    assert "invalidated" in theft_resp.json()["detail"].lower() or "reuse" in theft_resp.json()["detail"].lower()

    # Even the rotated cookie should now be invalid because session family was invalidated
    post_theft_resp = client.post("/auth/refresh")
    assert post_theft_resp.status_code == 401

    # 4. Call /auth/refresh with no cookie -> 401
    no_cookie_client = TestClient(app, base_url="http://testserver")
    no_cookie_resp = no_cookie_client.post("/auth/refresh")
    assert no_cookie_resp.status_code == 401
    assert "missing" in no_cookie_resp.json()["detail"].lower()

    # 5. Call /auth/refresh with mismatched Origin -> 403
    # Login again to get a fresh valid cookie
    login_resp = client.post(
        "/auth/login",
        json={"email": email, "password": user_pass},
    )
    assert login_resp.status_code == 200
    valid_cookie = client.cookies.get("refresh_token")

    mismatch_client = TestClient(app, base_url="http://testserver")
    mismatch_client.cookies.set("refresh_token", valid_cookie, path="/auth")
    origin_mismatch_resp = mismatch_client.post(
        "/auth/refresh",
        headers={"Origin": "https://malicious-attacker.com"},
    )
    assert origin_mismatch_resp.status_code == 403, origin_mismatch_resp.text
