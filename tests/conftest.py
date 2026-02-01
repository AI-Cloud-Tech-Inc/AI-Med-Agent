"""Test configuration and fixtures"""

import pytest
import logging
from src.agent.orchestrator import AgentOrchestrator
from src.core.state import StateManager
from src.core.clinical import PatientProfile
from src.core.audit import InMemoryAuditLogger
from src.clients.clinical_services import RealTimeTranscriber, ClinicalNLPService, GuidelineService
from src.clients.record_store import ClinicalRecordStore
from src.core.privacy import PrivacyPolicy


@pytest.fixture
def patient_profile():
    return PatientProfile(
        patient_id="patient-123",
        name="Alex Doe",
        medications=["med-1"],
        allergies=["penicillin"],
        insurance={"provider": "Acme Health"},
    )


@pytest.fixture
def audit_logger():
    return InMemoryAuditLogger()


@pytest.fixture
def clinical_services():
    return {
        "transcriber": RealTimeTranscriber(),
        "nlp": ClinicalNLPService(),
        "guideline": GuidelineService(),
    }


@pytest.fixture
def record_store():
    return ClinicalRecordStore(PrivacyPolicy())


@pytest.fixture
def agent_orchestrator(audit_logger, clinical_services, record_store):
    """Create agent orchestrator with clinical dependencies."""
    return AgentOrchestrator(
        agent_id="test-agent",
        audit_logger=audit_logger,
        record_store=record_store,
        transcriber=clinical_services["transcriber"],
        nlp_service=clinical_services["nlp"],
        guideline_service=clinical_services["guideline"],
        require_approval=True,
    )


@pytest.fixture
def state_manager():
    return StateManager("test-agent")


@pytest.fixture(autouse=True)
def setup_logging():
    logging.basicConfig(level=logging.DEBUG)
    yield
