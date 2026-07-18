import pytest
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.base_class import Base
from app.repositories.base import BaseRepository
from app.repositories.unit_of_work import SqlAlchemyUnitOfWork

class MockUser(Base):
    __tablename__ = "mock_users"
    username: Mapped[str] = mapped_column(String(50), nullable=False)

@pytest.mark.asyncio
async def test_base_repository_and_unit_of_work(db_session: AsyncSession):
    async with db_session.bind.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    repo = BaseRepository(db_session, MockUser)
    uow = SqlAlchemyUnitOfWork(db_session)
    
    async with uow:
        new_user = MockUser(username="test_officer")
        await repo.add(new_user)
        await db_session.flush()
        assert new_user.id is not None
        
    all_users = await repo.list_all()
    assert len(all_users) == 1
    assert all_users[0].username == "test_officer"
    
    user_by_id = await repo.get_by_id(new_user.id)
    assert user_by_id is not None
    assert user_by_id.username == "test_officer"
    
    async with uow:
        await repo.remove(user_by_id)
        
    users_after_delete = await repo.list_all()
    assert len(users_after_delete) == 0
