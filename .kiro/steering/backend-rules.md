# 后端开发规则

> 本文档约束后端代码风格和最佳实践

## 核心原则

1. **异步优先**: 必须使用异步模式（AsyncSession, async/await）
2. **类型安全**: 必须使用类型注解
3. **现代语法**: 使用 Python 3.13+ 特性

## SQLAlchemy 2.0 异步模式

```python
# ✅ 正确：SQLAlchemy 2.0 异步模式 + Mapped 类型
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(unique=True)
    name: Mapped[str | None] = mapped_column(default=None)

# ❌ 错误：同步模式 / 旧语法
from sqlalchemy import Column, Integer, String
class User(Base):
    id = Column(Integer, primary_key=True)
```

## 数据库会话管理

```python
# ✅ 正确：异步依赖注入
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

# 在路由中使用
@router.get("/users/{user_id}")
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one()
```

## Pydantic v2 模型

```python
# ✅ 正确：Pydantic v2 语法
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)

    model_config = ConfigDict(strict=True)

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str | None

    model_config = ConfigDict(from_attributes=True)

# ❌ 错误：Pydantic v1 语法
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)

    class Config:
        strict = True
```

## FastAPI 路由

```python
# ✅ 正确：类型注解 + 异步
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)]
) -> UserResponse:
    # 实现逻辑
    pass

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)]
) -> UserResponse:
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

## HTTP 客户端

```python
# ✅ 正确：使用 httpx
import httpx

async def fetch_data(url: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.json()

# ❌ 错误：使用 requests
import requests
response = requests.get(url)
```

## pyproject.toml 配置

```toml
[tool.ruff]
line-length = 100
target-version = "py313"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "UP", "B", "C4", "SIM"]

[tool.mypy]
python_version = "3.13"
strict = true
```
