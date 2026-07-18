from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.audit import LoginLog, AuditLog


class LoginLogRepository(BaseRepository[LoginLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, LoginLog)


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, AuditLog)
