"""Custom business exceptions."""

from fastapi import HTTPException, status


class BaseBusinessException(HTTPException):
    """Base exception for business logic errors."""

    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str | None = None,
    ) -> None:
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code


class UserNotFoundError(BaseBusinessException):
    """Raised when a user is not found."""

    def __init__(self, user_id: int | None = None) -> None:
        detail = "User not found"
        if user_id is not None:
            detail = f"User with ID {user_id} not found"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code="USER_NOT_FOUND",
        )


class EmailAlreadyExistsError(BaseBusinessException):
    """Raised when trying to register with an existing email."""

    def __init__(self, email: str) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email {email} is already registered",
            error_code="EMAIL_ALREADY_EXISTS",
        )


class InvalidCredentialsError(BaseBusinessException):
    """Raised when authentication credentials are invalid."""

    def __init__(self) -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            error_code="INVALID_CREDENTIALS",
        )


class PermissionDeniedError(BaseBusinessException):
    """Raised when user lacks required permissions."""

    def __init__(self, message: str = "Permission denied") -> None:
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=message,
            error_code="PERMISSION_DENIED",
        )


class RoleNotFoundError(BaseBusinessException):
    """Raised when a role is not found."""

    def __init__(self, role_id: int | None = None) -> None:
        detail = "Role not found"
        if role_id is not None:
            detail = f"Role with ID {role_id} not found"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            error_code="ROLE_NOT_FOUND",
        )


class RoleAlreadyExistsError(BaseBusinessException):
    """Raised when trying to create/update a role with an existing name."""

    def __init__(self, name: str) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role {name} already exists",
            error_code="ROLE_ALREADY_EXISTS",
        )


class RoleNameNotFoundError(BaseBusinessException):
    """Raised when one or more role names are not found."""

    def __init__(self, names: list[str] | None = None) -> None:
        detail = "Role not found"
        if names:
            detail = f"Roles not found: {', '.join(names)}"
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="ROLE_NAME_NOT_FOUND",
        )


class PermissionNotFoundError(BaseBusinessException):
    """Raised when one or more permissions are not found."""

    def __init__(self, codes: list[str] | None = None) -> None:
        detail = "Permission not found"
        if codes:
            detail = f"Permissions not found: {', '.join(codes)}"
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="PERMISSION_NOT_FOUND",
        )


class InactiveUserError(BaseBusinessException):
    """Raised when trying to authenticate with an inactive user."""

    def __init__(self) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive",
            error_code="INACTIVE_USER",
        )


class InvalidPasswordError(BaseBusinessException):
    """Raised when password validation fails."""

    def __init__(self, message: str = "Invalid password") -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
            error_code="INVALID_PASSWORD",
        )


class TokenError(BaseBusinessException):
    """Raised when token validation fails."""

    def __init__(self, message: str = "Invalid or expired token") -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=message,
            error_code="TOKEN_ERROR",
        )
