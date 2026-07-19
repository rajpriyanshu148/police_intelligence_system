import re
from abc import ABC, abstractmethod
from typing import List
from fastapi import HTTPException, status

class ISecurityStage(ABC):
    @abstractmethod
    def validate_or_sanitize(self, text: str) -> str:
        """Validates input or sanitizes contents, returning updated text."""
        pass

class InputLengthStage(ISecurityStage):
    def __init__(self, max_length: int = 4000):
        self.max_length = max_length

    def validate_or_sanitize(self, text: str) -> str:
        if len(text) > self.max_length:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"SECURITY_001: Input exceeds maximum allowed length of {self.max_length} characters."
            )
        return text

class PromptInjectionStage(ISecurityStage):
    # Common jailbreak and prompt override keywords
    ADVERSARIAL_PATTERNS = [
        r"ignore\s+previous\s+instructions",
        r"system\s+prompt",
        r"override\s+parameters",
        r"you\s+are\s+now\s+offline",
        r"act\s+as\s+a\s+developer",
        r"ignore\s+above\s+instructions",
        r"disregard\s+all\s+previous",
        r"bypass\s+security"
    ]

    def validate_or_sanitize(self, text: str) -> str:
        text_lower = text.lower()
        for pattern in self.ADVERSARIAL_PATTERNS:
            if re.search(pattern, text_lower):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="SECURITY_002: Potential prompt injection or jailbreak attempt detected."
                )
        return text

class PIIMaskingStage(ISecurityStage):
    # Sensitive credit cards and Indian Aadhaar numbers
    CC_PATTERN = r"\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b"
    AADHAAR_PATTERN = r"\b\d{4}\s\d{4}\s\d{4}\b"

    def validate_or_sanitize(self, text: str) -> str:
        sanitized = re.sub(self.CC_PATTERN, "[MASKED_CARD]", text)
        sanitized = re.sub(self.AADHAAR_PATTERN, "[MASKED_AADHAAR]", sanitized)
        return sanitized

class SecurityPipeline:
    def __init__(self):
        self.stages: List[ISecurityStage] = [
            InputLengthStage(),
            PromptInjectionStage(),
            PIIMaskingStage()
        ]

    def add_stage(self, stage: ISecurityStage):
        self.stages.append(stage)

    def process(self, text: str) -> str:
        current_text = text
        for stage in self.stages:
            current_text = stage.validate_or_sanitize(current_text)
        return current_text

# Singleton Instance
security_pipeline = SecurityPipeline()
