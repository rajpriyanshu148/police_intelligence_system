import os
import json
import numpy as np
from pathlib import Path
from src.utils.config_loader import config, PROJECT_ROOT

# We use sentence-transformers to embed text
try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None

# Try importing FAISS, fallback to pure numpy if unavailable
try:
    import faiss
except ImportError:
    faiss = None

class MockEmbedder:
    def __init__(self, dimension=384):
        self.dimension = dimension
        
    def encode(self, texts, show_progress_bar=False):
        embeddings = []
        for text in texts:
            vec = np.zeros(self.dimension, dtype='float32')
            words = text.lower().split()
            for i, word in enumerate(words):
                h = abs(hash(word)) % self.dimension
                vec[h] += 1.0 / (i + 1.0)
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            embeddings.append(vec)
        return np.array(embeddings)

class FAISSVectorStore:
    def __init__(self):
        self.embedding_model_name = config["vector_store"]["embedding_model"]
        self.index_path = Path(config["vector_store"]["index_path"])
        self.data_path = PROJECT_ROOT / "data" / "legal_docs_sample.json"
        
        self.model = None
        self.index = None
        self.documents = []
        self.embeddings = None # Used for fallback search
        self._embedding_cache = {}

    def _initialize_model(self):
        if self.model is None:
            if SentenceTransformer is not None:
                try:
                    # Load embedding model onto CPU for lightweight use
                    self.model = SentenceTransformer(self.embedding_model_name, device="cpu")
                except Exception as e:
                    print(f"[VectorStore] Warning: Failed to load sentence-transformers model online. Falling back to MockEmbedder. Error: {e}")
                    self.model = MockEmbedder()
            else:
                print("[VectorStore] sentence-transformers package is not installed. Falling back to MockEmbedder.")
                self.model = MockEmbedder()

    def load_documents(self) -> list:
        if not self.data_path.exists():
            return []
        with open(self.data_path, "r") as f:
            return json.load(f)

    def build_index(self):
        self._initialize_model()
        self.documents = self.load_documents()
        if not self.documents:
            print("[VectorStore] No documents found to index.")
            return

        # Prepare corpus texts
        texts = [
            f"{doc['act']} - {doc['section']}: {doc['title']}. {doc['description']}"
            for doc in self.documents
        ]
        
        print(f"[VectorStore] Generating embeddings for {len(texts)} legal articles...")
        embeddings = self.model.encode(texts, show_progress_bar=False)
        self.embeddings = np.array(embeddings).astype('float32')

        dimension = self.embeddings.shape[1]
        
        if faiss is not None:
            # Create a L2 distance index or Inner Product index
            self.index = faiss.IndexFlatIP(dimension) # Cosine similarity if normalized
            # Normalize embeddings for cosine similarity
            faiss.normalize_L2(self.embeddings)
            self.index.add(self.embeddings)
            
            # Save the index and docs
            os.makedirs(self.index_path, exist_ok=True)
            faiss.write_index(self.index, str(self.index_path / "legal.index"))
            with open(self.index_path / "docs.json", "w") as f:
                json.dump(self.documents, f, indent=2)
            print(f"[VectorStore] FAISS index built and saved to {self.index_path}")
        else:
            # Save embeddings as numpy file for fallback
            os.makedirs(self.index_path, exist_ok=True)
            np.save(str(self.index_path / "embeddings.npy"), self.embeddings)
            with open(self.index_path / "docs.json", "w") as f:
                json.dump(self.documents, f, indent=2)
            print("[VectorStore] FAISS is not installed. Saved index in NumPy format.")

    def load_index(self):
        self._initialize_model()
        docs_file = self.index_path / "docs.json"
        
        if not docs_file.exists():
            print("[VectorStore] Index files not found. Building index from scratch...")
            self.build_index()
            return

        with open(docs_file, "r") as f:
            self.documents = json.load(f)

        if faiss is not None and (self.index_path / "legal.index").exists():
            self.index = faiss.read_index(str(self.index_path / "legal.index"))
            print(f"[VectorStore] Loaded FAISS index from {self.index_path}")
        else:
            npy_file = self.index_path / "embeddings.npy"
            if npy_file.exists():
                self.embeddings = np.load(str(npy_file))
                print("[VectorStore] Loaded NumPy embeddings (FAISS fallback).")
            else:
                self.build_index()

    def search(self, query: str, top_k: int = 3) -> list:
        import time
        from src.utils.telemetry import telemetry
        start_time = time.time()
        
        if not self.documents:
            self.load_index()

        if not self.documents:
            return []

        # LRU Embedding Caching
        if query in self._embedding_cache:
            query_vector = self._embedding_cache[query].copy()
        else:
            self._initialize_model()
            query_vector = self.model.encode([query]).astype('float32')
            if len(self._embedding_cache) >= 1000:
                first_key = next(iter(self._embedding_cache))
                self._embedding_cache.pop(first_key)
            self._embedding_cache[query] = query_vector.copy()

        results = []
        if faiss is not None and self.index is not None:
            faiss.normalize_L2(query_vector)
            scores, indices = self.index.search(query_vector, top_k)
            for score, idx in zip(scores[0], indices[0]):
                if idx < len(self.documents) and idx >= 0:
                    doc = self.documents[idx].copy()
                    doc["similarity_score"] = float(score)
                    results.append(doc)
        else:
            if self.embeddings is None:
                return []
            
            q_norm = query_vector / np.linalg.norm(query_vector)
            corpus_norms = np.linalg.norm(self.embeddings, axis=1, keepdims=True)
            corpus_norms[corpus_norms == 0] = 1.0
            e_norm = self.embeddings / corpus_norms
            
            similarities = np.dot(e_norm, q_norm.T).flatten()
            top_indices = np.argsort(similarities)[::-1][:top_k]
            
            for idx in top_indices:
                if idx < len(self.documents):
                    doc = self.documents[idx].copy()
                    doc["similarity_score"] = float(similarities[idx])
                    results.append(doc)

        duration = time.time() - start_time
        telemetry.record_vector_search(duration)
        return results

# Singleton instance
vector_store = FAISSVectorStore()
