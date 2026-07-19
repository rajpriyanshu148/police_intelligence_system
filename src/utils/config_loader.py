import os
import yaml
from pathlib import Path
from pydantic import BaseModel, Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# 1. Dynamic Project Root Detection
def find_project_root() -> Path:
    """Searches upward from the current file to find the project root directory."""
    current = Path(__file__).resolve().parent
    for parent in [current] + list(current.parents):
        if (parent / ".git").exists() or (parent / "pyproject.toml").exists() or (parent / "configs").exists():
            return parent
    # Fallback to three levels up
    return Path(__file__).resolve().parent.parent.parent

PROJECT_ROOT = find_project_root()

# 2. Pydantic Configuration Model Definitions
class AppSettings(BaseModel):
    name: str = Field(default="Agentic AI Police Intelligence and Assistance System", validation_alias="APP_NAME")
    debug: bool = Field(default=True, validation_alias="APP_DEBUG")
    host: str = Field(default="127.0.0.1", validation_alias="APP_HOST")
    port: int = Field(default=8000, validation_alias="APP_PORT")
    secret_key: str = Field(default="POLICE_INTEL_SUPER_SECRET_KEY_JWT", validation_alias="JWT_SECRET_KEY")
    
    # Centralized logging configuration placeholders
    log_level: str = Field(default="INFO", validation_alias="LOG_LEVEL")
    log_format: str = Field(
        default="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level:8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        validation_alias="LOG_FORMAT"
    )
    log_file: str = Field(default="logs/police_system.log", validation_alias="LOG_FILE")

class DatabaseSettings(BaseModel):
    url: str = Field(default="sqlite:///police_intel.db", validation_alias="DATABASE_URL")

class LoraSettings(BaseModel):
    r: int = Field(default=8, validation_alias="LORA_R")
    alpha: int = Field(default=16, validation_alias="LORA_ALPHA")
    dropout: float = Field(default=0.05, validation_alias="LORA_DROPOUT")
    target_modules: list[str] = Field(default=["q_proj", "v_proj", "k_proj", "o_proj"], validation_alias="LORA_TARGET_MODULES")

class ModelTrainingSettings(BaseModel):
    epochs: int = Field(default=3, validation_alias="MODEL_TRAINING_EPOCHS")
    batch_size: int = Field(default=2, validation_alias="MODEL_TRAINING_BATCH_SIZE")
    learning_rate: float = Field(default=2e-4, validation_alias="MODEL_TRAINING_LEARNING_RATE")
    output_dir: str = Field(default="models/adapters", validation_alias="MODEL_TRAINING_OUTPUT_DIR")

class ModelSettings(BaseModel):
    name_or_path: str = Field(default="Qwen/Qwen2.5-3B-Instruct", validation_alias="MODEL_NAME_OR_PATH")
    use_simulation: bool = Field(default=True, validation_alias="USE_SIMULATION")
    device: str = Field(default="cpu", validation_alias="MODEL_DEVICE")
    lora: LoraSettings = LoraSettings()
    training: ModelTrainingSettings = ModelTrainingSettings()

class VectorStoreSettings(BaseModel):
    index_path: str = Field(default="data/faiss_index", validation_alias="VECTOR_STORE_INDEX_PATH")
    embedding_model: str = Field(default="sentence-transformers/all-MiniLM-L6-v2", validation_alias="VECTOR_STORE_EMBEDDING_MODEL")

class RagSettings(BaseModel):
    top_k: int = Field(default=3, validation_alias="RAG_TOP_K")
    sop_weight: float = Field(default=0.5, validation_alias="RAG_SOP_WEIGHT")
    bns_weight: float = Field(default=0.5, validation_alias="RAG_BNS_WEIGHT")

class Settings(BaseSettings):
    app: AppSettings = AppSettings()
    database: DatabaseSettings = DatabaseSettings()
    model: ModelSettings = ModelSettings()
    vector_store: VectorStoreSettings = VectorStoreSettings()
    rag: RagSettings = RagSettings()

    model_config = SettingsConfigDict(
        env_nested_delimiter="__",
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @model_validator(mode="after")
    def resolve_paths(self) -> 'Settings':
        """Resolves relative file paths to absolute path strings relative to PROJECT_ROOT."""
        # 1. Database SQLite path
        if self.database.url.startswith("sqlite:///"):
            db_rel = self.database.url.replace("sqlite:///", "")
            db_path = Path(db_rel)
            if not db_path.is_absolute():
                db_path = (PROJECT_ROOT / db_path).resolve()
            self.database.url = f"sqlite:///{db_path.as_posix()}"

        # 2. Model adapters output path
        out_path = Path(self.model.training.output_dir)
        if not out_path.is_absolute():
            out_path = (PROJECT_ROOT / out_path).resolve()
        self.model.training.output_dir = out_path.as_posix()

        # 3. FAISS index directory path
        idx_path = Path(self.vector_store.index_path)
        if not idx_path.is_absolute():
            idx_path = (PROJECT_ROOT / idx_path).resolve()
        self.vector_store.index_path = idx_path.as_posix()

        # 4. Log file path
        log_path = Path(self.app.log_file)
        if not log_path.is_absolute():
            log_path = (PROJECT_ROOT / log_path).resolve()
        self.app.log_file = log_path.as_posix()

        return self

# 3. Load yaml file configuration
def load_yaml_config() -> dict:
    yaml_path = PROJECT_ROOT / "configs" / "config.yaml"
    if yaml_path.exists():
        with open(yaml_path, "r", encoding="utf-8") as f:
            try:
                data = yaml.safe_load(f)
                return data if isinstance(data, dict) else {}
            except Exception as e:
                print(f"[ConfigLoader] Critical error parsing config.yaml: {e}")
                raise
    return {}

# 4. Construct validated Settings object
yaml_config = load_yaml_config()
settings = Settings(**yaml_config)

# 5. Backward Compatibility Dictionary
config = {
    "app": {
        "name": settings.app.name,
        "debug": settings.app.debug,
        "host": settings.app.host,
        "port": settings.app.port,
        "secret_key": settings.app.secret_key,
        "log_level": settings.app.log_level,
        "log_format": settings.app.log_format,
        "log_file": settings.app.log_file
    },
    "database": {
        "url": settings.database.url
    },
    "model": {
        "name_or_path": settings.model.name_or_path,
        "use_simulation": settings.model.use_simulation,
        "device": settings.model.device,
        "lora": {
            "r": settings.model.lora.r,
            "alpha": settings.model.lora.alpha,
            "dropout": settings.model.lora.dropout,
            "target_modules": settings.model.lora.target_modules
        },
        "training": {
            "epochs": settings.model.training.epochs,
            "batch_size": settings.model.training.batch_size,
            "learning_rate": settings.model.training.learning_rate,
            "output_dir": settings.model.training.output_dir
        }
    },
    "vector_store": {
        "index_path": settings.vector_store.index_path,
        "embedding_model": settings.vector_store.embedding_model
    },
    "rag": {
        "top_k": settings.rag.top_k,
        "sop_weight": settings.rag.sop_weight,
        "bns_weight": settings.rag.bns_weight
    }
}
