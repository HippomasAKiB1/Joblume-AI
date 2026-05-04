from fastapi import APIRouter, Depends
from app.models.user import User
from app.schemas.schemas import UserResponse, UserUpdateRequest
from app.auth.dependencies import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db

router = APIRouter(prefix="/user", tags=["User"])


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    req: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.full_name is not None:
        current_user.full_name = req.full_name
    if req.email is not None:
        current_user.email = req.email
    await db.flush()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)
