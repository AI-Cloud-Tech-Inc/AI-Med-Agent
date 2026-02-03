"""Autonomous Agentic AI Med Agent orchestrator with multi-agent clinical workflow."""

import logging
import os
from typing import Dict, Any, Optional, List
from uuid import uuid4

from src.core.state import StateManager, AgentStatus, DecisionOutcome, AgentAction
from src.core.clinical import EncounterContext, PatientProfile
from src.core.consent import ConsentManager, ConsentType
from src.core.audit import AuditLogger, AuditEvent
from src.core.privacy import PrivacyPolicy, AccessRole, DataResource, AccessLevel
from src.core.emergency import EmergencyManager, EmergencyEvent, EmergencyRecommendation
from src.clients.clinical_services import RealTimeTranscriber, ClinicalNLPService, GuidelineService
from src.clients.record_store import ClinicalRecordStore
from src.clients.aws_bedrock import BedrockClinicalNLPService, BedrockGuidelineService
from src.clients.aws_transcribe import AWSTranscribeService
from src.clients.dynamodb_store import DynamoDBClinicalRecordStore, DynamoDBAuditLogger
from src.agent.agents import (
    TriageAgent,
    DiagnosisAgent,
    MonitoringAgent,
    FollowUpAgent,
    DocumentationAgent,
)

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """Orchestrates autonomous clinical workflows with human-in-the-loop safeguards."""

    def __init__(
        self,
        agent_id: str = "ai-med-agent-primary",
        consent_manager: Optional[ConsentManager] = None,
        audit_logger: Optional[AuditLogger] = None,
        privacy_policy: Optional[PrivacyPolicy] = None,
        record_store: Optional[ClinicalRecordStore] = None,
        transcriber: Optional[RealTimeTranscriber] = None,
        nlp_service: Optional[ClinicalNLPService] = None,
        guideline_service: Optional[GuidelineService] = None,
        require_approval: bool = True,
    ):
        self.agent_id = agent_id
        self.state = StateManager(agent_id)
        self.require_approval = require_approval
        self.consent_manager = consent_manager or ConsentManager()
        self.audit_logger = audit_logger or self._build_audit_logger()
        self.privacy_policy = privacy_policy or PrivacyPolicy()
        self.record_store = record_store or self._build_record_store()
        self.transcriber = transcriber or RealTimeTranscriber()
        self.audio_transcriber = self._build_audio_transcriber()
        self.nlp_service = nlp_service or self._build_nlp_service()
        self.guideline_service = guideline_service or self._build_guideline_service()
        self.emergency_manager = EmergencyManager(self.audit_logger)

        self.agents = {
            "triage": TriageAgent(self.nlp_service),
            "diagnosis": DiagnosisAgent(self.guideline_service),
            "monitoring": MonitoringAgent(self.guideline_service),
            "follow_up": FollowUpAgent(self.guideline_service),
            "documentation": DocumentationAgent(self.nlp_service),
        }
        logger.info("AgentOrchestrator initialized: %s", agent_id)

    def _build_nlp_service(self) -> ClinicalNLPService:
        provider = os.getenv("AI_MED_AGENT_NLP_PROVIDER", "local").lower()
        if provider == "bedrock":
            model_id = os.getenv("AI_MED_AGENT_BEDROCK_MODEL", "anthropic.claude-3-sonnet-20240229-v1:0")
            region = os.getenv("AWS_REGION", "us-east-1")
            return BedrockClinicalNLPService(model_id=model_id, region=region)
        return ClinicalNLPService()

    def _build_guideline_service(self) -> GuidelineService:
        provider = os.getenv("AI_MED_AGENT_GUIDELINE_PROVIDER", "local").lower()
        if provider == "bedrock":
            model_id = os.getenv("AI_MED_AGENT_BEDROCK_MODEL", "anthropic.claude-3-sonnet-20240229-v1:0")
            region = os.getenv("AWS_REGION", "us-east-1")
            return BedrockGuidelineService(model_id=model_id, region=region)
        return GuidelineService()

    def _build_record_store(self) -> ClinicalRecordStore:
        store = os.getenv("AI_MED_AGENT_RECORD_STORE", "local").lower()
        if store == "dynamodb":
            table_name = os.getenv("AI_MED_AGENT_DDB_ENCOUNTERS_TABLE", "ai-med-agent-encounters")
            region = os.getenv("AWS_REGION", "us-east-1")
            return DynamoDBClinicalRecordStore(table_name=table_name, region=region)
        return ClinicalRecordStore(self.privacy_policy)

    def _build_audit_logger(self) -> AuditLogger:
        backend = os.getenv("AI_MED_AGENT_AUDIT_LOGGER", "file").lower()
        if backend == "dynamodb":
            table_name = os.getenv("AI_MED_AGENT_DDB_AUDIT_TABLE", "ai-med-agent-audit")
            region = os.getenv("AWS_REGION", "us-east-1")
            return DynamoDBAuditLogger(table_name=table_name, region=region)
        return AuditLogger()

    def _build_audio_transcriber(self) -> Optional[AWSTranscribeService]:
        provider = os.getenv("AI_MED_AGENT_TRANSCRIBE_PROVIDER", "local").lower()
        if provider == "aws":
            region = os.getenv("AWS_REGION", "us-east-1")
            output_bucket = os.getenv("AI_MED_AGENT_TRANSCRIBE_OUTPUT_BUCKET")
            language_code = os.getenv("AI_MED_AGENT_TRANSCRIBE_LANGUAGE", "en-US")
            return AWSTranscribeService(
                region=region,
                output_bucket=output_bucket,
                language_code=language_code,
            )
        return None

    # =========================================================================
    # Consent, Transcription, and Encounter Lifecycle
    # =========================================================================

    def start_encounter(
        self,
        patient_profile: PatientProfile,
        clinician_id: str,
        consent_granted: bool,
    ) -> EncounterContext:
        """Start an encounter with explicit consent checks and audit logging."""
        encounter_id = str(uuid4())
        self.state.set_status(AgentStatus.RUNNING)

        self.consent_manager.record_consent(
            patient_id=patient_profile.patient_id,
            encounter_id=encounter_id,
            consent_type=ConsentType.AUDIO_RECORDING,
            granted=consent_granted,
            actor=clinician_id,
        )
        self.consent_manager.record_consent(
            patient_id=patient_profile.patient_id,
            encounter_id=encounter_id,
            consent_type=ConsentType.TRANSCRIPTION,
            granted=consent_granted,
            actor=clinician_id,
        )
        self.consent_manager.record_consent(
            patient_id=patient_profile.patient_id,
            encounter_id=encounter_id,
            consent_type=ConsentType.AI_ASSIST,
            granted=consent_granted,
            actor=clinician_id,
        )

        if not consent_granted:
            self.state.log_decision(
                "consent_check",
                DecisionOutcome.ABORT,
                "Consent not granted; aborting encounter",
                {"patient_id": patient_profile.patient_id}
            )
            raise PermissionError("Consent required for transcription and AI assistance.")

        self.audit_logger.log_event(
            AuditEvent(
                actor_id=clinician_id,
                action="encounter_started",
                resource_id=encounter_id,
                metadata={"patient_id": patient_profile.patient_id},
            )
        )

        self.transcriber.start_session(encounter_id)
        return EncounterContext(
            encounter_id=encounter_id,
            patient_profile=patient_profile,
            clinician_id=clinician_id,
        )

    def ingest_transcript_chunk(self, encounter: EncounterContext, chunk: str) -> None:
        """Ingest real-time transcript and extract clinical details."""
        if not chunk.strip():
            return

        self.transcriber.ingest_text_chunk(encounter.encounter_id, chunk)
        encounter.transcript.append(chunk)

        extracted = self.nlp_service.extract_key_details(chunk)
        encounter.observations.extend(extracted)

        self.audit_logger.log_event(
            AuditEvent(
                actor_id=self.agent_id,
                action="transcript_ingested",
                resource_id=encounter.encounter_id,
                metadata={"chunk_length": len(chunk)},
            )
        )

    def ingest_audio_from_s3(
        self,
        encounter: EncounterContext,
        media_uri: str,
        media_format: str = "wav",
    ) -> None:
        """Use AWS Transcribe to ingest an audio file from S3 and append transcript."""
        if not self.audio_transcriber:
            raise RuntimeError("Audio transcription provider not configured.")

        job_name = f"ai-med-{encounter.encounter_id}"
        transcript = self.audio_transcriber.transcribe_audio_s3(
            job_name=job_name,
            media_uri=media_uri,
            media_format=media_format,
        )
        self.ingest_transcript_chunk(encounter, transcript)

    def finalize_encounter(self, encounter: EncounterContext) -> Dict[str, Any]:
        """Finalize encounter: generate SOAP note, recommendations, and audit logs."""
        self.state.set_status(AgentStatus.EVALUATING)
        transcript = self.transcriber.get_transcript(encounter.encounter_id)

        soap_note = self.nlp_service.build_soap_note(
            transcript=transcript,
            observations=encounter.observations,
            patient_profile=encounter.patient_profile,
        )
        encounter.soap_note = soap_note

        recommendations = self.guideline_service.generate_recommendations(
            soap_note=soap_note,
            observations=encounter.observations,
            patient_profile=encounter.patient_profile,
        )
        encounter.recommendations = recommendations

        agent_tasks = self._run_multi_agent_workflow(encounter)

        self.state.log_decision(
            "clinical_support",
            DecisionOutcome.REQUIRE_APPROVAL if self.require_approval else DecisionOutcome.PROCEED,
            "Clinical recommendations generated and require clinician approval.",
            {
                "recommendation_count": len(recommendations),
                "agent_tasks": agent_tasks,
            },
        )

        action = AgentAction(
            action_type="clinical_support",
            description="Generate clinical note and recommendations",
            parameters={"encounter_id": encounter.encounter_id},
            requires_approval=self.require_approval,
        )
        self.state.queue_action(action)
        self.state.complete_action(result={"recommendations": len(recommendations)})
        self.state.set_status(AgentStatus.COMPLETED)

        self.record_store.store_encounter(encounter)

        self.audit_logger.log_event(
            AuditEvent(
                actor_id=self.agent_id,
                action="encounter_finalized",
                resource_id=encounter.encounter_id,
                metadata={"patient_id": encounter.patient_profile.patient_id},
            )
        )

        return {
            "status": "pending_approval" if self.require_approval else "completed",
            "encounter_id": encounter.encounter_id,
            "soap_note": soap_note.to_dict(),
            "recommendations": [rec.to_dict() for rec in recommendations],
            "agent_tasks": agent_tasks,
            "state": self.state.get_state_summary(),
        }

    # =========================================================================
    # Multi-Agent Orchestration
    # =========================================================================

    def _run_multi_agent_workflow(self, encounter: EncounterContext) -> Dict[str, Any]:
        results = {}
        for name, agent in self.agents.items():
            results[name] = agent.run(encounter)
        return results

    # =========================================================================
    # Patient Read-Only Access
    # =========================================================================

    def get_patient_view(self, patient_id: str) -> Dict[str, Any]:
        """Return read-only patient view with privacy enforcement."""
        return self.record_store.get_patient_view(
            patient_id=patient_id,
            role=AccessRole.PATIENT,
            access_level=AccessLevel.READ,
        )

    # =========================================================================
    # Emergency Escalation
    # =========================================================================

    def recommend_emergency_action(
        self,
        encounter: EncounterContext,
        severity: str,
        reason: str,
        confidence: float = 0.6,
    ) -> EmergencyRecommendation:
        """Provide an emergency recommendation without auto-calling."""
        recommendation = EmergencyRecommendation(
            severity=severity,
            reason=reason,
            confidence=confidence,
        )
        self.state.log_decision(
            "emergency_recommendation",
            DecisionOutcome.REQUIRE_APPROVAL,
            "Emergency recommendation issued; patient must confirm.",
            {
                "severity": severity,
                "reason": reason,
                "confidence": confidence,
            },
        )
        return recommendation

    def trigger_emergency_call(
        self,
        encounter: EncounterContext,
        initiated_by: str,
        reason: str,
        confirmed: bool,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> EmergencyEvent:
        """Record a manual emergency action and notify clinician."""
        if not confirmed:
            raise PermissionError("Emergency calls require manual confirmation.")

        event = EmergencyEvent(
            encounter_id=encounter.encounter_id,
            patient_id=encounter.patient_profile.patient_id,
            initiated_by=initiated_by,
            reason=reason,
            confirmed=confirmed,
            metadata=metadata or {},
        )

        if hasattr(self.record_store, "record_emergency_event"):
            self.record_store.record_emergency_event(event)

        self.emergency_manager.log_emergency_event(event)
        self.audit_logger.log_event(
            AuditEvent(
                actor_id=initiated_by,
                action="emergency_notified_clinician",
                resource_id=encounter.encounter_id,
                metadata={"patient_id": encounter.patient_profile.patient_id},
            )
        )
        return event

    # =========================================================================
    # Legacy State Helpers
    # =========================================================================

    def get_state_summary(self) -> Dict[str, Any]:
        """Get current agent state."""
        return self.state.get_state_summary()

    def export_operation_history(self) -> Dict[str, Any]:
        """Export complete operation history."""
        return self.state.export_history()
