"""Emergency escalation models and manager."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Any, Optional

from src.core.audit import AuditEvent, AuditLogger


def _now() -> str:
    return datetime.utcnow().isoformat()


@dataclass
class EmergencyRecommendation:
    severity: str
    reason: str
    recommended_action: str = "call_911"
    confidence: float = 0.5
    created_at: str = field(default_factory=_now)


@dataclass
class EmergencyEvent:
    encounter_id: str
    patient_id: str
    initiated_by: str
    reason: str
    confirmed: bool
    created_at: str = field(default_factory=_now)
    metadata: Dict[str, Any] = field(default_factory=dict)


class EmergencyManager:
    """Manages emergency recommendations and manual escalation events."""

    def __init__(self, audit_logger: Optional[AuditLogger] = None) -> None:
        self.audit_logger = audit_logger or AuditLogger()

    def log_emergency_event(self, event: EmergencyEvent) -> None:
        self.audit_logger.log_event(
            AuditEvent(
                actor_id=event.initiated_by,
                action="emergency_triggered",
                resource_id=event.encounter_id,
                metadata={
                    "patient_id": event.patient_id,
                    "reason": event.reason,
                    "confirmed": event.confirmed,
                    **event.metadata,
                },
            )
        )
