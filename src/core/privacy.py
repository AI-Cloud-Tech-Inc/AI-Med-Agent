"""Privacy and access control policies for clinical data."""

from enum import Enum
from typing import Dict, Set


class AccessRole(Enum):
    DOCTOR = "doctor"
    PATIENT = "patient"
    AGENT = "agent"
    ADMIN = "admin"


class DataResource(Enum):
    LAB_REPORTS = "lab_reports"
    MEDICATIONS = "medications"
    APPOINTMENTS = "appointments"
    INSURANCE = "insurance"
    TRANSCRIPTS = "transcripts"
    CLINICAL_NOTES = "clinical_notes"
    RECOMMENDATIONS = "recommendations"
    EMERGENCY_EVENTS = "emergency_events"


class AccessLevel(Enum):
    READ = "read"
    WRITE = "write"


class PrivacyPolicy:
    """Enforce least-privilege access to clinical data."""

    def __init__(self) -> None:
        self._read_permissions: Dict[AccessRole, Set[DataResource]] = {
            AccessRole.DOCTOR: set(DataResource),
            AccessRole.AGENT: set(DataResource),
            AccessRole.ADMIN: set(DataResource),
            AccessRole.PATIENT: {
                DataResource.LAB_REPORTS,
                DataResource.MEDICATIONS,
                DataResource.APPOINTMENTS,
                DataResource.INSURANCE,
                DataResource.EMERGENCY_EVENTS,
            },
        }
        self._write_permissions: Dict[AccessRole, Set[DataResource]] = {
            AccessRole.DOCTOR: set(DataResource),
            AccessRole.AGENT: {
                DataResource.TRANSCRIPTS,
                DataResource.CLINICAL_NOTES,
                DataResource.RECOMMENDATIONS,
                DataResource.EMERGENCY_EVENTS,
            },
            AccessRole.ADMIN: set(DataResource),
            AccessRole.PATIENT: set(),
        }

    def can_access(self, role: AccessRole, resource: DataResource, level: AccessLevel) -> bool:
        permissions = self._read_permissions if level == AccessLevel.READ else self._write_permissions
        return resource in permissions.get(role, set())
