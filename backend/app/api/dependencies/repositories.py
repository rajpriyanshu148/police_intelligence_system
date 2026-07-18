from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies.database import get_db
from app.domain.interfaces.unit_of_work import IUnitOfWork
from app.repositories.unit_of_work import SqlAlchemyUnitOfWork

def get_unit_of_work(db: AsyncSession = Depends(get_db)) -> IUnitOfWork:
    return SqlAlchemyUnitOfWork(db)
