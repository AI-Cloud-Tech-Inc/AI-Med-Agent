"""AI-Med-Agent: Autonomous Clinical Decision Support"""

__version__ = "1.0.0"
__author__ = "AI Med Agent"

from src.agent.orchestrator import AgentOrchestrator
from src.core.clinical import PatientProfile, EncounterContext

__all__ = [
    "AgentOrchestrator",
    "PatientProfile",
    "EncounterContext",
]
