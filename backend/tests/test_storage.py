import pytest
import tempfile
import os
import shutil
from pathlib import Path
from app.infrastructure.storage.local import LocalStorageAdapter
from app.infrastructure.storage.s3 import S3StorageService
from app.domain.exceptions.base import DomainException

@pytest.mark.asyncio
async def test_local_storage_adapter_crud():
    with tempfile.TemporaryDirectory() as tmpdir:
        adapter = LocalStorageAdapter(root_dir=tmpdir)
        
        # Test upload
        path = "cases/case123/evidence/item.txt"
        content = b"evidence file data content"
        await adapter.upload_file(path, content)
        
        # Test download
        retrieved = await adapter.download_file(path)
        assert retrieved == content
        
        # Test generate URLs
        up_url = await adapter.generate_presigned_upload_url(path, "text/plain", len(content))
        down_url = await adapter.generate_presigned_download_url(path)
        assert "upload" in up_url
        assert "download" in down_url
        
        # Test delete
        await adapter.delete_file(path)
        
        # Download deleted file should raise error
        with pytest.raises(DomainException) as exc:
            await adapter.download_file(path)
        assert exc.value.code == "STORAGE_004"


@pytest.mark.asyncio
async def test_local_storage_path_traversal_protection():
    with tempfile.TemporaryDirectory() as tmpdir:
        adapter = LocalStorageAdapter(root_dir=tmpdir)
        bad_path = "../../../etc/passwd"
        
        with pytest.raises(DomainException) as exc:
            await adapter.upload_file(bad_path, b"malicious")
        assert exc.value.code == "STORAGE_003"


@pytest.mark.asyncio
async def test_s3_storage_mock_fallback():
    # Test that S3 adapter falls back to mock gracefully without real S3
    s3_service = S3StorageService()
    path = "cases/case123/evidence/media.mp4"
    content = b"video data"
    
    # Upload and download
    uploaded_path = await s3_service.upload_file(path, content)
    assert uploaded_path == path
    
    retrieved = await s3_service.download_file(path)
    assert b"Mock S3 file content" in retrieved
    
    up_url = await s3_service.generate_presigned_upload_url(path, "video/mp4", len(content))
    down_url = await s3_service.generate_presigned_download_url(path)
    assert "mock-s3" in up_url
    assert "mock-s3" in down_url
