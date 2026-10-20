import uuid
from fastapi.testclient import TestClient
from app.main import app


def test_auth_logout():
    client = TestClient(app, base_url="http://testserver")

    # 1. Register / login
    uid = uuid.uuid4().hex[:8]
    email = f"logout_{uid}@example.com"
    user_pass = f"P@ss_{uid}_T3st!"

    reg_resp = client.post(
        "/auth/register",
        json={"full_name": "Logout Tester", "email": email, "password": user_pass},
    )
    assert reg_resp.status_code == 200
    access_token = reg_resp.json()["access_token"]
    old_cookie = client.cookies.get("refresh_token")
    assert old_cookie

    # 2. Call /auth/logout
    logout_resp = client.post("/auth/logout", headers={"Authorization": f"Bearer {access_token}"})
    assert logout_resp.status_code == 200
    assert logout_resp.json()["message"] == "Logged out successfully"

    # Verify cookie was cleared in client response
    assert client.cookies.get("refresh_token") is None or client.cookies.get("refresh_token") == ""

    # 3. Try to call /auth/refresh with the old cookie that was saved prior to logout
    stale_client = TestClient(app, base_url="http://testserver")
    stale_client.cookies.set("refresh_token", old_cookie, path="/auth")
    refresh_resp = stale_client.post("/auth/refresh")
    assert refresh_resp.status_code == 401
