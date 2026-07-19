from sqlalchemy.orm import Session
from src.database.connection import SessionLocal
from src.domain.interfaces.unit_of_work import IUnitOfWork
from src.repositories.complaint_repository import ComplaintRepository
from src.repositories.case_repository import CaseRepository
from src.repositories.officer_repository import OfficerRepository
from src.repositories.fir_repository import FIRRepository
from src.repositories.entity_repository import EntityRepository
from src.repositories.timeline_repository import TimelineRepository

class UnitOfWork(IUnitOfWork):
    def __init__(self, session_factory=SessionLocal):
        self.session_factory = session_factory
        self.db: Session = None

    def __enter__(self):
        self.db = self.session_factory()
        self.complaints = ComplaintRepository(self.db)
        self.cases = CaseRepository(self.db)
        self.officers = OfficerRepository(self.db)
        self.firs = FIRRepository(self.db)
        self.entities = EntityRepository(self.db)
        self.timelines = TimelineRepository(self.db)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            if exc_type is not None:
                self.rollback()
        finally:
            self.db.close()

    def commit(self):
        if self.db:
            self.db.commit()

    def rollback(self):
        if self.db:
            self.db.rollback()
