import uuid
import pytest
from fastapi import HTTPException
from app.services.master_profile_service import MasterProfileService
from app.schemas.schemas import (
    MasterProfileUpdateRequest,
    PersonalInfoSchema,
    ExperienceItemSchema,
    SkillItemSchema,
)
from app.models.user import User


@pytest.mark.asyncio
async def test_uuid_minting_and_normalization():
    # Test bullets normalization
    raw_bullets = ["Built microservice", {"text": "Optimized DB query", "tags": ["sql"]}]
    norm_bullets = MasterProfileService.normalize_bullets(raw_bullets)
    assert len(norm_bullets) == 2
    assert norm_bullets[0]["text"] == "Built microservice"
    assert "id" in norm_bullets[0] and norm_bullets[0]["id"]
    assert norm_bullets[0]["tags"] == []
    assert norm_bullets[1]["text"] == "Optimized DB query"
    assert norm_bullets[1]["tags"] == ["sql"]

    # Test skills normalization
    raw_skills = ["Python", {"name": "React", "tags": ["frontend"]}]
    norm_skills = MasterProfileService.normalize_skills(raw_skills)
    assert len(norm_skills) == 2
    assert norm_skills[0]["name"] == "Python"
    assert norm_skills[0]["tags"] == []
    assert norm_skills[1]["name"] == "React"
    assert norm_skills[1]["tags"] == ["frontend"]

    # Test list items missing ID
    items = [{"company": "Acme", "title": "Dev"}]
    norm_items = MasterProfileService.normalize_list_items(items)
    assert len(norm_items) == 1
    assert "id" in norm_items[0] and norm_items[0]["id"]


import app.db.database as db_mod


@pytest.mark.asyncio
async def test_get_or_create_and_ownership():
    user_a_id = str(uuid.uuid4())
    user_b_id = str(uuid.uuid4())

    async with db_mod.AsyncSessionLocal() as session:
        # Create dummy users in staging
        user_a = User(id=user_a_id, full_name="User A", email=f"a_{uuid.uuid4().hex[:8]}@example.com", password_hash="hash")
        user_b = User(id=user_b_id, full_name="User B", email=f"b_{uuid.uuid4().hex[:8]}@example.com", password_hash="hash")
        session.add_all([user_a, user_b])
        await session.commit()

        # 1. get_or_create idempotency
        profile1 = await MasterProfileService.get_or_create_profile(session, user_a_id)
        profile2 = await MasterProfileService.get_or_create_profile(session, user_a_id)
        assert profile1.id == profile2.id
        assert profile1.user_id == user_a_id

        # 2. validate_ownership success
        valid_profile = await MasterProfileService.validate_ownership(session, profile1.id, user_a_id)
        assert valid_profile.id == profile1.id

        # 3. validate_ownership failure for foreign user (must raise 404)
        with pytest.raises(HTTPException) as exc_info:
            await MasterProfileService.validate_ownership(session, profile1.id, user_b_id)
        assert exc_info.value.status_code == 404

        # 4. update_profile with UUID minting
        update_data = MasterProfileUpdateRequest(
            summary="Senior Staff Architect",
            experience=[
                ExperienceItemSchema(
                    title="Lead Architect",
                    company="Global Tech",
                    bullets=[{"text": "Spearheaded platform rewrite", "tags": ["architecture"]}],
                )
            ],
            skills=[SkillItemSchema(name="FastAPI", tags=["backend"])],
        )
        updated = await MasterProfileService.update_profile(session, user_a_id, update_data)
        assert updated.summary == "Senior Staff Architect"
        assert len(updated.experience) == 1
        assert updated.experience[0]["company"] == "Global Tech"
        assert updated.experience[0]["id"] is not None
        assert updated.experience[0]["bullets"][0]["text"] == "Spearheaded platform rewrite"
        assert len(updated.skills) == 1
        assert updated.skills[0]["name"] == "FastAPI"
