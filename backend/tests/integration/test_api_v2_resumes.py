import uuid
from fastapi.testclient import TestClient
from app.main import app


def create_user_and_auth(email_prefix: str = "res_user"):
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


def test_resume_view_lifecycle():
    client_a, headers_a = create_user_and_auth("user_a")
    client_b, headers_b = create_user_and_auth("user_b")

    # 1. POST /api/v2/resumes with no master_profile_id auto-creates Master Profile
    create_resp1 = client_a.post(
        "/api/v2/resumes",
        headers=headers_a,
        json={"title": "Base Engineering Resume", "template_id": "modern-professional"},
    )
    assert create_resp1.status_code == 201
    view1 = create_resp1.json()
    assert "id" in view1
    assert "master_profile_id" in view1
    assert view1["title"] == "Base Engineering Resume"
    assert "resolved_data" in view1
    master_id_a = view1["master_profile_id"]

    # 2. POST /api/v2/resumes with valid master_profile_id uses it
    create_resp2 = client_a.post(
        "/api/v2/resumes",
        headers=headers_a,
        json={
            "title": "Tailored Full Stack Resume",
            "template_id": "creative-portfolio",
            "master_profile_id": master_id_a,
            "primary_color": "#10B981",
        },
    )
    assert create_resp2.status_code == 201
    view2 = create_resp2.json()
    assert view2["master_profile_id"] == master_id_a
    assert view2["primary_color"] == "#10B981"
    view2_id = view2["id"]

    # 3. POST /api/v2/resumes with foreign master_profile_id returns 400
    create_resp_foreign = client_b.post(
        "/api/v2/resumes",
        headers=headers_b,
        json={"title": "Stolen View", "master_profile_id": master_id_a},
    )
    assert create_resp_foreign.status_code == 400
    assert "master profile does not belong to user" in create_resp_foreign.json()["detail"]

    # 4. GET /api/v2/resumes lists only user's views
    list_a = client_a.get("/api/v2/resumes", headers=headers_a)
    assert list_a.status_code == 200
    views_a = list_a.json()
    assert len(views_a) == 2
    view_ids_a = {v["id"] for v in views_a}
    assert view1["id"] in view_ids_a
    assert view2_id in view_ids_a

    list_b = client_b.get("/api/v2/resumes", headers=headers_b)
    assert list_b.status_code == 200
    assert len(list_b.json()) == 0

    # Populate Master Profile for user A to verify resolved_data
    client_a.put(
        "/api/v2/profile",
        headers=headers_a,
        json={
            "summary": "Master Summary Text",
            "experience": [
                {
                    "company": "Tech Corp",
                    "title": "Software Engineer",
                    "bullets": [{"text": "Implemented caching layer", "tags": ["redis"]}],
                }
            ],
            "skills": [{"name": "Go", "tags": []}],
        },
    )

    # 5. GET /api/v2/resumes/{id} returns resolved_data with all visible sections
    get_view = client_a.get(f"/api/v2/resumes/{view2_id}", headers=headers_a)
    assert get_view.status_code == 200
    data_resolved = get_view.json()["resolved_data"]
    assert data_resolved["template_id"] == "creative-portfolio"
    assert data_resolved["primary_color"] == "#10B981"
    assert data_resolved["font_family"] == "Inter"
    assert data_resolved["summary"] == "Master Summary Text"
    assert len(data_resolved["experience"]) == 1
    assert data_resolved["experience"][0]["company"] == "Tech Corp"
    exp_id = data_resolved["experience"][0]["id"]
    bullet_id = data_resolved["experience"][0]["bullets"][0]["id"]

    # 6. PUT /api/v2/resumes/{id} updates styling
    put_resp = client_a.put(
        f"/api/v2/resumes/{view2_id}",
        headers=headers_a,
        json={"primary_color": "#EF4444", "font_family": "Roboto"},
    )
    assert put_resp.status_code == 200
    assert put_resp.json()["primary_color"] == "#EF4444"
    assert put_resp.json()["resolved_data"]["primary_color"] == "#EF4444"
    assert put_resp.json()["resolved_data"]["font_family"] == "Roboto"

    # 7. PUT /api/v2/resumes/{id}/overrides merges (does not replace)
    # First override: summary
    ov1 = client_a.put(
        f"/api/v2/resumes/{view2_id}/overrides",
        headers=headers_a,
        json={"content_overrides": {"summary": "Tailored Specialist Summary"}},
    )
    assert ov1.status_code == 200
    assert ov1.json()["resolved_data"]["summary"] == "Tailored Specialist Summary"

    # Second override: bullet override on exp_id
    ov2 = client_a.put(
        f"/api/v2/resumes/{view2_id}/overrides",
        headers=headers_a,
        json={
            "content_overrides": {
                exp_id: {
                    "bullets": {bullet_id: "Architected distributed Redis caching"}
                }
            }
        },
    )
    assert ov2.status_code == 200
    # Summary override is retained (merged), and bullet is updated
    assert ov2.json()["resolved_data"]["summary"] == "Tailored Specialist Summary"
    assert ov2.json()["resolved_data"]["experience"][0]["bullets"][0]["text"] == "Architected distributed Redis caching"

    # 8. Create a version snapshot, then delete view to prove cascade delete
    ver_create = client_a.post(
        f"/api/v2/resumes/{view2_id}/versions",
        headers=headers_a,
        json={"label": "Pre-deletion Snapshot"},
    )
    assert ver_create.status_code == 201

    del_resp = client_a.delete(f"/api/v2/resumes/{view2_id}", headers=headers_a)
    assert del_resp.status_code == 200
    assert del_resp.json()["message"] == "Resume view deleted"

    # View is now 404
    get_deleted = client_a.get(f"/api/v2/resumes/{view2_id}", headers=headers_a)
    assert get_deleted.status_code == 404
