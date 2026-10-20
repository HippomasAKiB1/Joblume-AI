from collections import defaultdict
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.db.database import get_db
from app.models.user import User
from app.schemas.schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.auth.jwt_handler import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    create_password_reset_token,
    verify_password_reset_token,
    hash_refresh_token,
    verify_token,
)
from app.services.email_service import send_password_reset_email

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory rate limiting for forgot-password: 3 requests per hour per email
_forgot_password_history: dict[str, list[datetime]] = defaultdict(list)


def check_forgot_password_rate_limit(email: str) -> bool:
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=1)
    history = [t for t in _forgot_password_history[email.lower()] if t > cutoff]
    if len(history) >= 3:
        return False
    history.append(now)
    _forgot_password_history[email.lower()] = history
    return True


def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    is_prod = settings.ENVIRONMENT.lower() == "production"
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_prod,
        samesite="none" if is_prod else "lax",
        path="/auth",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
    )


def clear_refresh_cookie(response: Response) -> None:
    is_prod = settings.ENVIRONMENT.lower() == "production"
    response.delete_cookie(
        key="refresh_token",
        path="/auth",
        httponly=True,
        secure=is_prod,
        samesite="none" if is_prod else "lax",
    )


@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        full_name=req.full_name,
        email=req.email,
        password_hash=get_password_hash(req.password),
    )
    db.add(user)
    await db.flush()

    refresh_token = create_refresh_token(user.id)
    user.refresh_token_hash = hash_refresh_token(refresh_token)
    await db.commit()
    await db.refresh(user)

    set_refresh_cookie(response, refresh_token)
    token = create_access_token({"sub": user.id, "email": user.email})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    refresh_token = create_refresh_token(user.id)
    user.refresh_token_hash = hash_refresh_token(refresh_token)
    await db.commit()

    set_refresh_cookie(response, refresh_token)
    token = create_access_token({"sub": user.id, "email": user.email})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    # 1. CSRF defense: Origin header validation
    origin = request.headers.get("origin")
    if origin:
        allowed = {
            settings.FRONTEND_URL.rstrip("/"),
            "https://joblume-ai.vercel.app",
        }
        if settings.ENVIRONMENT.lower() != "production":
            allowed.update({
                "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:3000",
            })
        if origin.rstrip("/") not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Origin mismatch")

    # 2. Extract refresh token cookie
    cookie_token = request.cookies.get("refresh_token")
    if not cookie_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")

    # 3. Decode & verify token
    payload = verify_token(cookie_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    # 4. Theft detection: compare hash of presented token against stored hash
    incoming_hash = hash_refresh_token(cookie_token)
    if not user.refresh_token_hash or user.refresh_token_hash != incoming_hash:
        # Compromise detected: invalidate entire session family
        user.refresh_token_hash = None
        await db.commit()
        clear_refresh_cookie(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session invalidated due to token reuse")

    # 5. Rotate refresh token & issue new access token
    new_refresh_token = create_refresh_token(user.id)
    user.refresh_token_hash = hash_refresh_token(new_refresh_token)
    await db.commit()

    set_refresh_cookie(response, new_refresh_token)
    new_access_token = create_access_token({"sub": user.id, "email": user.email})
    return TokenResponse(
        access_token=new_access_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/logout")
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    clear_refresh_cookie(response)

    # Invalidate stored token hash if user can be identified
    user_id: Optional[str] = None
    cookie_token = request.cookies.get("refresh_token")
    if cookie_token:
        payload = verify_token(cookie_token)
        if payload:
            user_id = payload.get("sub")

    if not user_id:
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = verify_token(token)
            if payload:
                user_id = payload.get("sub")

    if user_id:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user:
            user.refresh_token_hash = None
            await db.commit()

    return {"message": "Logged out successfully"}


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    # Rate limit check
    if not check_forgot_password_rate_limit(req.email):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many password reset requests. Please try again later.")

    # Always return 200 to prevent email enumeration
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if user:
        token = create_password_reset_token(user.id)
        reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={token}"
        await send_password_reset_email(to=user.email, reset_url=reset_url)

    return {"message": "If an account exists with that email, a password reset link has been sent."}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, response: Response, db: AsyncSession = Depends(get_db)):
    try:
        user_id = verify_password_reset_token(req.token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")

    user.password_hash = get_password_hash(req.new_password)
    user.refresh_token_hash = None  # Invalidate all active sessions
    await db.commit()

    clear_refresh_cookie(response)
    return {"message": "Password reset successfully. Please log in with your new password."}
