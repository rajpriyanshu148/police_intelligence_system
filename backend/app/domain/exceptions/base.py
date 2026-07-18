class DomainException(Exception):
    """Base exception for all domain-specific business logic errors."""
    def __init__(self, message: str, code: str = "DOMAIN_ERROR"):
        super().__init__(message)
        self.message = message
        self.code = code
