import os
import hashlib
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.utils.config_loader import config
from src.database.models import Base, Officer

DATABASE_URL = config["database"]["url"]

# Handle directory creation if SQLite is used
if DATABASE_URL.startswith("sqlite:///"):
    db_path = DATABASE_URL.replace("sqlite:///", "")
    db_dir = os.path.dirname(db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

pool_args = {}
if DATABASE_URL.startswith("sqlite"):
    pool_args["connect_args"] = {"check_same_thread": False}
else:
    pool_args["pool_size"] = 10
    pool_args["max_overflow"] = 20
    pool_args["pool_recycle"] = 1800
    pool_args["pool_pre_ping"] = True

engine = create_engine(DATABASE_URL, **pool_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_password(password: str) -> str:
    """Helper to hash password with SHA-256 (no extra complex dependencies)"""
    salt = "police_intel_salt_123!"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def init_db():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Check if we need to seed a default officer
    db = SessionLocal()
    try:
        officer_count = db.query(Officer).count()
        if officer_count == 0:
            default_officer = Officer(
                id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
                username="inspector_sharma",
                email="sharma.inspector@police.gov.in",
                password_hash=hash_password("password123"),
                badge_number="IND-10827",
                department="Crime Branch",
                role="Investigator"
            )
            db.add(default_officer)
            db.commit()
            print("[DB] Seeded default officer: inspector_sharma / password123")
    except Exception as e:
        print(f"[DB] Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()
