"""Consent management for clinical AI workflows."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List
from datetime import datetime


def _now() -> str:
    return datetime.utcnow().isoformat()


class ConsentType(Enum):
    AUDIO_RECORDING = "audio_recording"
    TRANSCRIPTION = "transcription"
    AI_ASSIST = "ai_assist"


@dataclass
class ConsentRecord:
    patient_id: str
    encounter_id: str
    consent_type: ConsentType
    granted: bool
    actor: str
    timestamp: str = field(default_factory=_now)


class ConsentManager:
    """Manage consent records for encounters."""

    def __init__(self) -> None:
        self._records: Dict[str, List[ConsentRecord]] = {}

    def record_consent(
        self,
        patient_id: str,
        encounter_id: str,
        consent_type: ConsentType,
        granted: bool,
        actor: str,
    ) -> ConsentRecord:
        record = ConsentRecord(
            patient_id=patient_id,
            encounter_id=encounter_id,
            consent_type=consent_type,
            granted=granted,
            actor=actor,
        )
        self._records.setdefault(encounter_id, []).append(record)
        return record

    def has_consent(self, encounter_id: str, consent_type: ConsentType) -> bool:
        for record in self._records.get(encounter_id, []):
            if record.consent_type == consent_type and record.granted:
                return True
        return False
