from typing import Dict, Any
from src.agents.workflow import agent_graph
from src.domain.dto.workflow_dto import WorkflowResult, map_state_to_workflow_result

class WorkflowService:
    def execute_workflow(self, state: Dict[str, Any]) -> WorkflowResult:
        result_state = agent_graph.invoke(state)
        if result_state.get("error"):
            raise ValueError(result_state["error"])
        return map_state_to_workflow_result(result_state)
