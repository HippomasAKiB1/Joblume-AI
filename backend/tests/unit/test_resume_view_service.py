import uuid
import pytest
from fastapi import HTTPException
from types import SimpleNamespace
from app.services.master_profile_service import MasterProfileService
from app.services.resume_view_service import ResumeViewService
from app.schemas.schemas import ResumeViewCreateRequest, ResumeViewUpdateRequest
from app.models.user import User


def test_resolve_view_data_contract_matches_section_5_2_exactly():
    """
    Test that resolve_view_data implements the exact §5.2 contract specification.
    """
    # 1. Input: Master Profile
    master = SimpleNamespace(
        personal_info={"fullName": "Alex Mercer", "email": "alex@example.com"},
        summary="Experienced Full Stack Developer.",
        experience=[
            {
                "id": "e1",
                "company": "Acme",
                "title": "Engineer",
                "bullets": [{"id": "b1", "text": "Built service X", "tags": ["python"]}],
            },
            {
                "id": "e2",
                "company": "Beta",
                "title": "Senior Engineer",
                "bullets": [{"id": "b2", "text": "Built service Y", "tags": ["go"]}],
            },
        ],
        skills=[
            {"name": "Python", "tags": ["backend"]},
            {"name": "React", "tags": ["frontend"]},
        ],
        education=[],
        projects=[],
        certifications=[],
        languages=[],
        awards=[],
        custom_sections=[],
    )

    # 2. Input: View Configuration
    view = SimpleNamespace(
        template_id="modern-professional",
        primary_color="#4F46E5",
        font_family="Inter",
        selected_entry_ids={"experience": ["e1"]},  # e2 filtered out
        section_visibility={"summary": True, "experience": True, "skills": False},  # skills hidden
        content_overrides={
            "summary": "Tailored Backend Architect.",
            "e1": {
                "title": "Lead Software Engineer",
                "bullets": {"b1": "Architected and deployed service X to 1M DAU."},
            },
        },
        section_order=[
            "personal", "summary", "experience", "education", "skills",
            "projects", "certifications", "languages", "awards", "custom_sections"
        ],
    )

    # 3. Resolution execution
    resolved_data = ResumeViewService.resolve_view_data(view, master)

    # 4. Strict assertions against §5.2 contract
    assert resolved_data["personal_info"] == {"fullName": "Alex Mercer", "email": "alex@example.com"}
    assert resolved_data["summary"] == "Tailored Backend Architect."
    assert len(resolved_data["experience"]) == 1
    assert resolved_data["experience"][0]["id"] == "e1"
    assert resolved_data["experience"][0]["company"] == "Acme"
    assert resolved_data["experience"][0]["title"] == "Lead Software Engineer"
    assert len(resolved_data["experience"][0]["bullets"]) == 1
    assert resolved_data["experience"][0]["bullets"][0]["id"] == "b1"
    assert resolved_data["experience"][0]["bullets"][0]["text"] == "Architected and deployed service X to 1M DAU."
    assert resolved_data["experience"][0]["bullets"][0]["tags"] == ["python"]

    # skills must be omitted completely because section_visibility["skills"] is False
    assert "skills" not in resolved_data


import app.db.database as db_mod


@pytest.mark.asyncio
async def test_view_service_crud_and_ownership():
    user_a_id = str(uuid.uuid4())
    user_b_id = str(uuid.uuid4())

    async with db_mod.AsyncSessionLocal() as session:
        user_a = User(id=user_a_id, full_name="User A", email=f"a_{uuid.uuid4().hex[:8]}@example.com", password_hash="hash")
        user_b = User(id=user_b_id, full_name="User B", email=f"b_{uuid.uuid4().hex[:8]}@example.com", password_hash="hash")
        session.add_all([user_a, user_b])
        await session.commit()

        master_a = await MasterProfileService.get_or_create_profile(session, user_a_id)
        master_b = await MasterProfileService.get_or_create_profile(session, user_b_id)

        # 1. create_view with foreign master raises 400
        with pytest.raises(HTTPException) as exc_info:
            await ResumeViewService.create_view(
                session,
                user_a_id,
                ResumeViewCreateRequest(title="Stolen Master View", master_profile_id=master_b.id),
            )
        assert exc_info.value.status_code == 400

        # 2. create_view without master_profile_id auto-links
        view_a = await ResumeViewService.create_view(
            session,
            user_a_id,
            ResumeViewCreateRequest(title="Frontend Resume", template_id="creative-portfolio"),
        )
        assert view_a.id is not None
        assert view_a.master_profile_id == master_a.id
        assert view_a.user_id == user_a_id
        assert view_a.template_id == "creative-portfolio"

        # 3. get_view ownership enforcement (User B gets 404 on view_a)
        with pytest.raises(HTTPException) as exc_info:
            await ResumeViewService.get_view(session, view_a.id, user_b_id)
        assert exc_info.value.status_code == 404

        # 4. update_view ownership enforcement
        with pytest.raises(HTTPException) as exc_info:
            await ResumeViewService.update_view(
                session, view_a.id, user_b_id, ResumeViewUpdateRequest(title="Hacked")
            )
        assert exc_info.value.status_code == 404

        # 5. update_view by owner succeeds
        updated = await ResumeViewService.update_view(
            session, view_a.id, user_a_id, ResumeViewUpdateRequest(title="Senior Frontend Resume")
        )
        assert updated.title == "Senior Frontend Resume"

        # 6. apply_overrides by owner succeeds
        view_with_ov = await ResumeViewService.apply_overrides(
            session, view_a.id, user_a_id, {"summary": "Overridden summary"}
        )
        assert view_with_ov.content_overrides["summary"] == "Overridden summary"

        # 7. delete_view by foreign user raises 404
        with pytest.raises(HTTPException) as exc_info:
            await ResumeViewService.delete_view(session, view_a.id, user_b_id)
        assert exc_info.value.status_code == 404

        # 8. delete_view by owner succeeds
        await ResumeViewService.delete_view(session, view_a.id, user_a_id)
        with pytest.raises(HTTPException) as exc_info:
            await ResumeViewService.get_view(session, view_a.id, user_a_id)
        assert exc_info.value.status_code == 404
