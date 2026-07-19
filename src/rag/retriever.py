from src.vector_store.faiss_store import vector_store

class RAGRetriever:
    def __init__(self, top_k: int = 3):
        self.top_k = top_k

    def retrieve_context(self, query: str) -> dict:
        """
        Retrieves matching legal sections and formats them.
        """
        try:
            results = vector_store.search(query, top_k=self.top_k)
        except Exception as e:
            print(f"[RAG] Search failed: {e}")
            results = []

        legal_sections = []
        sops = []

        for doc in results:
            if "SOP" in doc.get("section", "") or "Standard Operating Procedure" in doc.get("act", ""):
                sops.append(doc)
            else:
                legal_sections.append(doc)

        return {
            "legal_sections": legal_sections,
            "sops": sops,
            "raw_results": results
        }

    def format_context_for_llm(self, retrieval_results: dict) -> str:
        """
        Formats retrieved sections into a clean text context block for prompt injection.
        """
        context_parts = []

        if retrieval_results["legal_sections"]:
            context_parts.append("--- RELATIVE LEGAL CODES (BNS/BNSS/BSA) ---")
            for doc in retrieval_results["legal_sections"]:
                context_parts.append(
                    f"- {doc['act']} | {doc['section']} ({doc['title']}):\n"
                    f"  Description: {doc['description']}\n"
                    f"  Punishment: {doc['punishment']}"
                )

        if retrieval_results["sops"]:
            context_parts.append("\n--- POLICE STANDARD OPERATING PROCEDURES (SOP) ---")
            for doc in retrieval_results["sops"]:
                context_parts.append(
                    f"- {doc['section']} ({doc['title']}):\n"
                    f"  Guidelines: {doc['description']}"
                )

        if not context_parts:
            return "No relevant legal acts or standard operating procedures were found in the database."

        return "\n".join(context_parts)

# Singleton RAG instance
rag_retriever = RAGRetriever()
