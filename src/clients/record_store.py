"""Clinical record storage with privacy enforcement."""

from typing import Dict, Any, List

from src.core.clinical import EncounterContext
from src.core.emergency import EmergencyEvent
from src.core.privacy import PrivacyPolicy, AccessRole, DataResource, AccessLevel


class ClinicalRecordStore:
    """In-memory clinical record store with read-only views."""

    def __init__(self, privacy_policy: PrivacyPolicy) -> None:
        self.privacy_policy = privacy_policy
        self._encounters: Dict[str, List[EncounterContext]] = {}
        self._emergency_events: Dict[str, List[EmergencyEvent]] = {}

    def store_encounter(self, encounter: EncounterContext) -> None:
        self._encounters.setdefault(encounter.patient_profile.patient_id, []).append(encounter)

    def record_emergency_event(self, event: EmergencyEvent) -> None:
        self._emergency_events.setdefault(event.patient_id, []).append(event)

    def get_patient_view(
        self,
        patient_id: str,
        role: AccessRole,
        access_level: AccessLevel,
    ) -> Dict[str, Any]:
        encounters = self._encounters.get(patient_id, [])
        view: Dict[str, Any] = {
            "patient_id": patient_id,
            "lab_reports": [],
            "medications": [],
            "appointments": [],
            "insurance": None,
            "emergency_events": [],
        }

        if not encounters:
            return view

        profile = encounters[-1].patient_profile

        if self.privacy_policy.can_access(role, DataResource.MEDICATIONS, access_level):
            view["medications"] = profile.medications

        if self.privacy_policy.can_access(role, DataResource.INSURANCE, access_level):
            view["insurance"] = profile.insurance

        if self.privacy_policy.can_access(role, DataResource.LAB_REPORTS, access_level):
            view["lab_reports"] = []

        if self.privacy_policy.can_access(role, DataResource.APPOINTMENTS, access_level):
            view["appointments"] = []

        if self.privacy_policy.can_access(role, DataResource.EMERGENCY_EVENTS, access_level):
            view["emergency_events"] = [
                {
                    "encounter_id": event.encounter_id,
                    "reason": event.reason,
                    "confirmed": event.confirmed,
                    "created_at": event.created_at,
                }
                for event in self._emergency_events.get(patient_id, [])
            ]

        return view
