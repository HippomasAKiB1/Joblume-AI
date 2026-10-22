import uuid
from fastapi.testclient import TestClient
from app.main import app


def create_user_and_auth(email_prefix: str = "iso_user"):
    client = TestClient(app, base_url="http://testserver")
    uid = uuid.uuid4().hex[:8]
    email = f"{email_prefix}_{uid}@example.com"
    user_pass = f"P@ss_{uid}_T3st!"
    reg_resp = client.post(
        "/auth/register",
        json={"full_name": f"User {uid}", "email": email, "password": user_pass},
    )
    assert reg_resp.status_code == 200
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return client, headers


def test_api_v2_cross_user_isolation():
    # User A and User B each have auth token
    client_a, headers_a = create_user_and_auth("user_a")
    client_b, headers_b = create_user_and_auth("user_b")

    # User A creates master + view + version
    profile_resp = client_a.put(
        "/api/v2/profile",
        headers=headers_a,
        json={"summary": "User A Private Profile"},
    )
    assert profile_resp.status_code == 200
    master_a_id = profile_resp.json()["id"]

    view_resp = client_a.post(
        "/api/v2/resumes",
        headers=headers_a,
        json={"title": "User A Private Resume", "master_profile_id": master_a_id},
    )
    assert view_resp.status_code == 201
    view_a_id = view_resp.json()["id"]

    ver_resp = client_a.post(
        f"/api/v2/resumes/{view_a_id}/versions",
        headers=headers_a,
        json={"label": "User A v1 Snapshot"},
    )
    assert ver_resp.status_code == 201

    # User B GET /resumes/{A_view_id} -> 404
    get_res = client_b.get(f"/api/v2/resumes/{view_a_id}", headers=headers_b)
    assert get_res.status_code == 404
    assert "not found" in get_res.json()["detail"].lower()

    # User B PUT /resumes/{A_view_id} -> 404
    put_res = client_b.put(
        f"/api/v2/resumes/{view_a_id}",
        headers=headers_b,
        json={"title": "Hacked Title"},
    )
    assert put_res.status_code == 404
    assert "not found" in put_res.json()["detail"].lower()

    # User B PUT /resumes/{A_view_id}/overrides -> 404
    ov_res = client_b.put(
        f"/api/v2/resumes/{view_a_id}/overrides",
        headers=headers_b,
        json={"content_overrides": {"summary": "Hacked Summary"}},
    )
    assert ov_res.status_code == 404
    assert "not found" in ov_res.json()["detail"].lower()

    # User B DELETE /resumes/{A_view_id} -> 404
    del_res = client_b.delete(f"/api/v2/resumes/{view_a_id}", headers=headers_b)
    assert del_res.status_code == 404
    assert "not found" in del_res.json()["detail"].lower()

    # User B GET /resumes/{A_view_id}/versions -> 404
    ver_list_res = client_b.get(f"/api/v2/resumes/{view_a_id}/versions", headers=headers_b)
    assert ver_list_res.status_code == 404
    assert "not found" in ver_list_res.json()["detail"].lower()

    # User B POST /resumes with A's master_profile_id -> 400
    steal_master_res = client_b.post(
        "/api/v2/resumes",
        headers=headers_b,
        json={"title": "Illicit Resume View", "master_profile_id": master_a_id},
    )
    assert steal_master_res.status_code == 400
    assert "master profile does not belong to user" in steal_master_res.json()["detail"].lower()
