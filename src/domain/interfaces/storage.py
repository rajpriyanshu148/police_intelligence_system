from abc import ABC, abstractmethod

class IStorageService(ABC):
    @abstractmethod
    def upload_file(self, file_content: bytes, filename: str, mime_type: str) -> str:
        """Uploads a file to remote cloud storage and returns the public url string."""
        pass
