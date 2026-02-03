"""
AWS Secrets Manager Utility for AI Med Agent

This module provides easy access to AWS Secrets Manager secrets.

Usage:
    from utils.secrets import get_secret
    
    # Get production credentials
    secrets = get_secret('ai-med-agent/prod')
    aws_key = secrets['aws_access_key_id']
"""

import boto3
import json
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


def get_secret(secret_name: str, region_name: str = 'us-east-1') -> Dict[str, Any]:
    """
    Retrieve secret from AWS Secrets Manager.
    
    Args:
        secret_name: Name or ARN of the secret (e.g., 'ai-med-agent/prod')
        region_name: AWS region (default: us-east-1)
    
    Returns:
        Dictionary containing secret key-value pairs
        
    Raises:
        Exception: If secret retrieval fails
        
    Example:
        >>> secrets = get_secret('ai-med-agent/prod')
        >>> aws_key = secrets['aws_access_key_id']
        >>> print(f"Key loaded: {aws_key[:4]}...")
    """
    
    # Create Secrets Manager client
    client = boto3.client('secretsmanager', region_name=region_name)
    
    try:
        logger.info(f"Retrieving secret: {secret_name}")
        
        # Get secret value
        response = client.get_secret_value(SecretId=secret_name)
        
        # Parse secret string
        if 'SecretString' in response:
            secret = json.loads(response['SecretString'])
            logger.info(f"✅ Secret retrieved successfully: {secret_name}")
            return secret
        else:
            # Binary secret (less common)
            import base64
            decoded = base64.b64decode(response['SecretBinary'])
            logger.info(f"✅ Binary secret retrieved: {secret_name}")
            return json.loads(decoded)
            
    except client.exceptions.ResourceNotFoundException:
        logger.error(f"❌ Secret not found: {secret_name}")
        raise Exception(f"Secret '{secret_name}' does not exist in Secrets Manager")
        
    except client.exceptions.InvalidRequestException as e:
        logger.error(f"❌ Invalid request: {e}")
        raise Exception(f"Invalid request for secret '{secret_name}': {e}")
        
    except client.exceptions.InvalidParameterException as e:
        logger.error(f"❌ Invalid parameter: {e}")
        raise Exception(f"Invalid parameter for secret '{secret_name}': {e}")
        
    except Exception as e:
        logger.error(f"❌ Error retrieving secret: {e}")
        raise Exception(f"Failed to retrieve secret '{secret_name}': {e}")


def update_secret(secret_name: str, secret_dict: Dict[str, Any], region_name: str = 'us-east-1') -> bool:
    """
    Update an existing secret in AWS Secrets Manager.
    
    Args:
        secret_name: Name of the secret to update
        secret_dict: Dictionary containing new secret values
        region_name: AWS region (default: us-east-1)
    
    Returns:
        True if successful, False otherwise
        
    Example:
        >>> new_creds = {
        ...     'aws_access_key_id': 'NEW_KEY',
        ...     'aws_secret_access_key': 'NEW_SECRET'
        ... }
        >>> update_secret('ai-med-agent/prod', new_creds)
        True
    """
    
    client = boto3.client('secretsmanager', region_name=region_name)
    
    try:
        logger.info(f"Updating secret: {secret_name}")
        
        # Convert dict to JSON string
        secret_string = json.dumps(secret_dict)
        
        # Update secret
        response = client.update_secret(
            SecretId=secret_name,
            SecretString=secret_string
        )
        
        logger.info(f"✅ Secret updated successfully: {secret_name}")
        logger.info(f"Version ID: {response['VersionId']}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to update secret: {e}")
        return False


def list_secrets(region_name: str = 'us-east-1') -> list:
    """
    List all secrets available in Secrets Manager.
    
    Args:
        region_name: AWS region (default: us-east-1)
    
    Returns:
        List of secret names
        
    Example:
        >>> secrets = list_secrets()
        >>> print(secrets)
        ['ai-med-agent/prod', 'ai-med-agent/dev']
    """
    
    client = boto3.client('secretsmanager', region_name=region_name)
    
    try:
        response = client.list_secrets()
        secret_names = [secret['Name'] for secret in response['SecretList']]
        
        logger.info(f"Found {len(secret_names)} secrets")
        return secret_names
        
    except Exception as e:
        logger.error(f"❌ Failed to list secrets: {e}")
        return []


# Example usage
if __name__ == '__main__':
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    print("=================================")
    print("AWS Secrets Manager Utility Test")
    print("=================================\n")
    
    # List all secrets
    print("📋 Listing all secrets...")
    secrets = list_secrets()
    for secret in secrets:
        print(f"  - {secret}")
    print()
    
    # Try to get production secret
    try:
        print("🔐 Retrieving production secret...")
        prod_secrets = get_secret('ai-med-agent/prod')
        print(f"✅ Retrieved secret with {len(prod_secrets)} keys")
        print(f"   Keys: {list(prod_secrets.keys())}")
    except Exception as e:
        print(f"⚠️  {e}")
        print("   Secret may not exist yet. Run setup_secrets.sh first!")
    
    print("\n=================================")
