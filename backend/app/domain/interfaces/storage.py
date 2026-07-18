from abc import ABC, abstractmethod

class IStorageService(ABC):
    @abstractmethod
    async def upload_file(self, storage_path: str, file_data: bytes) -> str:
        """Saves file directly to storage and returns the storage path."""
        pass

    @abstractmethod
    async def download_file(self, storage_path: str) -> bytes:
        """Retrieves raw file bytes from storage."""
        pass

    @abstractmethod
    async def generate_presigned_upload_url(
        self, storage_path: str, mime_type: str, file_size: int
    ) -> str:
        """Generates a secure temporary URL for uploading files directly."""
        pass

    @abstractmethod
    async def generate_presigned_download_url(self, storage_path: str) -> str:
        """Generates a secure temporary URL for downloading files directly."""
        pass

    @abstractmethod
    async def delete_file(self, storage_path: str) -> None:
        """Soft deletes or removes storage item."""
        pass
