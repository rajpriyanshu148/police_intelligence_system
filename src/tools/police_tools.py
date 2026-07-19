from pydantic import BaseModel, Field
from typing import List, Dict, Any
from src.models.llm_engine import llm_engine
from src.rag.retriever import rag_retriever

# 1. Input/Output Schemas for validation
class ClassificationInput(BaseModel):
    complaint_text: str

class ClassificationOutput(BaseModel):
    category: str

class NERInput(BaseModel):
    complaint_text: str

class NEROutput(BaseModel):
    entities: Dict[str, str]

class SummaryInput(BaseModel):
    complaint_text: str

class SummaryOutput(BaseModel):
    summary: str

class SeverityPriorityInput(BaseModel):
    complaint_text: str

class SeverityPriorityOutput(BaseModel):
    severity: str
    priority: str

class LegalRetrievalInput(BaseModel):
    complaint_text: str

class LegalRetrievalOutput(BaseModel):
    sections: List[Dict[str, Any]]
    context_text: str

class FIRGenerationInput(BaseModel):
    complaint_text: str
    legal_context: str

class FIRGenerationOutput(BaseModel):
    fir_draft: str

class TimelineInput(BaseModel):
    complaint_text: str

class TimelineOutput(BaseModel):
    events: List[Dict[str, str]]

# 2. Tool Wrappers calling Unified LLM Engine and RAG
class PoliceIntelligenceTools:
    
    @staticmethod
    def classify_complaint(complaint_text: str) -> str:
        """Classifies the crime category of the complaint."""
        return llm_engine.generate_response("complaint_classification", complaint_text)

    @staticmethod
    def extract_ner(complaint_text: str) -> Dict[str, str]:
        """Extracts key entities from the complaint text."""
        raw_ner = llm_engine.generate_response("named_entity_recognition", complaint_text)
        entities = {}
        # Parse output format: "Victim: Complainant; Suspect: Ramesh Kumar; Location: Building Parking; Weapon: None"
        parts = raw_ner.split(";")
        for part in parts:
            if ":" in part:
                k, v = part.split(":", 1)
                entities[k.strip()] = v.strip()
        return entities

    @staticmethod
    def summarize_complaint(complaint_text: str) -> str:
        """Generates a concise summary of the complaint."""
        return llm_engine.generate_response("complaint_summarization", complaint_text)

    @staticmethod
    def predict_severity_and_priority(complaint_text: str) -> Dict[str, str]:
        """Predicts the crime severity and priority classification."""
        sev = llm_engine.generate_response("severity_prediction", complaint_text)
        prio = llm_engine.generate_response("priority_prediction", complaint_text)
        return {
            "severity": sev.strip(),
            "priority": prio.strip()
        }

    @staticmethod
    def retrieve_legal_advisory(complaint_text: str) -> Dict[str, Any]:
        """Queries the RAG retriever to get applicable legal sections (BNS/BNSS/BSA)."""
        retrieved = rag_retriever.retrieve_context(complaint_text)
        context_str = rag_retriever.format_context_for_llm(retrieved)
        return {
            "sections": retrieved["raw_results"],
            "context_text": context_str
        }

    @staticmethod
    def generate_fir(complaint_text: str, legal_context: str) -> str:
        """Drafts the formal FIR document incorporating legal sections."""
        return llm_engine.generate_response("fir_generation", complaint_text, context=legal_context)

    @staticmethod
    def generate_timeline(complaint_text: str) -> List[Dict[str, str]]:
        """Constructs an incident timeline of events."""
        raw_timeline = llm_engine.generate_response("timeline_generation", complaint_text)
        events = []
        # Parse timeline representation: "[Date Time] Event Description -> [Date Time] Event..."
        # or simple line-by-line format
        lines = raw_timeline.split("\n")
        for line in lines:
            line = line.strip()
            if not line:
                continue
            # Parse format: "[Time] Description"
            if line.startswith("[") and "]" in line:
                end_bracket = line.find("]")
                timestamp = line[1:end_bracket]
                desc = line[end_bracket+1:].strip()
                if desc.startswith("->"):
                    desc = desc[2:].strip()
                events.append({"timestamp": timestamp, "description": desc})
            else:
                events.append({"timestamp": "Incident Hour", "description": line})
        return events

    @staticmethod
    def search_similar_cases(complaint_text: str) -> List[Dict[str, Any]]:
        """Simulates search for prior cases in the archives with high similarity."""
        # Simple simulated similar cases
        category = llm_engine.generate_response("complaint_classification", complaint_text)
        if "Theft" in category:
            return [
                {"case_number": "CASE/2025/1102", "title": "Stolen smartphone at Metro Gates", "similarity_score": 0.89, "status": "Closed"},
                {"case_number": "CASE/2024/0932", "title": "Pickpocket incident in bus", "similarity_score": 0.74, "status": "Closed"}
            ]
        elif "Robbery" in category:
            return [
                {"case_number": "CASE/2025/1429", "title": "Highway motorcycle robbery", "similarity_score": 0.82, "status": "Under Trial"},
                {"case_number": "CASE/2024/2041", "title": "Daylight chain snatching at park", "similarity_score": 0.79, "status": "Closed"}
            ]
        elif "Fraud" in category or "Cheating" in category:
            return [
                {"case_number": "CASE/2025/0023", "title": "KYC debit card fraud phone call", "similarity_score": 0.94, "status": "Under Investigation"},
                {"case_number": "CASE/2024/1108", "title": "Phishing link for bank transfer", "similarity_score": 0.81, "status": "Closed"}
            ]
        else:
            return [
                {"case_number": "CASE/2025/5512", "title": "General nuisance / assault", "similarity_score": 0.71, "status": "Closed"}
            ]
            
    @staticmethod
    def predict_case_status(complaint_text: str) -> str:
        """Predicts case status based on investigation elements."""
        return llm_engine.generate_response("case_status_prediction", complaint_text)
