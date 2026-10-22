import uuid
from typing import Optional, List, Dict, Any
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.master_profile import MasterProfile
from app.schemas.schemas import MasterProfileUpdateRequest


class MasterProfileService:

    @staticmethod
    def normalize_bullets(raw_bullets: Any) -> List[Dict[str, Any]]:
        """Normalize experience bullets to dicts with id, text, tags."""
        if not isinstance(raw_bullets, list):
            return []
        normalized = []
        for b in raw_bullets:
            if isinstance(b, str):
                normalized.append({
                    "id": str(uuid.uuid4()),
                    "text": b,
                    "tags": [],
                })
            elif isinstance(b, dict):
                b_dict = dict(b)
                if not b_dict.get("id"):
                    b_dict["id"] = str(uuid.uuid4())
                if not isinstance(b_dict.get("tags"), list):
                    b_dict["tags"] = []
                normalized.append(b_dict)
            elif hasattr(b, "model_dump"):
                b_dict = b.model_dump()
                if not b_dict.get("id"):
                    b_dict["id"] = str(uuid.uuid4())
                if not isinstance(b_dict.get("tags"), list):
                    b_dict["tags"] = []
                normalized.append(b_dict)
        return normalized

    @staticmethod
    def normalize_skills(raw_skills: Any) -> List[Dict[str, Any]]:
        """Normalize skills to dicts with name, tags."""
        if not isinstance(raw_skills, list):
            return []
        normalized = []
        for s in raw_skills:
            if isinstance(s, str):
                normalized.append({"name": s, "tags": []})
            elif isinstance(s, dict):
                s_dict = dict(s)
                if not s_dict.get("name"):
                    continue
                if not isinstance(s_dict.get("tags"), list):
                    s_dict["tags"] = []
                normalized.append(s_dict)
            elif hasattr(s, "model_dump"):
                s_dict = s.model_dump()
                if not s_dict.get("name"):
                    continue
                if not isinstance(s_dict.get("tags"), list):
                    s_dict["tags"] = []
                normalized.append(s_dict)
        return normalized

    @staticmethod
    def normalize_list_items(items: Any) -> List[Dict[str, Any]]:
        """Ensure each item in a collection has an id."""
        if not isinstance(items, list):
            return []
        normalized = []
        for item in items:
            if hasattr(item, "model_dump"):
                i_dict = item.model_dump()
            elif isinstance(item, dict):
                i_dict = dict(item)
            else:
                continue
            if not i_dict.get("id"):
                i_dict["id"] = str(uuid.uuid4())
            normalized.append(i_dict)
        return normalized

    @classmethod
    async def get_or_create_profile(cls, db: AsyncSession, user_id: str) -> MasterProfile:
        """Fetch existing canonical profile or lazily create a default one for user."""
        stmt = select(MasterProfile).where(MasterProfile.user_id == user_id)
        result = await db.execute(stmt)
        profile = result.scalar_one_or_none()

        if profile is None:
            profile = MasterProfile(
                id=uuid.uuid4(),
                user_id=user_id,
                personal_info={
                    "fullName": "",
                    "email": "",
                    "phone": "",
                    "location": "",
                    "website": "",
                    "linkedin": "",
                    "github": "",
                    "portfolio": "",
                    "photo_url": None,
                },
                summary="",
                experience=[],
                education=[],
                projects=[],
                skills=[],
                certifications=[],
                languages=[],
                awards=[],
                custom_sections=[],
            )
            db.add(profile)
            await db.commit()
            await db.refresh(profile)

        return profile

    @classmethod
    async def get_profile(cls, db: AsyncSession, user_id: str) -> MasterProfile:
        """Fetch user's Master Profile (lazy-creates if absent)."""
        return await cls.get_or_create_profile(db, user_id)

    @classmethod
    async def validate_ownership(
        cls, db: AsyncSession, profile_id: uuid.UUID, user_id: str
    ) -> MasterProfile:
        """Raise HTTP 404 if profile does not exist or does not belong to user."""
        stmt = select(MasterProfile).where(MasterProfile.id == profile_id)
        result = await db.execute(stmt)
        profile = result.scalar_one_or_none()

        if profile is None or profile.user_id != user_id:
            raise HTTPException(status_code=404, detail="Master profile not found")

        return profile

    @classmethod
    async def update_profile(
        cls, db: AsyncSession, user_id: str, data: MasterProfileUpdateRequest
    ) -> MasterProfile:
        """Update Master Profile fields with UUID minting and validation."""
        profile = await cls.get_or_create_profile(db, user_id)

        if data.personal_info is not None:
            profile.personal_info = data.personal_info.model_dump()

        if data.summary is not None:
            profile.summary = data.summary

        if data.experience is not None:
            exp_list = cls.normalize_list_items(data.experience)
            for exp in exp_list:
                exp["bullets"] = cls.normalize_bullets(exp.get("bullets", []))
            profile.experience = exp_list

        if data.education is not None:
            profile.education = cls.normalize_list_items(data.education)

        if data.projects is not None:
            profile.projects = cls.normalize_list_items(data.projects)

        if data.skills is not None:
            profile.skills = cls.normalize_skills(data.skills)

        if data.certifications is not None:
            profile.certifications = cls.normalize_list_items(data.certifications)

        if data.languages is not None:
            profile.languages = cls.normalize_list_items(data.languages)

        if data.awards is not None:
            profile.awards = cls.normalize_list_items(data.awards)

        if data.custom_sections is not None:
            profile.custom_sections = cls.normalize_list_items(data.custom_sections)

        await db.commit()
        await db.refresh(profile)
        return profile
