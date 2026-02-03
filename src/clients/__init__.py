"""Client services for AI-Med-Agent."""

from src.clients.config_manager import ConfigManager
from src.clients.clinical_services import RealTimeTranscriber, ClinicalNLPService, GuidelineService
from src.clients.record_store import ClinicalRecordStore
from src.clients.aws_transcribe import AWSTranscribeService
from src.clients.aws_bedrock import BedrockClinicalNLPService, BedrockGuidelineService
from src.clients.dynamodb_store import DynamoDBClinicalRecordStore, DynamoDBAuditLogger

__all__ = [
	"ConfigManager",
	"RealTimeTranscriber",
	"ClinicalNLPService",
	"GuidelineService",
	"ClinicalRecordStore",
	"AWSTranscribeService",
	"BedrockClinicalNLPService",
	"BedrockGuidelineService",
	"DynamoDBClinicalRecordStore",
	"DynamoDBAuditLogger",
]
