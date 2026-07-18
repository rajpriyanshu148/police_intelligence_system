from app.api.dependencies.database import get_db
from app.api.dependencies.repositories import get_unit_of_work
from app.api.dependencies.auth import get_current_officer, require_roles
from app.api.dependencies.services import get_storage_service
