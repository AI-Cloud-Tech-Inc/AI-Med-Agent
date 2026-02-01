"""Specialized clinical agents for multi-agent orchestration."""

from typing import Dict, Any

from src.core.clinical import EncounterContext
from src.clients.clinical_services import ClinicalNLPService, GuidelineService


class BaseClinicalAgent:
    """Base class for clinical sub-agents."""

    def __init__(self, name: str) -> None:
        self.name = name

    def run(self, encounter: EncounterContext) -> Dict[str, Any]:
        raise NotImplementedError


class TriageAgent(BaseClinicalAgent):
    def __init__(self, nlp_service: ClinicalNLPService) -> None:
        super().__init__("triage")
        self.nlp_service = nlp_service

    def run(self, encounter: EncounterContext) -> Dict[str, Any]:
        symptoms = [obs.value for obs in encounter.observations if obs.category == "symptom"]
        severity = "high" if "chest pain" in symptoms or "shortness of breath" in symptoms else "medium"
        return {
            "priority": severity,
            "symptoms": symptoms,
        }


class DiagnosisAgent(BaseClinicalAgent):
    def __init__(self, guideline_service: GuidelineService) -> None:
        super().__init__("diagnosis")
        self.guideline_service = guideline_service

    def run(self, encounter: EncounterContext) -> Dict[str, Any]:
        return {
            "draft_assessment": encounter.soap_note.assessment if encounter.soap_note else [],
            "requires_review": True,
        }


class MonitoringAgent(BaseClinicalAgent):
    def __init__(self, guideline_service: GuidelineService) -> None:
        super().__init__("monitoring")
        self.guideline_service = guideline_service

    def run(self, encounter: EncounterContext) -> Dict[str, Any]:
        return {
            "monitoring_plan": ["Track vitals", "Monitor reported symptoms"],
            "requires_review": True,
        }


class FollowUpAgent(BaseClinicalAgent):
    def __init__(self, guideline_service: GuidelineService) -> None:
        super().__init__("follow_up")
        self.guideline_service = guideline_service

    def run(self, encounter: EncounterContext) -> Dict[str, Any]:
        return {
            "follow_up": ["Schedule follow-up appointment", "Provide care plan summary"],
            "requires_review": True,
        }


class DocumentationAgent(BaseClinicalAgent):
    def __init__(self, nlp_service: ClinicalNLPService) -> None:
        super().__init__("documentation")
        self.nlp_service = nlp_service

    def run(self, encounter: EncounterContext) -> Dict[str, Any]:
        return {
            "soap_note_ready": encounter.soap_note is not None,
            "note_sections": encounter.soap_note.to_dict() if encounter.soap_note else {},
        }
