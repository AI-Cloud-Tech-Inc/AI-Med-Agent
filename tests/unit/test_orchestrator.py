"""Unit tests for clinical agent orchestrator."""

import pytest
from src.core.state import AgentStatus


class TestAgentOrchestrator:
    """Test cases for clinical AgentOrchestrator"""

    def test_initialization(self, agent_orchestrator):
        assert agent_orchestrator.agent_id == "test-agent"
        assert agent_orchestrator.state.status == AgentStatus.IDLE
        assert set(agent_orchestrator.agents.keys()) == {
            "triage",
            "diagnosis",
            "monitoring",
            "follow_up",
            "documentation",
        }

    def test_start_encounter_requires_consent(self, agent_orchestrator, patient_profile):
        with pytest.raises(PermissionError):
            agent_orchestrator.start_encounter(
                patient_profile=patient_profile,
                clinician_id="clin-1",
                consent_granted=False,
            )

    def test_transcription_and_finalize(self, agent_orchestrator, patient_profile):
        encounter = agent_orchestrator.start_encounter(
            patient_profile=patient_profile,
            clinician_id="clin-1",
            consent_granted=True,
        )
        agent_orchestrator.ingest_transcript_chunk(encounter, "Patient reports fever and cough.")
        agent_orchestrator.ingest_transcript_chunk(encounter, "History of hypertension.")

        result = agent_orchestrator.finalize_encounter(encounter)

        assert result["status"] == "pending_approval"
        assert result["soap_note"]["symptoms"]
        assert len(result["recommendations"]) >= 1

    def test_patient_read_only_view(self, agent_orchestrator, patient_profile):
        encounter = agent_orchestrator.start_encounter(
            patient_profile=patient_profile,
            clinician_id="clin-1",
            consent_granted=True,
        )
        agent_orchestrator.ingest_transcript_chunk(encounter, "Patient reports fatigue.")
        agent_orchestrator.finalize_encounter(encounter)

        view = agent_orchestrator.get_patient_view(patient_profile.patient_id)
        assert view["patient_id"] == patient_profile.patient_id
        assert view["medications"] == patient_profile.medications
        assert view["insurance"] == patient_profile.insurance

    def test_emergency_trigger_requires_confirmation(self, agent_orchestrator, patient_profile):
        encounter = agent_orchestrator.start_encounter(
            patient_profile=patient_profile,
            clinician_id="clin-1",
            consent_granted=True,
        )

        with pytest.raises(PermissionError):
            agent_orchestrator.trigger_emergency_call(
                encounter=encounter,
                initiated_by="patient-123",
                reason="Chest pain",
                confirmed=False,
            )

    def test_emergency_trigger_logged(self, agent_orchestrator, patient_profile):
        encounter = agent_orchestrator.start_encounter(
            patient_profile=patient_profile,
            clinician_id="clin-1",
            consent_granted=True,
        )

        event = agent_orchestrator.trigger_emergency_call(
            encounter=encounter,
            initiated_by="patient-123",
            reason="Shortness of breath",
            confirmed=True,
        )
        assert event.confirmed is True


class TestStateManager:
    """Test action creation and management"""

    def test_create_action(self, state_manager):
        action = state_manager.create_action(
            action_type="clinical_support",
            description="Generate clinical notes",
            parameters={"encounter_id": "enc-1"},
            requires_approval=True,
            priority=1,
        )
        assert action.action_type == "clinical_support"
        assert action.priority == 1
        assert action.status == "pending"

    def test_queue_and_complete_action(self, state_manager):
        action = state_manager.create_action(
            action_type="clinical_support",
            description="Generate clinical notes",
            parameters={"encounter_id": "enc-1"},
        )

        state_manager.queue_action(action)
        state_manager.complete_action(result="ok")

        assert len(state_manager.action_history) == 1
        assert state_manager.action_history[0].status == "completed"
        assert state_manager.metrics["actions_executed"] == 1

    def test_action_failure(self, state_manager):
        action = state_manager.create_action(
            action_type="clinical_support",
            description="Generate clinical notes",
            parameters={"encounter_id": "enc-1"},
        )

        state_manager.queue_action(action)
        state_manager.fail_action("API Error")

        assert len(state_manager.action_history) == 1
        assert state_manager.action_history[0].status == "failed"
        assert state_manager.metrics["actions_failed"] == 1
        assert len(state_manager.errors) == 1
