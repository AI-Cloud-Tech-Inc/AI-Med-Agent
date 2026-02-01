"""Clinical data models for the AI Med Agent."""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from datetime import datetime


def _now() -> str:
    return datetime.utcnow().isoformat()


@dataclass
class PatientProfile:
    patient_id: str
    name: Optional[str] = None
    dob: Optional[str] = None
    sex: Optional[str] = None
    conditions: List[str] = field(default_factory=list)
    medications: List[str] = field(default_factory=list)
    allergies: List[str] = field(default_factory=list)
    insurance: Optional[Dict[str, Any]] = None


@dataclass
class ClinicalObservation:
    category: str
    value: str
    source: str
    confidence: float = 0.6
    timestamp: str = field(default_factory=_now)


@dataclass
class SOAPNote:
    subjective: List[str] = field(default_factory=list)
    objective: List[str] = field(default_factory=list)
    assessment: List[str] = field(default_factory=list)
    plan: List[str] = field(default_factory=list)
    history: List[str] = field(default_factory=list)
    symptoms: List[str] = field(default_factory=list)
    medications: List[str] = field(default_factory=list)
    allergies: List[str] = field(default_factory=list)
    generated_at: str = field(default_factory=_now)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "subjective": self.subjective,
            "objective": self.objective,
            "assessment": self.assessment,
            "plan": self.plan,
            "history": self.history,
            "symptoms": self.symptoms,
            "medications": self.medications,
            "allergies": self.allergies,
            "generated_at": self.generated_at,
        }


@dataclass
class ClinicalRecommendation:
    title: str
    rationale: str
    evidence: List[str] = field(default_factory=list)
    confidence: float = 0.5
    requires_approval: bool = True
    risk_level: str = "medium"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "rationale": self.rationale,
            "evidence": self.evidence,
            "confidence": self.confidence,
            "requires_approval": self.requires_approval,
            "risk_level": self.risk_level,
        }


@dataclass
class EncounterContext:
    encounter_id: str
    patient_profile: PatientProfile
    clinician_id: str
    transcript: List[str] = field(default_factory=list)
    observations: List[ClinicalObservation] = field(default_factory=list)
    soap_note: Optional[SOAPNote] = None
    recommendations: List[ClinicalRecommendation] = field(default_factory=list)
    created_at: str = field(default_factory=_now)
