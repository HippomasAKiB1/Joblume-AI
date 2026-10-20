import os
import sys
import importlib
import pytest
from unittest.mock import patch


def test_jwt_secret_fail_loud_in_production():
    # Save original module if present
    saved_module = sys.modules.get("app.core.config")

    try:
        with patch.dict(os.environ, {
            "ENVIRONMENT": "production",
            "JWT_SECRET": "dev-secret-change-me"
        }):
            if "app.core.config" in sys.modules:
                del sys.modules["app.core.config"]

            with pytest.raises(RuntimeError) as exc_info:
                import app.core.config
            assert "JWT_SECRET must be set" in str(exc_info.value)
    finally:
        # Restore original module state
        if saved_module is not None:
            sys.modules["app.core.config"] = saved_module
        else:
            with patch.dict(os.environ, {"ENVIRONMENT": "development", "JWT_SECRET": "dev-secret-change-me"}):
                if "app.core.config" in sys.modules:
                    del sys.modules["app.core.config"]
                import app.core.config
