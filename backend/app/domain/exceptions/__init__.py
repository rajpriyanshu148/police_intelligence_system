from app.domain.exceptions.base import DomainException
from app.domain.exceptions.auth import (
    AuthenticationException,
    TokenExpiredException,
    PermissionDeniedException,
)
from app.domain.exceptions.officer import (
    OfficerNotFoundException,
    OfficerAlreadyExistsException,
    OfficerAccountLockedException,
    OfficerInactiveException,
)
from app.domain.exceptions.citizen import (
    CitizenNotFoundException,
    CitizenAlreadyExistsException,
)
from app.domain.exceptions.complaint import (
    ComplaintNotFoundException,
    InvalidComplaintStateException,
    ComplaintAlreadyPromotedException,
)
from app.domain.exceptions.case import (
    CaseNotFoundException,
    CaseAlreadyExistsException,
    CaseClosedException,
    CaseAssignmentException,
)

__all__ = [
    "DomainException",
    "AuthenticationException",
    "TokenExpiredException",
    "PermissionDeniedException",
    "OfficerNotFoundException",
    "OfficerAlreadyExistsException",
    "OfficerAccountLockedException",
    "OfficerInactiveException",
    "CitizenNotFoundException",
    "CitizenAlreadyExistsException",
    "ComplaintNotFoundException",
    "InvalidComplaintStateException",
    "ComplaintAlreadyPromotedException",
    "CaseNotFoundException",
    "CaseAlreadyExistsException",
    "CaseClosedException",
    "CaseAssignmentException",
]
