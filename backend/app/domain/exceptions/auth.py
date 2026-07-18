from app.domain.exceptions.base import DomainException

class AuthenticationException(DomainException):
    def __init__(self, message: str = "Invalid authentication credentials.", code: str = "AUTH_001"):
        super().__init__(message, code)

class TokenExpiredException(AuthenticationException):
    def __init__(self, message: str = "Authentication token has expired.", code: str = "AUTH_002"):
        super().__init__(message, code)

class PermissionDeniedException(DomainException):
    def __init__(self, message: str = "Action not permitted for this officer role.", code: str = "AUTH_003"):
        super().__init__(message, code)
