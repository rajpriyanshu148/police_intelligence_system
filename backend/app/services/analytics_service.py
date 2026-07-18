import datetime
from typing import List, Dict, Any, Optional
from uuid import UUID
from app.repositories.analytics_repository import AnalyticsRepository
from app.repositories.administration_repository import SystemSettingRepository, DashboardPreferenceRepository
from app.repositories.case_repository import CaseRepository
from app.repositories.fir_repository import FIRRepository
from app.repositories.complaint_repository import ComplaintRepository

# ── Cache Manager (Thread-safe in-memory cache with TTL) ─────────────────────

class CacheManager:
    _cache: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def get(cls, key: str) -> Optional[Any]:
        entry = cls._cache.get(key)
        if not entry:
            return None
        # Check expiration
        if datetime.datetime.now(datetime.timezone.utc) > entry["expires_at"]:
            del cls._cache[key]
            return None
        return entry["value"]

    @classmethod
    def set(cls, key: str, value: Any, ttl_seconds: int = 300) -> None:
        cls._cache[key] = {
            "value": value,
            "expires_at": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=ttl_seconds)
        }

    @classmethod
    def invalidate(cls, key: str) -> None:
        if key in cls._cache:
            del cls._cache[key]

    @classmethod
    def clear_all(cls) -> None:
        cls._cache.clear()


# ── Analytics Services ───────────────────────────────────────────────────────

class AnalyticsService:
    def __init__(self, analytics_repo: AnalyticsRepository):
        self._repo = analytics_repo

    def resolve_date_range(self, timeframe: str, start_str: Optional[str] = None, end_str: Optional[str] = None):
        now = datetime.datetime.now(datetime.timezone.utc)
        if timeframe == "daily":
            return now - datetime.timedelta(days=1), now
        elif timeframe == "weekly":
            return now - datetime.timedelta(days=7), now
        elif timeframe == "monthly":
            return now - datetime.timedelta(days=30), now
        elif timeframe == "quarterly":
            return now - datetime.timedelta(days=90), now
        elif timeframe == "yearly":
            return now - datetime.timedelta(days=365), now
        elif timeframe == "custom" and start_str and end_str:
            try:
                start = datetime.datetime.fromisoformat(start_str)
                end = datetime.datetime.fromisoformat(end_str)
                return start, end
            except ValueError:
                pass
        # Fallback to monthly
        return now - datetime.timedelta(days=30), now

    async def get_summary_statistics(
        self,
        timeframe: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        start, end = self.resolve_date_range(timeframe, start_date, end_date)

        # Check Cache
        cache_key = f"stats:{timeframe}:{start.isoformat()}:{end.isoformat()}"
        cached = CacheManager.get(cache_key)
        if cached:
            return cached

        # Gather stats concurrently or sequentially
        crimes = await self._repo.get_crime_statistics(start, end)
        complaints = await self._repo.get_complaint_statistics(start, end)
        cases = await self._repo.get_case_statistics(start, end)
        firs = await self._repo.get_fir_statistics(start, end)
        evidences = await self._repo.get_evidence_statistics(start, end)
        officers = await self._repo.get_officer_statistics(start, end)
        ai_stats = await self._repo.get_ai_statistics(start, end)

        # Resolution rate calculation: resolved cases / total cases
        total_cases = cases["total_cases"]
        resolved_count = cases["status_counts"].get("Resolved", 0)
        resolution_rate = round(resolved_count / total_cases, 4) if total_cases > 0 else 0.0

        result = {
            "timeframe": timeframe,
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "crimes": crimes,
            "complaints": complaints,
            "cases": cases,
            "firs": firs,
            "evidences": evidences,
            "officers": officers,
            "ai_stats": ai_stats,
            "resolution_rate": resolution_rate
        }

        # Cache for 5 minutes
        CacheManager.set(cache_key, result, ttl_seconds=300)
        return result


class CrimeIntelligenceService:
    def __init__(self, analytics_repo: AnalyticsRepository):
        self._repo = analytics_repo

    async def get_crime_hotspots(
        self,
        timeframe: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        # Formulate Hotspots and GeoJSON output mappings
        start, end = self._repo.db.execute # not directly, we resolve it
        now = datetime.datetime.now(datetime.timezone.utc)
        start_t = now - datetime.timedelta(days=30)
        
        crimes = await self._repo.get_crime_statistics(start_t, now)
        
        # Simple simulated GeoJSON coordinates map based on crime category categories
        geojson_features = []
        simulated_coords = {
            "Theft": [77.2197, 28.6304],     # Connaught Place
            "Assault": [77.2090, 28.6139],   # New Delhi
            "Trespass": [77.2219, 28.6250],  # India Gate
            "Cybercrime": [77.2000, 28.5800] # Lodhi Road
        }

        for c in crimes:
            coords = simulated_coords.get(c["category"], [77.2200, 28.6200])
            geojson_features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": coords
                },
                "properties": {
                    "category": c["category"],
                    "crime_count": c["count"],
                    "density": "High" if c["count"] > 10 else "Medium"
                }
            })

        return {
            "type": "FeatureCollection",
            "features": geojson_features
        }


class DashboardService:
    def __init__(
        self,
        analytics_service: AnalyticsService,
        pref_repo: DashboardPreferenceRepository,
        setting_repo: SystemSettingRepository,
        case_repo: CaseRepository,
        fir_repo: FIRRepository,
        complaint_repo: ComplaintRepository
    ):
        self.analytics = analytics_service
        self.prefs = pref_repo
        self.settings = setting_repo
        self.cases = case_repo
        self.firs = fir_repo
        self.complaints = complaint_repo

    async def get_dashboard_preference(self, officer_id: UUID) -> Dict[str, Any]:
        pref = await self.prefs.get_by_officer_id(officer_id)
        if pref:
            import json
            return json.loads(pref.preference_json)
        return {"layouts": "default"}

    async def save_dashboard_preference(self, officer_id: UUID, prefs: Dict[str, Any]) -> None:
        import json
        pref = await self.prefs.get_by_officer_id(officer_id)
        if pref:
            pref.preference_json = json.dumps(prefs)
        else:
            from app.models.administration import DashboardPreference
            new_pref = DashboardPreference(
                id=uuid4() if "uuid4" in globals() else None, # Let's import uuid4
                officer_id=officer_id,
                preference_json=json.dumps(prefs)
            )
            # Ensure UUID is generated
            if not new_pref.id:
                from uuid import uuid4
                new_pref.id = uuid4()
            await self.prefs.add(new_pref)
        await self.prefs.db.flush()
