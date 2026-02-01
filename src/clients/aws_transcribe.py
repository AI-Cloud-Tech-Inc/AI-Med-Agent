"""AWS Transcribe client for clinical audio transcription."""

import time
import json
import logging
from typing import Optional
from urllib.request import urlopen

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


class AWSTranscribeException(Exception):
    """Base exception for AWS Transcribe client."""


class AWSTranscribeService:
    """Batch transcription using AWS Transcribe (S3 audio inputs)."""

    def __init__(
        self,
        region: str = "us-east-1",
        output_bucket: Optional[str] = None,
        language_code: str = "en-US",
    ) -> None:
        self.region = region
        self.output_bucket = output_bucket
        self.language_code = language_code
        self.client = boto3.client("transcribe", region_name=region)

    def transcribe_audio_s3(
        self,
        job_name: str,
        media_uri: str,
        media_format: str = "wav",
        language_code: Optional[str] = None,
    ) -> str:
        """Start a transcription job and return transcript text."""
        try:
            params = {
                "TranscriptionJobName": job_name,
                "Media": {"MediaFileUri": media_uri},
                "MediaFormat": media_format,
                "LanguageCode": language_code or self.language_code,
            }
            if self.output_bucket:
                params["OutputBucketName"] = self.output_bucket

            self.client.start_transcription_job(**params)
            return self._wait_for_completion(job_name)
        except ClientError as exc:
            logger.error("Transcribe job failed: %s", exc)
            raise AWSTranscribeException(str(exc)) from exc

    def _wait_for_completion(self, job_name: str, poll_seconds: int = 5) -> str:
        while True:
            response = self.client.get_transcription_job(TranscriptionJobName=job_name)
            job = response["TranscriptionJob"]
            status = job["TranscriptionJobStatus"]
            if status == "COMPLETED":
                transcript_uri = job["Transcript"]["TranscriptFileUri"]
                return self._download_transcript(transcript_uri)
            if status == "FAILED":
                raise AWSTranscribeException(job.get("FailureReason", "Unknown error"))
            time.sleep(poll_seconds)

    @staticmethod
    def _download_transcript(transcript_uri: str) -> str:
        with urlopen(transcript_uri) as response:
            payload = json.loads(response.read().decode("utf-8"))
        return payload["results"]["transcripts"][0]["transcript"]
