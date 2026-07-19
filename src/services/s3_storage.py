from src.domain.interfaces.storage import IStorageService
from fastapi import HTTPException, status

class S3StorageService(IStorageService):
    def __init__(self, bucket_name: str = "police-evidence-bucket"):
        self.bucket_name = bucket_name
        self.allowed_mimes = ["image/jpeg", "image/png", "application/pdf", "text/plain"]
        self.max_size_bytes = 5 * 1024 * 1024  # 5MB

    def upload_file(self, file_content: bytes, filename: str, mime_type: str) -> str:
        # Validate size limit of 5MB
        if len(file_content) > self.max_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="STORAGE_001: File size exceeds the maximum limit of 5MB."
            )
        # Validate supported MIME types
        if mime_type not in self.allowed_mimes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"STORAGE_002: File MIME type '{mime_type}' is not supported. Allowed: JPEG, PNG, PDF, TXT."
            )
        
        # Standard cloud storage mock upload URL
        return f"https://{self.bucket_name}.s3.amazonaws.com/evidence/{filename}"
