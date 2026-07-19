import datetime
from typing import Dict, Any
from src.repositories.unit_of_work import UnitOfWork
from src.domain.dto.workflow_dto import WorkflowResult
from src.database.models import Complaint

class ApprovalService:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def approve_and_finalize_case(self, result: WorkflowResult) -> Dict[str, Any]:
        with self.uow as uow:
            # 1. Check if the complaint already exists in DB
            complaint_rec = uow.db.query(Complaint).filter(
                Complaint.complaint_text == result.complaint.complaint_text
            ).first()
            
            if not complaint_rec:
                complaint_rec = uow.complaints.create(
                    citizen_name=result.complaint.citizen_name,
                    citizen_contact=result.complaint.citizen_contact,
                    complaint_text=result.complaint.complaint_text
                )
                complaint_rec.status = "Processed"
                uow.db.flush()
            else:
                complaint_rec.status = "Processed"
                uow.db.flush()

            # Check if a case already exists for this complaint to ensure idempotency
            from src.database.models import Case
            existing_case = uow.db.query(Case).filter(Case.complaint_id == complaint_rec.id).first()
            if existing_case:
                fir = uow.firs.get_by_case_id(existing_case.id)
                return {
                    "message": "Case and FIR already registered in general diary.",
                    "case_number": existing_case.case_number,
                    "fir_number": fir.fir_number if fir else "N/A",
                    "status": "Finalized"
                }

            # 2. Get assignee officer (seeded inspector sharma)
            officer = uow.officers.get_first_officer()
            officer_id = officer.id if officer else None

            # 3. Save Case record
            new_case = uow.cases.create(
                complaint_id=complaint_rec.id,
                title=result.case.title,
                category=result.case.category,
                severity=result.case.severity,
                priority=result.case.priority,
                status="Under Investigation",
                assigned_officer_id=officer_id,
                case_number=result.case.case_number
            )
            uow.db.flush()

            # 4. Save FIR record
            uow.firs.create(
                case_id=new_case.id,
                fir_number=result.fir.fir_number if result.fir else f"FIR/{datetime.datetime.now().year}/0000",
                draft_text=result.fir.draft_text if result.fir else "No FIR Draft",
                legal_sections=result.fir.legal_sections if result.fir else ""
            )

            # 5. Save Entities
            for ent in result.entities:
                uow.entities.create(
                    case_id=new_case.id,
                    entity_type=ent.entity_type,
                    entity_value=ent.entity_value,
                    confidence=ent.confidence
                )

            # 6. Save Timeline events
            for ev in result.timeline:
                # Parse event timestamps safely
                evt_time = datetime.datetime.utcnow()
                t_str = ev.timestamp
                if "yesterday" in t_str.lower():
                    evt_time = evt_time - datetime.timedelta(days=1)
                elif "last night" in t_str.lower():
                    evt_time = evt_time - datetime.timedelta(days=1)
                
                uow.timelines.create(
                    case_id=new_case.id,
                    event_time=evt_time,
                    title=ev.description[:100],
                    description=ev.description
                )

            # Commit Unit of Work transaction!
            uow.commit()

            return {
                "message": "Case and FIR successfully registered in general diary.",
                "case_number": result.case.case_number,
                "fir_number": result.fir.fir_number if result.fir else "N/A",
                "status": "Finalized"
            }
