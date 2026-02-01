"""Clinical AI service stubs for transcription, NLP, and guidelines."""

from typing import List
from collections import defaultdict

from src.core.clinical import ClinicalObservation, SOAPNote, PatientProfile, ClinicalRecommendation


class RealTimeTranscriber:
    """Simple in-memory transcriber placeholder."""

    def __init__(self) -> None:
        self._sessions = defaultdict(list)

    def start_session(self, encounter_id: str) -> None:
        self._sessions[encounter_id] = []

    def ingest_text_chunk(self, encounter_id: str, chunk: str) -> None:
        self._sessions[encounter_id].append(chunk)

    def get_transcript(self, encounter_id: str) -> str:
        return " ".join(self._sessions.get(encounter_id, []))


class ClinicalNLPService:
    """Lightweight NLP extraction and SOAP note builder."""

    SYMPTOM_KEYWORDS = ["fever", "cough", "pain", "fatigue", "nausea", "headache", "dizzy"]

    def extract_key_details(self, text: str) -> List[ClinicalObservation]:
        observations: List[ClinicalObservation] = []
        lowered = text.lower()
        for symptom in self.SYMPTOM_KEYWORDS:
            if symptom in lowered:
                observations.append(
                    ClinicalObservation(
                        category="symptom",
                        value=symptom,
                        source="transcript",
                        confidence=0.7,
                    )
                )
        if "history" in lowered:
            observations.append(
                ClinicalObservation(
                    category="history",
                    value=text,
                    source="transcript",
                    confidence=0.5,
                )
            )
        return observations

    def build_soap_note(
        self,
        transcript: str,
        observations: List[ClinicalObservation],
        patient_profile: PatientProfile,
    ) -> SOAPNote:
        symptoms = sorted({obs.value for obs in observations if obs.category == "symptom"})
        history = [obs.value for obs in observations if obs.category == "history"]
        note = SOAPNote(
            subjective=["Patient reports: " + ", ".join(symptoms) if symptoms else "Patient interview completed."],
            objective=[],
            assessment=[],
            plan=[],
            history=history,
            symptoms=symptoms,
            medications=patient_profile.medications,
            allergies=patient_profile.allergies,
        )
        note.objective.append("Vitals pending clinician entry.")
        note.assessment.append("Draft assessment generated; clinician review required.")
        note.plan.append("Await clinician approval before any action.")
        return note


class GuidelineService:
    """Guideline-based recommendation stub."""

    def generate_recommendations(
        self,
        soap_note: SOAPNote,
        observations: List[ClinicalObservation],
        patient_profile: PatientProfile,
    ) -> List[ClinicalRecommendation]:
        recommendations: List[ClinicalRecommendation] = []
        if "fever" in soap_note.symptoms:
            recommendations.append(
                ClinicalRecommendation(
                    title="Evaluate fever",
                    rationale="Reported fever. Consider vitals, infection screening, and review medications.",
                    evidence=["Transcript symptom extraction", "Clinical intake protocol"],
                    confidence=0.55,
                    requires_approval=True,
                    risk_level="medium",
                )
            )
        if not recommendations:
            recommendations.append(
                ClinicalRecommendation(
                    title="Complete clinician assessment",
                    rationale="No high-confidence findings detected. Continue standard assessment.",
                    evidence=["Transcript review"],
                    confidence=0.4,
                    requires_approval=True,
                    risk_level="low",
                )
            )
        return recommendations
