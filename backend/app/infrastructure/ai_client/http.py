from typing import Dict, Any
from app.domain.interfaces.ai_client import IAIClient

class HttpAIClient(IAIClient):
    async def process_complaint(self, citizen_name: str, citizen_contact: str, complaint_text: str) -> Dict[str, Any]:
        return {
            "status": "Under Investigation",
            "complaint": {
                "citizen_name": citizen_name,
                "citizen_contact": citizen_contact,
                "complaint_text": complaint_text
            },
            "case": {
                "title": "Investigation into Theft",
                "category": "Theft",
                "severity": "Low",
                "priority": "P3",
                "case_number": "CASE/2026/1082"
            },
            "entities": [
                {"entity_type": "Suspect", "entity_value": "unknown suspect", "confidence": 0.8}
            ],
            "fir": {
                "draft_text": "Drafted FIR details...",
                "fir_number": "FIR/2026/0108"
            },
            "timeline": ["Occurred yesterday at market"]
        }

    async def approve_case(self, case_state: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "message": "Case and FIR successfully registered in general diary.",
            "case_number": "CASE/2026/1082",
            "fir_number": "FIR/2026/0108",
            "status": "Finalized"
        }
