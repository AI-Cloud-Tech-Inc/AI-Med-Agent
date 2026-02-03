"""AWS Bedrock client for clinical NLP and recommendations."""

import json
import logging
from typing import Dict, Any, List

import boto3
from botocore.exceptions import ClientError

from src.core.clinical import ClinicalObservation, SOAPNote, PatientProfile, ClinicalRecommendation
from src.clients.clinical_services import ClinicalNLPService, GuidelineService

logger = logging.getLogger(__name__)


class BedrockServiceException(Exception):
    """Base exception for Bedrock service."""


class BedrockClinicalNLPService(ClinicalNLPService):
    """Clinical NLP powered by Bedrock with JSON outputs."""

    def __init__(self, model_id: str, region: str = "us-east-1") -> None:
        super().__init__()
        self.model_id = model_id
        self.client = boto3.client("bedrock-runtime", region_name=region)

    def extract_key_details(self, text: str) -> List[ClinicalObservation]:
        prompt = (
            "Extract clinical observations from the transcript. "
            "Return JSON with items: category, value, confidence. "
            f"Transcript: {text}"
        )
        payload = self._invoke(prompt)
        observations = []
        for item in payload.get("observations", []):
            observations.append(
                ClinicalObservation(
                    category=item.get("category", "note"),
                    value=item.get("value", ""),
                    source="bedrock",
                    confidence=float(item.get("confidence", 0.5)),
                )
            )
        return observations or super().extract_key_details(text)

    def build_soap_note(
        self,
        transcript: str,
        observations: List[ClinicalObservation],
        patient_profile: PatientProfile,
    ) -> SOAPNote:
        prompt = (
            "Generate a SOAP note as JSON with keys: subjective, objective, assessment, plan, "
            "history, symptoms, medications, allergies. "
            f"Transcript: {transcript}"
        )
        payload = self._invoke(prompt)
        return SOAPNote(
            subjective=payload.get("subjective", []),
            objective=payload.get("objective", []),
            assessment=payload.get("assessment", []),
            plan=payload.get("plan", []),
            history=payload.get("history", []),
            symptoms=payload.get("symptoms", []),
            medications=payload.get("medications", patient_profile.medications),
            allergies=payload.get("allergies", patient_profile.allergies),
        )

    def _invoke(self, prompt: str) -> Dict[str, Any]:
        body = json.dumps({"prompt": prompt, "max_tokens": 800})
        try:
            response = self.client.invoke_model(
                modelId=self.model_id,
                body=body,
                accept="application/json",
                contentType="application/json",
            )
            payload = json.loads(response["body"].read())
            if isinstance(payload, dict) and "output" in payload:
                return payload["output"]
            return payload
        except ClientError as exc:
            logger.error("Bedrock invoke failed: %s", exc)
            raise BedrockServiceException(str(exc)) from exc
        except json.JSONDecodeError:
            logger.warning("Bedrock response not JSON; falling back to defaults")
            return {}


class BedrockGuidelineService(GuidelineService):
    """Guideline service backed by Bedrock for recommendations."""

    def __init__(self, model_id: str, region: str = "us-east-1") -> None:
        super().__init__()
        self.model_id = model_id
        self.client = boto3.client("bedrock-runtime", region_name=region)

    def generate_recommendations(
        self,
        soap_note: SOAPNote,
        observations: List[ClinicalObservation],
        patient_profile: PatientProfile,
    ) -> List[ClinicalRecommendation]:
        prompt = (
            "Generate clinical recommendations as JSON list with title, rationale, evidence, confidence, risk_level. "
            f"SOAP: {soap_note.to_dict()}"
        )
        payload = self._invoke(prompt)
        recommendations = []
        for item in payload.get("recommendations", []):
            recommendations.append(
                ClinicalRecommendation(
                    title=item.get("title", "Review"),
                    rationale=item.get("rationale", "Clinician review required."),
                    evidence=item.get("evidence", []),
                    confidence=float(item.get("confidence", 0.5)),
                    risk_level=item.get("risk_level", "medium"),
                    requires_approval=True,
                )
            )
        return recommendations or super().generate_recommendations(soap_note, observations, patient_profile)

    def _invoke(self, prompt: str) -> Dict[str, Any]:
        body = json.dumps({"prompt": prompt, "max_tokens": 800})
        try:
            response = self.client.invoke_model(
                modelId=self.model_id,
                body=body,
                accept="application/json",
                contentType="application/json",
            )
            payload = json.loads(response["body"].read())
            if isinstance(payload, dict) and "output" in payload:
                return payload["output"]
            return payload
        except ClientError as exc:
            logger.error("Bedrock invoke failed: %s", exc)
            raise BedrockServiceException(str(exc)) from exc
        except json.JSONDecodeError:
            logger.warning("Bedrock response not JSON; falling back to defaults")
            return {}
