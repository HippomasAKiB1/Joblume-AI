import uuid
import asyncio
import pytest
import httpx
from app.main import app


@pytest.mark.asyncio
async def test_api_v2_versions():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Register user and authenticate
        uid = uuid.uuid4().hex[:8]
        email = f"ver_user_{uid}@example.com"
        reg_resp = await client.post(
            "/auth/register",
            json={"full_name": f"Ver User {uid}", "email": email, "password": f"P@ss_{uid}_T3st!"},
        )
        assert reg_resp.status_code == 200
        token = reg_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Setup master profile data
        await client.put(
            "/api/v2/profile",
            headers=headers,
            json={
                "summary": "Master Profile for Versions",
                "experience": [
                    {
                        "company": "Tech Innovators",
                        "title": "Lead Architect",
                        "bullets": [{"text": "Spearheaded cloud migration", "tags": []}],
                    }
                ],
            },
        )

        # Create resume view 1 for sequential and restore testing
        view_res = await client.post(
            "/api/v2/resumes",
            headers=headers,
            json={
                "title": "Base Versioned Resume",
                "template_id": "modern-professional",
                "primary_color": "#2563EB",
                "font_family": "Inter",
            },
        )
        assert view_res.status_code == 201
        view = view_res.json()
        view_id = view["id"]

        # 1. POST /resumes/{id}/versions creates v1, v2, v3 sequentially
        v1_res = await client.post(
            f"/api/v2/resumes/{view_id}/versions",
            headers=headers,
            json={"label": "Initial v1", "note": "First baseline snapshot"},
        )
        assert v1_res.status_code == 201
        v1_data = v1_res.json()
        assert v1_data["version_number"] == 1
        assert v1_data["label"] == "Initial v1"
        assert v1_data["change_source"] == "manual"
        # Restored/captured snapshot_data structure contains template_id, primary_color, font_family (proves snapshot is lossless)
        assert v1_data["snapshot_data"]["template_id"] == "modern-professional"
        assert v1_data["snapshot_data"]["primary_color"] == "#2563EB"
        assert v1_data["snapshot_data"]["font_family"] == "Inter"
        assert v1_data["snapshot_data"]["summary"] == "Master Profile for Versions"

        v2_res = await client.post(
            f"/api/v2/resumes/{view_id}/versions",
            headers=headers,
            json={"label": "v2"},
        )
        assert v2_res.status_code == 201
        assert v2_res.json()["version_number"] == 2

        v3_res = await client.post(
            f"/api/v2/resumes/{view_id}/versions",
            headers=headers,
            json={"label": "v3"},
        )
        assert v3_res.status_code == 201
        assert v3_res.json()["version_number"] == 3

        # 2. GET /resumes/{id}/versions lists descending by version_number
        list_res = await client.get(f"/api/v2/resumes/{view_id}/versions", headers=headers)
        assert list_res.status_code == 200
        versions_list = list_res.json()
        assert len(versions_list) == 3
        v_nums = [v["version_number"] for v in versions_list]
        assert v_nums == [3, 2, 1]  # Strictly descending

        # 3. Modify view styling & overrides before restoring v1
        await client.put(
            f"/api/v2/resumes/{view_id}",
            headers=headers,
            json={
                "template_id": "minimal-clean",
                "primary_color": "#DC2626",
                "font_family": "Roboto",
            },
        )
        await client.put(
            f"/api/v2/resumes/{view_id}/overrides",
            headers=headers,
            json={"content_overrides": {"summary": "Overridden Summary Before Restore"}},
        )

        # Verify current view is changed
        current_view_res = await client.get(f"/api/v2/resumes/{view_id}", headers=headers)
        assert current_view_res.json()["template_id"] == "minimal-clean"
        assert current_view_res.json()["primary_color"] == "#DC2626"
        assert current_view_res.json()["resolved_data"]["summary"] == "Overridden Summary Before Restore"

        # 4. POST /resumes/{id}/versions/{vid}/restore
        v1_id = v1_data["id"]
        restore_res = await client.post(
            f"/api/v2/resumes/{view_id}/versions/{v1_id}/restore",
            headers=headers,
        )
        assert restore_res.status_code == 200
        restore_data = restore_res.json()
        assert "view" in restore_data
        assert "pre_restore_checkpoint" in restore_data

        # Check pre_restore_checkpoint has change_source='restore_checkpoint'
        checkpoint = restore_data["pre_restore_checkpoint"]
        assert checkpoint["change_source"] == "restore_checkpoint"
        assert checkpoint["version_number"] == 4  # New checkpoint created at version 4

        # Check view with restored config
        restored_view = restore_data["view"]
        assert restored_view["template_id"] == "modern-professional"
        assert restored_view["primary_color"] == "#2563EB"
        assert restored_view["font_family"] == "Inter"
        assert restored_view["resolved_data"]["template_id"] == "modern-professional"
        assert restored_view["resolved_data"]["primary_color"] == "#2563EB"
        # Summary is reverted back from overrides to original
        assert restored_view["resolved_data"]["summary"] == "Master Profile for Versions"

        # 5. Concurrent POST /versions x10 -> all succeed, version numbers strictly sequential 1-10
        # Create a fresh view specifically to test 1..10 sequential numbering
        conc_view_res = await client.post(
            "/api/v2/resumes",
            headers=headers,
            json={"title": "Concurrency Test View"},
        )
        assert conc_view_res.status_code == 201
        conc_view_id = conc_view_res.json()["id"]

        async def post_version(i: int):
            return await client.post(
                f"/api/v2/resumes/{conc_view_id}/versions",
                headers=headers,
                json={"label": f"Concurrent {i}"},
            )

        tasks = [post_version(i) for i in range(10)]
        responses = await asyncio.gather(*tasks)

        for r in responses:
            assert r.status_code == 201

        resp_v_nums = sorted([r.json()["version_number"] for r in responses])
        assert resp_v_nums == list(range(1, 11)), f"Expected 1..10, got {resp_v_nums}"
