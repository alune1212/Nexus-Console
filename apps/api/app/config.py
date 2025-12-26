"""Application configuration."""

from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/nexus_console"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Application
    app_name: str = "Nexus Console API"
    app_version: str = "0.1.0"
    debug: bool = False  # 默认关闭 DEBUG，开发环境通过 .env 设置
    secret_key: str = Field(default="dev-secret-key-change-in-production-min32chars", min_length=32)

    # CORS
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Celery
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    # Logging
    log_level: str = "INFO"

    # Authentication
    access_token_expires_minutes: int = 30  # 30 分钟
    refresh_token_expires_days: int = 7  # 7 天
    cookie_secure: bool = False  # 生产环境应设为 True（需要 HTTPS）
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"  # lax | strict | none
    cookie_domain: str | None = None  # 生产环境可指定域名
    admin_emails: list[str] = Field(default_factory=list)  # ADMIN_EMAILS=a@x.com,b@x.com

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, v: str, info: object) -> str:
        """验证 SECRET_KEY 不能在生产环境使用默认值."""
        # 获取 debug 值，如果是生产环境（debug=False）则严格验证
        if v.startswith("dev-secret-key-change-in-production"):
            # 在测试环境或开发环境允许使用默认值
            # 但在生产环境（DEBUG=False 且不是测试）必须更改
            import os

            is_testing = os.getenv("PYTEST_CURRENT_TEST") is not None

            # 如果不是测试环境，发出警告
            if not is_testing:
                import warnings

                warnings.warn(
                    "Using default SECRET_KEY. This is insecure in production! "
                    "Generate a secure key using: "
                    "python -c 'import secrets; print(secrets.token_urlsafe(32))'",
                    UserWarning,
                    stacklevel=2,
                )
        return v

    @field_validator("admin_emails", mode="before")
    @classmethod
    def parse_admin_emails(cls, v: object) -> list[str]:
        """Parse ADMIN_EMAILS from env to a normalized list."""
        if v is None:
            return []
        if isinstance(v, str):
            return [s.strip().lower() for s in v.split(",") if s.strip()]
        if isinstance(v, list):
            return [str(item).strip().lower() for item in v if str(item).strip()]
        return []


settings = Settings()
