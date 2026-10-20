import uuid
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app


def test_password_reset_flow():
    client = TestClient(app, base_url="http://testserver")

    uid = uuid.uuid4().hex[:8]
    email = f"reset_{uid}@example.com"
    initial_pwd = f"Old_P@ss_{uid}_T3st!"
    updated_pwd = f"New_P@ss_{uid}_T3st!"

    # 1. Register user
    reg_resp = client.post(
        "/auth/register",
        json={"full_name": "Reset Tester", "email": email, "password": initial_pwd},
    )
    assert reg_resp.status_code == 200

    # 2. Request reset with monkeypatched email service
    captured_tokens = []

    async def mock_send_email(to: str, reset_url: str):
        # Extract token from query param in reset_url
        if "?token=" in reset_url:
            token = reset_url.split("?token=")[1]
            captured_tokens.append(token)
        return True

    with patch("app.routers.auth.send_password_reset_email", side_effect=mock_send_email):
        forgot_resp = client.post("/auth/forgot-password", json={"email": email})
        assert forgot_resp.status_code == 200
        assert "If an account exists" in forgot_resp.json()["message"]

    assert len(captured_tokens) == 1
    token = captured_tokens[0]

    # 3. Submit reset password
    reset_resp = client.post(
        "/auth/reset-password",
        json={"token": token, "new_password": updated_pwd},
    )
    assert reset_resp.status_code == 200
    assert "Password reset successfully" in reset_resp.json()["message"]

    # 4. Login with old password fails
    old_login = client.post(
        "/auth/login",
        json={"email": email, "password": initial_pwd},
    )
    assert old_login.status_code == 401

    # 5. Login with new password succeeds
    new_login = client.post(
        "/auth/login",
        json={"email": email, "password": updated_pwd},
    )
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()


def test_password_reset_nonexistent_email_enumeration_defense():
    client = TestClient(app, base_url="http://testserver")
    fake_email = f"nonexistent_{uuid.uuid4().hex[:12]}@example.com"

    resp = client.post("/auth/forgot-password", json={"email": fake_email})
    assert resp.status_code == 200
    assert "If an account exists" in resp.json()["message"]
