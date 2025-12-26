"""User model."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.rbac import user_roles

if TYPE_CHECKING:
    from app.models.auth_identity import AuthIdentity
    from app.models.rbac import Role


class User(Base):
    """User model."""

    __tablename__ = "users"

    # 添加复合索引以优化常见查询
    __table_args__ = (
        # 按创建时间和活跃状态查询的复合索引
        {"comment": "User table with optimized indexes"},
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    name: Mapped[str | None] = mapped_column(default=None, index=True)  # 添加索引以支持按名称搜索
    is_active: Mapped[bool] = mapped_column(default=True, index=True)  # 添加索引以支持按状态过滤
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,  # 添加索引以支持按时间排序
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        index=True,  # 添加索引以支持按更新时间排序
    )

    # Relationships
    auth_identities: Mapped[list[AuthIdentity]] = relationship(
        "AuthIdentity", back_populates="user", cascade="all, delete-orphan"
    )
    roles: Mapped[list[Role]] = relationship(  # type: ignore[name-defined]
        "Role",
        secondary=user_roles,
        back_populates="users",
        lazy="selectin",
    )
