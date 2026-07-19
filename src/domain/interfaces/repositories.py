from abc import ABC, abstractmethod
from typing import List, Optional, Any
from uuid import UUID
from src.database.models import Complaint, Case, FIR, Entity, TimelineEvent, Officer

class IComplaintRepository(ABC):
    @abstractmethod
    def get_by_id(self, complaint_id: UUID) -> Optional[Complaint]:
        pass
    
    @abstractmethod
    def list_all(self) -> List[Complaint]:
        pass
        
    @abstractmethod
    def create(self, citizen_name: str, citizen_contact: str, complaint_text: str) -> Complaint:
        pass

class ICaseRepository(ABC):
    @abstractmethod
    def get_by_id(self, case_id: UUID) -> Optional[Case]:
        pass
        
    @abstractmethod
    def list_all(self) -> List[Case]:
        pass
        
    @abstractmethod
    def list_paginated(self, limit: int, offset: int) -> List[Case]:
        pass
        
    @abstractmethod
    def count(self) -> int:
        pass
        
    @abstractmethod
    def get_severity_breakdown(self) -> dict:
        pass
        
    @abstractmethod
    def get_status_breakdown(self) -> dict:
        pass
        
    @abstractmethod
    def get_category_breakdown(self) -> dict:
        pass
        
    @abstractmethod
    def create(self, complaint_id: UUID, title: str, category: str, severity: str, priority: str, status: str, assigned_officer_id: Optional[UUID], case_number: str) -> Case:
        pass

class IOfficerRepository(ABC):
    @abstractmethod
    def get_by_id(self, officer_id: UUID) -> Optional[Officer]:
        pass
        
    @abstractmethod
    def get_by_username(self, username: str) -> Optional[Officer]:
        pass
        
    @abstractmethod
    def get_first_officer(self) -> Optional[Officer]:
        pass

class IFIRRepository(ABC):
    @abstractmethod
    def get_by_case_id(self, case_id: UUID) -> Optional[FIR]:
        pass
        
    @abstractmethod
    def create(self, case_id: UUID, fir_number: str, draft_text: str, legal_sections: str) -> FIR:
        pass

class IEntityRepository(ABC):
    @abstractmethod
    def get_by_case_id(self, case_id: UUID) -> List[Entity]:
        pass
        
    @abstractmethod
    def create(self, case_id: UUID, entity_type: str, entity_value: str, confidence: float) -> Entity:
        pass

class ITimelineRepository(ABC):
    @abstractmethod
    def get_by_case_id(self, case_id: UUID) -> List[TimelineEvent]:
        pass
        
    @abstractmethod
    def create(self, case_id: UUID, event_time: Any, title: str, description: str) -> TimelineEvent:
        pass
