"""Audit logging utilities for clinical AI workflows."""

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Dict, Any, Optional
import json
from pathlib import Path


def _now() -> str:
    return datetime.utcnow().isoformat()


@dataclass
class AuditEvent:
    actor_id: str
    action: str
    resource_id: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=_now)
    correlation_id: Optional[str] = None


class AuditLogger:
    """Write audit events to a JSON lines log file."""

    def __init__(self, log_file: str = "logs/audit.log") -> None:
        self.log_file = log_file
        log_path = Path(log_file).parent
        log_path.mkdir(parents=True, exist_ok=True)

    def log_event(self, event: AuditEvent) -> None:
        with open(self.log_file, "a", encoding="utf-8") as handle:
            handle.write(json.dumps(asdict(event)) + "\n")


class InMemoryAuditLogger(AuditLogger):
    """In-memory audit logger for testing."""

    def __init__(self) -> None:
        self.events = []

    def log_event(self, event: AuditEvent) -> None:
        self.events.append(event)
