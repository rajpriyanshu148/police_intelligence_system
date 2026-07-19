import random
import datetime
from langgraph.graph import StateGraph, END
from src.agents.state import AgentState
from src.tools.police_tools import PoliceIntelligenceTools
# Decoupled from database infrastructure

# 1. Define Node Functions
def analyze_complaint_node(state: AgentState) -> dict:
    print("[AgentWorkflow] Running node: analyze_complaint")
    text = state["complaint_text"]
    try:
        category = PoliceIntelligenceTools.classify_complaint(text)
        summary = PoliceIntelligenceTools.summarize_complaint(text)
        entities = PoliceIntelligenceTools.extract_ner(text)
        sev_prio = PoliceIntelligenceTools.predict_severity_and_priority(text)
        
        return {
            "category": category,
            "summary": summary,
            "entities": entities,
            "severity": sev_prio["severity"],
            "priority": sev_prio["priority"]
        }
    except Exception as e:
        return {"error": f"Error in analyze_complaint: {e}"}

def retrieve_legal_and_cases_node(state: AgentState) -> dict:
    print("[AgentWorkflow] Running node: retrieve_legal_and_cases")
    text = state["complaint_text"]
    try:
        rag_data = PoliceIntelligenceTools.retrieve_legal_advisory(text)
        similar_cases = PoliceIntelligenceTools.search_similar_cases(text)
        
        return {
            "legal_sections": rag_data["sections"],
            # If sops are returned separately, extract them
            "sops": [s for s in rag_data["sections"] if "SOP" in s.get("section", "")],
            "similar_cases": similar_cases
        }
    except Exception as e:
        return {"error": f"Error in retrieve_legal_and_cases: {e}"}

def generate_fir_draft_node(state: AgentState) -> dict:
    print("[AgentWorkflow] Running node: generate_fir_draft")
    text = state["complaint_text"]
    try:
        # Formulate context text from retrieved sections
        context_parts = []
        for doc in state.get("legal_sections", []):
            context_parts.append(f"{doc['act']} {doc['section']}: {doc['title']}. {doc['description']}")
        context_str = "\n".join(context_parts)
        
        fir_draft = PoliceIntelligenceTools.generate_fir(text, context_str)
        timeline = PoliceIntelligenceTools.generate_timeline(text)
        status = PoliceIntelligenceTools.predict_case_status(text)
        
        return {
            "fir_draft": fir_draft,
            "timeline": timeline,
            "status": status,
            "approved": state.get("approved", False)
        }
    except Exception as e:
        return {"error": f"Error in generate_fir_draft: {e}"}

def pause_for_review_node(state: AgentState) -> dict:
    print("[AgentWorkflow] Running node: pause_for_review (Awaiting Officer Approval)")
    return {} # No changes, serves as a checkpoint boundary

def finalize_case_node(state: AgentState) -> dict:
    print("[AgentWorkflow] Running node: finalize_case (Logical Finalization)")
    case_no = f"CASE/{datetime.datetime.now().year}/" + str(random.randint(1000, 9999))
    fir_no = f"FIR/{datetime.datetime.now().year}/" + str(random.randint(1000, 9999))
    
    return {
        "case_number": case_no,
        "fir_number": fir_no,
        "status": "Finalized"
    }

# 2. Define Routing Decision
def routing_decision(state: AgentState):
    if state.get("approved") is True:
        return "finalize"
    return "pause"

# 3. Assemble and Compile the Graph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("analyze_complaint", analyze_complaint_node)
workflow.add_node("retrieve_legal_and_cases", retrieve_legal_and_cases_node)
workflow.add_node("generate_fir_draft", generate_fir_draft_node)
workflow.add_node("pause_for_review", pause_for_review_node)
workflow.add_node("finalize_case", finalize_case_node)

# Set execution flow
workflow.set_entry_point("analyze_complaint")
workflow.add_edge("analyze_complaint", "retrieve_legal_and_cases")
workflow.add_edge("retrieve_legal_and_cases", "generate_fir_draft")
workflow.add_edge("generate_fir_draft", "pause_for_review")

# Conditional routing from review
workflow.add_conditional_edges(
    "pause_for_review",
    routing_decision,
    {
        "finalize": "finalize_case",
        "pause": END
    }
)
workflow.add_edge("finalize_case", END)

# Compile LangGraph app
agent_graph = workflow.compile()
print("[AgentWorkflow] LangGraph agent compiled successfully.")
