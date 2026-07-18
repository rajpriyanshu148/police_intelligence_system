from app.domain.exceptions.base import DomainException


class CitizenNotFoundException(DomainException):
    def __init__(self, message: str = "Requested citizen record does not exist.", code: str = "CITIZEN_001"):
        super().__init__(message, code)


class CitizenAlreadyExistsException(DomainException):
    def __init__(self, message: str = "A citizen with that phone number or national ID already exists.", code: str = "CITIZEN_002"):
        super().__init__(message, code)
