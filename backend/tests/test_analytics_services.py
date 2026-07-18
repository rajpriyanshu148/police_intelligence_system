import pytest
import datetime
from uuid import uuid4
from app.repositories.analytics_repository import AnalyticsRepository
from app.services.analytics_service import AnalyticsService, CacheManager

@pytest.mark.asyncio
async def test_analytics_service_caching(db_session):
    analytics_repo = AnalyticsRepository(db_session)
    service = AnalyticsService(analytics_repo)

    # 1. First invocation (populates cache)
    res1 = await service.get_summary_statistics("weekly")
    assert res1 is not None

    # Check that cache contains entries
    keys = list(CacheManager._cache.keys())
    assert len(keys) > 0

    # 2. Invalidate cache
    CacheManager.clear_all()
    assert len(CacheManager._cache) == 0
