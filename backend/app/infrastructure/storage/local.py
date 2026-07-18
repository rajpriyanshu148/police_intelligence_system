import os
import anyio
from pathlib import Path
from app.domain.interfaces.storage import IStorageService
from app.domain.exceptions.base import DomainException
from app.core.settings import settings

class LocalStorageAdapter(IStorageService):
    def __init__(self, root_dir: str = None):
        self.root_path = Path(root_dir or settings.LOCAL_STORAGE_ROOT).resolve()
        # Ensure root directory exists
        self.root_path.mkdir(parents=True, exist_ok=True)

    def _safe_resolve(self, storage_path: str) -> Path:
        """Resolve storage_path safely within the root path to prevent path traversal."""
        # Sanitize path separators and strip leading dots/slashes
        clean_path = storage_path.replace("\\", "/").strip("/")
        resolved = (self.root_path / clean_path).resolve()
        
        # Verify that the resolved path is inside the root directory
        if not resolved.is_relative_to(self.root_path):
            raise DomainException("Path traversal attempt detected.", "STORAGE_003")
        return resolved

    async def upload_file(self, storage_path: str, file_data: bytes) -> str:
        target_file = self._safe_resolve(storage_path)
        # Create parent directories
        target_file.parent.mkdir(parents=True, exist_ok=True)
        
        def _write():
            with open(target_file, "wb") as f:
                f.write(file_data)
        
        await anyio.to_thread.run_sync(_write)
        return storage_path

    async def download_file(self, storage_path: str) -> bytes:
        target_file = self._safe_resolve(storage_path)
        if not target_file.is_file():
            raise DomainException("Evidence file not found in local storage.", "STORAGE_004")
            
        def _read() -> bytes:
            with open(target_file, "rb") as f:
                return f.read()
                
        return await anyio.to_thread.run_sync(_read)

    async def generate_presigned_upload_url(
        self, storage_path: str, mime_type: str, file_size: int
    ) -> str:
        self._safe_resolve(storage_path)
        return f"http://localhost:8000/api/v1/storage/upload?path={storage_path}"

    async def generate_presigned_download_url(self, storage_path: str) -> str:
        self._safe_resolve(storage_path)
        return f"http://localhost:8000/api/v1/storage/download?path={storage_path}"

    async def delete_file(self, storage_path: str) -> None:
        target_file = self._safe_resolve(storage_path)
        if target_file.is_file():
            def _delete():
                target_file.unlink()
            await anyio.to_thread.run_sync(_delete)
