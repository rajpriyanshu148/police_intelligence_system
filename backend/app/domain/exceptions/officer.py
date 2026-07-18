from app.domain.exceptions.base import DomainException


class OfficerNotFoundException(DomainException):
    def __init__(self, message: str = "Requested officer record does not exist.", code: str = "OFFICER_001"):
        super().__init__(message, code)


class OfficerAlreadyExistsException(DomainException):
    def __init__(self, message: str = "An officer with that username, email, or badge number already exists.", code: str = "OFFICER_002"):
        super().__init__(message, code)


class OfficerAccountLockedException(DomainException):
    def __init__(self, message: str = "Officer account is temporarily locked. Please try again later.", code: str = "OFFICER_003"):
        super().__init__(message, code)


class OfficerInactiveException(DomainException):
    def __init__(self, message: str = "Officer account is not active.", code: str = "OFFICER_004"):
        super().__init__(message, code)
