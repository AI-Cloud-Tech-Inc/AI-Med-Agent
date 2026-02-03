"""DynamoDB persistence for encounters and audit logs."""

import logging
from typing import Dict, Any, List

import boto3
from botocore.exceptions import ClientError

from src.core.clinical import EncounterContext
from src.core.audit import AuditEvent
from src.core.privacy import AccessRole, AccessLevel

logger = logging.getLogger(__name__)


class DynamoDBStoreException(Exception):
    """Base exception for DynamoDB store."""


class DynamoDBClinicalRecordStore:
    """Persist encounters in DynamoDB."""

    def __init__(self, table_name: str, region: str = "us-east-1") -> None:
        self.table_name = table_name
        self.client = boto3.resource("dynamodb", region_name=region)
        self.table = self.client.Table(table_name)

    def store_encounter(self, encounter: EncounterContext) -> None:
        item = {
            "patient_id": encounter.patient_profile.patient_id,
            "encounter_id": encounter.encounter_id,
            "created_at": encounter.created_at,
            "clinician_id": encounter.clinician_id,
            "soap_note": encounter.soap_note.to_dict() if encounter.soap_note else {},
            "recommendations": [rec.to_dict() for rec in encounter.recommendations],
            "observations": [obs.__dict__ for obs in encounter.observations],
        }
        try:
            self.table.put_item(Item=item)
        except ClientError as exc:
            logger.error("Failed to persist encounter: %s", exc)
            raise DynamoDBStoreException(str(exc)) from exc

    def get_patient_view(self, patient_id: str, role: AccessRole, access_level: AccessLevel) -> Dict[str, Any]:
        try:
            response = self.table.query(
                KeyConditionExpression=boto3.dynamodb.conditions.Key("patient_id").eq(patient_id)
            )
        except ClientError as exc:
            logger.error("Failed to fetch encounters: %s", exc)
            raise DynamoDBStoreException(str(exc)) from exc

        items = response.get("Items", [])
        return {
            "patient_id": patient_id,
            "encounters": items,
        }


class DynamoDBAuditLogger:
    """Persist audit logs in DynamoDB."""

    def __init__(self, table_name: str, region: str = "us-east-1") -> None:
        self.table_name = table_name
        self.client = boto3.resource("dynamodb", region_name=region)
        self.table = self.client.Table(table_name)

    def log_event(self, event: AuditEvent) -> None:
        item = {
            "resource_id": event.resource_id,
            "timestamp": event.timestamp,
            "actor_id": event.actor_id,
            "action": event.action,
            "metadata": event.metadata,
            "correlation_id": event.correlation_id or "",
        }
        try:
            self.table.put_item(Item=item)
        except ClientError as exc:
            logger.error("Failed to write audit event: %s", exc)
            raise DynamoDBStoreException(str(exc)) from exc
