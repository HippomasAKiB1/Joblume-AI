import httpx
import structlog
from app.core.config import settings

logger = structlog.get_logger(__name__)


async def send_password_reset_email(to: str, reset_url: str) -> bool:
    """
    Sends a password reset email via the Resend API.
    If RESEND_API_KEY is not configured (e.g. during local development or testing),
    the reset link is logged and execution succeeds silently.
    """
    if not settings.RESEND_API_KEY:
        logger.info("Password reset link generated in dev mode", to=to, reset_url=reset_url)
        return True

    payload = {
        "from": f"JobLume AI <{settings.RESEND_FROM_EMAIL}>",
        "to": [to],
        "subject": "Reset your JobLume AI password",
        "html": f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #111827; margin-top: 0;">Reset Your Password</h2>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.5;">
                We received a request to reset your JobLume AI password. Click the button below to choose a new password. This link is valid for 15 minutes.
            </p>
            <div style="margin: 28px 0;">
                <a href="{reset_url}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                    Reset Password
                </a>
            </div>
            <p style="color: #6b7280; font-size: 13px; line-height: 1.4;">
                If you did not request a password reset, you can safely ignore this email. Your account remains secure.
            </p>
        </div>
        """,
    }

    headers = {
        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post("https://api.resend.com/emails", json=payload, headers=headers, timeout=10.0)
            if resp.status_code >= 400:
                logger.error("Resend API error", status_code=resp.status_code, response=resp.text)
                return False
            return True
        except Exception as e:
            logger.error("Failed to send email via Resend", error=str(e))
            return False
