import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field

class CreateEvidenceUploadRequest(BaseModel):
    file_name: str = Field(min_length=1, max_length=255)
    file_size: int = Field(gt=0)
    mime_type: str = Field(min_length=3, max_length=100)
    category: str = Field(pattern="^(Image|PDF|Video|Audio|Physical Evidence Photos|Forensic Reports|Other)$")
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=5, max_length=1000)
    
    # Metadata fields (optional)
    captured_at: Optional[datetime.datetime] = None
    gps_location: Optional[str] = Field(default=None, max_length=100)
    device_model: Optional[str] = Field(default=None, max_length=100)
    exif_present: Optional[bool] = None


class ConfirmEvidenceUploadRequest(BaseModel):
    evidence_id: UUID
    version_number: int = Field(gt=0)
    storage_path: str = Field(min_length=5, max_length=512)
    sha256_hash: str = Field(min_length=64, max_length=64)


class EvidenceOut(BaseModel):
    id: UUID
    case_id: UUID
    title: str
    category: str
    description: str
    status: str
    current_version: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


class EvidenceVersionOut(BaseModel):
    id: UUID
    evidence_id: UUID
    version_number: int
    storage_path: str
    file_name: str
    mime_type: str
    file_size: int
    sha256_hash: str
    hash_algorithm: str
    uploaded_by: UUID
    scan_status: Optional[str]
    scan_engine: Optional[str]
    scan_time: Optional[datetime.datetime]
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class PresignedUploadResponse(BaseModel):
    upload_url: str
    storage_path: str
    evidence_id: UUID
    version_number: int


class PresignedDownloadResponse(BaseModel):
    download_url: str
    sha256_hash: str
    hash_algorithm: str
