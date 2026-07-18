import logging
from typing import Any
from app.domain.interfaces.storage import IStorageService
from app.domain.exceptions.base import DomainException
from app.core.settings import settings

logger = logging.getLogger(__name__)

try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False


class S3StorageService(IStorageService):
    def __init__(self):
        self.bucket_name = settings.S3_BUCKET_NAME
        self.region = settings.S3_REGION
        self.s3_client = None
        
        if BOTO3_AVAILABLE:
            try:
                # Initialize s3 client (can pick up credentials from env/IAM role)
                self.s3_client = boto3.client("s3", region_name=self.region)
            except Exception as e:
                logger.warning(f"Could not initialize boto3 S3 client: {e}. Fallback to mock mode.")

    async def upload_file(self, storage_path: str, file_data: bytes) -> str:
        if not self.s3_client:
            # Fallback mock upload for test environments without boto3 config
            logger.info(f"[Mock S3 Upload] Path: {storage_path}, Size: {len(file_data)} bytes")
            return storage_path

        import anyio
        def _upload():
            try:
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=storage_path,
                    Body=file_data
                )
            except Exception as e:
                raise DomainException(f"S3 upload failed: {e}", "STORAGE_005")
        
        await anyio.to_thread.run_sync(_upload)
        return storage_path

    async def download_file(self, storage_path: str) -> bytes:
        if not self.s3_client:
            # Fallback mock download
            logger.info(f"[Mock S3 Download] Path: {storage_path}")
            return b"Mock S3 file content for path: " + storage_path.encode()

        import anyio
        def _download() -> bytes:
            try:
                response = self.s3_client.get_object(
                    Bucket=self.bucket_name,
                    Key=storage_path
                )
                return response["Body"].read()
            except Exception as e:
                raise DomainException(f"S3 download failed: {e}", "STORAGE_006")

        return await anyio.to_thread.run_sync(_download)

    async def generate_presigned_upload_url(
        self, storage_path: str, mime_type: str, file_size: int
    ) -> str:
        if not self.s3_client:
            return f"https://mock-s3.amazonaws.com/{self.bucket_name}/{storage_path}?presigned=upload"

        import anyio
        def _get_url() -> str:
            try:
                return self.s3_client.generate_presigned_url(
                    "put_object",
                    Params={
                        "Bucket": self.bucket_name,
                        "Key": storage_path,
                        "ContentType": mime_type
                    },
                    ExpiresIn=600  # 10 minutes
                )
            except Exception as e:
                raise DomainException(f"Failed to generate presigned upload URL: {e}", "STORAGE_007")

        return await anyio.to_thread.run_sync(_get_url)

    async def generate_presigned_download_url(self, storage_path: str) -> str:
        if not self.s3_client:
            return f"https://mock-s3.amazonaws.com/{self.bucket_name}/{storage_path}?presigned=download"

        import anyio
        def _get_url() -> str:
            try:
                return self.s3_client.generate_presigned_url(
                    "get_object",
                    Params={
                        "Bucket": self.bucket_name,
                        "Key": storage_path
                    },
                    ExpiresIn=600  # 10 minutes
                )
            except Exception as e:
                raise DomainException(f"Failed to generate presigned download URL: {e}", "STORAGE_008")

        return await anyio.to_thread.run_sync(_get_url)

    async def delete_file(self, storage_path: str) -> None:
        if not self.s3_client:
            logger.info(f"[Mock S3 Delete] Path: {storage_path}")
            return

        import anyio
        def _delete():
            try:
                self.s3_client.delete_object(
                    Bucket=self.bucket_name,
                    Key=storage_path
                )
            except Exception as e:
                raise DomainException(f"S3 deletion failed: {e}", "STORAGE_009")

        await anyio.to_thread.run_sync(_delete)
