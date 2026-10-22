import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.auth.jwt_handler import create_access_token


def test_token_for_missing_user_returns_401():
    client = TestClient(app, base_url="http://testserver")

    # Generate a syntactically valid JWT for a random UUID that does not exist in the database
    fake_user_id = str(uuid.uuid4())
    token = create_access_token(data={"sub": fake_user_id, "email": "nonexistent@example.com"})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. New v2 route: GET /api/v2/profile with nonexistent user token
    resp_v2 = client.get("/api/v2/profile", headers=headers)
    assert resp_v2.status_code == 401
    assert resp_v2.headers.get("WWW-Authenticate") == "Bearer"
    assert resp_v2.json().get("detail") == "Invalid or expired token"

    # 2. Legacy route: GET /resume/list with nonexistent user token
    resp_legacy = client.get("/resume/list", headers=headers)
    assert resp_legacy.status_code == 401
    assert resp_legacy.headers.get("WWW-Authenticate") == "Bearer"
    assert resp_legacy.json().get("detail") == "Invalid or expired token"
