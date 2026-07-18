from app.domain.exceptions.base import DomainException


class ComplaintNotFoundException(DomainException):
    def __init__(self, message: str = "Requested complaint record does not exist.", code: str = "COMPLAINT_001"):
        super().__init__(message, code)


class InvalidComplaintStateException(DomainException):
    def __init__(self, message: str = "Complaint is not in a valid state for this action.", code: str = "COMPLAINT_002"):
        super().__init__(message, code)


class ComplaintAlreadyPromotedException(DomainException):
    def __init__(self, message: str = "This complaint has already been promoted to a case.", code: str = "COMPLAINT_003"):
        super().__init__(message, code)
