import uuid
import asyncio
import pytest
from fastapi import HTTPException
import app.db.database as db_mod
from app.services.master_profile_service import MasterProfileService
from app.services.resume_view_service import ResumeViewService
from app.services.resume_version_service import ResumeVersionService
from app.schemas.schemas import (
    ResumeViewCreateRequest,
    ResumeViewUpdateRequest,
    MasterProfileUpdateRequest,
)
from app.models.user import User


@pytest.mark.asyncio
async def test_concurrent_snapshots_serialization():
    """
    Test that 10 concurrent calls to create_snapshot using SELECT ... FOR UPDATE
    serialize properly and result in strictly sequential version numbers 1 to 10
    with zero collision exceptions.
    """
    user_id = str(uuid.uuid4())
    async with db_mod.AsyncSessionLocal() as session:
        user = User(id=user_id, full_name="Concurrent Tester", email=f"conc_{uuid.uuid4().hex[:8]}@example.com", password_hash="hash")
        session.add(user)
        await session.commit()

        master = await MasterProfileService.get_or_create_profile(session, user_id)
        await MasterProfileService.update_profile(
            session,
            user_id,
            MasterProfileUpdateRequest(summary="Testing concurrency"),
        )
        view = await ResumeViewService.create_view(
            session,
            user_id,
            ResumeViewCreateRequest(title="Concurrent View"),
        )
        view_id = view.id

    # Simulate 10 parallel HTTP requests each with its own AsyncSession
    async def create_one(idx: int):
        async with db_mod.AsyncSessionLocal() as s:
            return await ResumeVersionService.create_snapshot(
                s,
                view_id,
                user_id,
                label=f"Parallel Snapshot {idx}",
                source="manual",
            )

    tasks = [create_one(i) for i in range(10)]
    results = await asyncio.gather(*tasks)

    version_numbers = sorted([v.version_number for v in results])
    # Assert strictly sequential from 1 to 10
    assert version_numbers == list(range(1, 11)), f"Expected 1..10, got {version_numbers}"


@pytest.mark.asyncio
async def test_restore_version_checkpoint_and_ownership():
    user_a_id = str(uuid.uuid4())
    user_b_id = str(uuid.uuid4())

    async with db_mod.AsyncSessionLocal() as session:
        user_a = User(id=user_a_id, full_name="User A", email=f"a_{uuid.uuid4().hex[:8]}@example.com", password_hash="hash")
        user_b = User(id=user_b_id, full_name="User B", email=f"b_{uuid.uuid4().hex[:8]}@example.com", password_hash="hash")
        session.add_all([user_a, user_b])
        await session.commit()

        master_a = await MasterProfileService.get_or_create_profile(session, user_a_id)
        view_a = await ResumeViewService.create_view(
            session,
            user_a_id,
            ResumeViewCreateRequest(title="Original View Title", primary_color="#111111"),
        )

        # 1. User B cannot snapshot User A's view (404)
        with pytest.raises(HTTPException) as exc_info:
            await ResumeVersionService.create_snapshot(session, view_a.id, user_b_id)
        assert exc_info.value.status_code == 404

        # 2. User A creates Snapshot v1
        v1 = await ResumeVersionService.create_snapshot(
            session, view_a.id, user_a_id, label="Version 1", note="First snapshot"
        )
        assert v1.version_number == 1

        # 3. User A modifies view
        await ResumeViewService.apply_overrides(
            session, view_a.id, user_a_id, {"summary": "Overridden summary before restore"}
        )
        await ResumeViewService.update_view(
            session,
            view_a.id,
            user_a_id,
            ResumeViewUpdateRequest(title="Modified View Title", primary_color="#999999"),
        )

        # 4. User B cannot restore User A's view (404)
        with pytest.raises(HTTPException) as exc_info:
            await ResumeVersionService.restore_version(session, view_a.id, v1.id, user_b_id)
        assert exc_info.value.status_code == 404

        # 5. User A restores Version 1
        restored_view, checkpoint = await ResumeVersionService.restore_version(
            session, view_a.id, v1.id, user_a_id
        )

        # Checkpoint assertions
        assert checkpoint.change_source == "restore_checkpoint"
        assert checkpoint.label == "Before restore"
        assert checkpoint.version_number == 2  # v1 was 1, checkpoint is 2

        # View restored assertions
        assert restored_view.title == "Original View Title"
        assert restored_view.primary_color == "#111111"

        # 6. List versions enforcing ownership
        with pytest.raises(HTTPException) as exc_info:
            await ResumeVersionService.list_versions(session, view_a.id, user_b_id)
        assert exc_info.value.status_code == 404

        versions_list = await ResumeVersionService.list_versions(session, view_a.id, user_a_id)
        assert len(versions_list) == 2  # v2 (checkpoint) and v1
        assert versions_list[0].version_number == 2
        assert versions_list[1].version_number == 1
