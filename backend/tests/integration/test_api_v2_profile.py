import uuid
from fastapi.testclient import TestClient
from app.main import app


def get_authenticated_client():
    client = TestClient(app, base_url="http://testserver")
    uid = uuid.uuid4().hex[:8]
    email = f"prof_{uid}@example.com"
    user_pass = f"P@ss_{uid}_T3st!"
    reg_resp = client.post(
        "/auth/register",
        json={"full_name": "Profile Tester", "email": email, "password": user_pass},
    )
    assert reg_resp.status_code == 200
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return client, headers


def test_profile_endpoints():
    client, headers = get_authenticated_client()

    # 1. GET /api/v2/profile lazy-creates on first call
    r1 = client.get("/api/v2/profile", headers=headers)
    assert r1.status_code == 200
    p1 = r1.json()
    assert "id" in p1
    assert p1["summary"] == ""
    assert isinstance(p1["personal_info"], dict)
    assert isinstance(p1["experience"], list)
    assert len(p1["experience"]) == 0

    # 2. GET /api/v2/profile returns same profile on second call (idempotent)
    r2 = client.get("/api/v2/profile", headers=headers)
    assert r2.status_code == 200
    p2 = r2.json()
    assert p2["id"] == p1["id"]

    # 3. PUT /api/v2/profile updates fields and returns updated data
    update_payload = {
        "summary": "Cloud Solutions Architect",
        "personal_info": {
            "fullName": "Alice Developer",
            "email": "alice@example.com",
            "phone": "+1-555-0199",
            "location": "Seattle, WA",
            "website": "https://alice.cloud",
            "linkedin": "",
            "github": "",
            "portfolio": "",
            "photo_url": "https://images.example.com/alice.jpg",
        },
        "skills": [
            {"name": "Python", "tags": ["backend"]},
            {"name": "AWS", "tags": ["cloud"]},
        ],
        "experience": [
            {
                "company": "Amazon AWS",
                "title": "Senior Solutions Architect",
                "startDate": "2021-01",
                "bullets": [{"text": "Designed high-availability clusters", "tags": ["ha"]}],
            }
        ],
    }
    r3 = client.put("/api/v2/profile", headers=headers, json=update_payload)
    assert r3.status_code == 200
    p3 = r3.json()
    assert p3["summary"] == "Cloud Solutions Architect"
    assert p3["personal_info"]["fullName"] == "Alice Developer"
    assert p3["personal_info"]["photo_url"] == "https://images.example.com/alice.jpg"
    assert len(p3["skills"]) == 2
    assert len(p3["experience"]) == 1
    assert p3["experience"][0]["company"] == "Amazon AWS"
    assert "id" in p3["experience"][0]  # Minted UUID
    assert len(p3["experience"][0]["bullets"]) == 1
    assert "id" in p3["experience"][0]["bullets"][0]  # Minted bullet UUID

    # 4. PUT /api/v2/profile with partial body updates only provided fields
    partial_payload = {"summary": "Principal Enterprise Architect"}
    r4 = client.put("/api/v2/profile", headers=headers, json=partial_payload)
    assert r4.status_code == 200
    p4 = r4.json()
    assert p4["summary"] == "Principal Enterprise Architect"
    # personal_info and experience remain unchanged
    assert p4["personal_info"]["fullName"] == "Alice Developer"
    assert len(p4["experience"]) == 1
    assert p4["experience"][0]["company"] == "Amazon AWS"
