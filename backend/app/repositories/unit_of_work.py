from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.interfaces.unit_of_work import IUnitOfWork

class SqlAlchemyUnitOfWork(IUnitOfWork):
    def __init__(self, db: AsyncSession):
        self.db = db

    async def commit(self) -> None:
        await self.db.commit()

    async def rollback(self) -> None:
        await self.db.rollback()
