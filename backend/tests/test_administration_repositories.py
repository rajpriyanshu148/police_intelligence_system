import pytest
from uuid import uuid4
from app.models.administration import SystemSetting, PoliceStation, LegalDictionary
from app.repositories.administration_repository import (
    SystemSettingRepository, PoliceStationRepository, LegalDictionaryRepository
)

@pytest.mark.asyncio
async def test_admin_repositories_crud(db_session):
    setting_repo = SystemSettingRepository(db_session)
    station_repo = PoliceStationRepository(db_session)
    dict_repo = LegalDictionaryRepository(db_session)

    # 1. System Setting
    setting = SystemSetting(key="TEST_KEY", value="test_val", description="Test Setting")
    await setting_repo.add(setting)
    await db_session.flush()

    res_setting = await setting_repo.get_by_key("TEST_KEY")
    assert res_setting is not None
    assert res_setting.value == "test_val"

    # 2. Police Station
    station = PoliceStation(id=uuid4(), code="STN-001", name="CP Station", district="New Delhi", state="Delhi")
    await station_repo.add(station)
    await db_session.flush()

    res_station = await station_repo.get_by_code("STN-001")
    assert res_station is not None
    assert res_station.name == "CP Station"

    # 3. Legal Dictionary
    dict_entry = LegalDictionary(
        id=uuid4(), act_name="BNS", section_code="Section 303",
        title="Theft", description="Definition of theft", punishment="Imprisonment"
    )
    await dict_repo.add(dict_entry)
    await db_session.flush()

    res_dict = await dict_repo.get_section("BNS", "Section 303")
    assert res_dict is not None
    assert res_dict.title == "Theft"
