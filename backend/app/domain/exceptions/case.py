from app.domain.exceptions.base import DomainException


class CaseNotFoundException(DomainException):
    def __init__(self, message: str = "Requested case diary does not exist.", code: str = "CASE_001"):
        super().__init__(message, code)


class CaseAlreadyExistsException(DomainException):
    def __init__(self, message: str = "A case diary has already been registered for this complaint.", code: str = "CASE_002"):
        super().__init__(message, code)


class CaseClosedException(DomainException):
    def __init__(self, message: str = "This case is closed and cannot be modified.", code: str = "CASE_003"):
        super().__init__(message, code)


class CaseAssignmentException(DomainException):
    def __init__(self, message: str = "Only the assigned investigator may modify this case.", code: str = "CASE_004"):
        super().__init__(message, code)
