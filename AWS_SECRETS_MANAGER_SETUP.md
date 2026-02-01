# AWS Secrets Manager Setup for AI Med Agent

**Quick Setup Guide - January 30, 2026**

---

## 🌐 Step 1: Open AWS CloudShell

**Click here:** https://console.aws.amazon.com/cloudshell/home?region=us-east-1

(CloudShell works better than local AWS CLI - no Python errors!)

---

## 🔍 Step 2: Check Existing Secrets

```bash
# List all your secrets
aws secretsmanager list-secrets --query 'SecretList[*].[Name,ARN]' --output table
```

**Expected output:**
- If you have secrets: Table showing names and ARNs
- If empty: No secrets found (we'll create one)

---

## 🔐 Step 3: Create Secret for AI Med Agent

### For Production Environment:

```bash
# Create production secret
aws secretsmanager create-secret \
  --name ai-med-agent/prod \
  --description "AI Med Agent Production Credentials" \
  --secret-string '{
    "aws_access_key_id": "YOUR_ACCESS_KEY_HERE",
    "aws_secret_access_key": "YOUR_SECRET_KEY_HERE",
    "github_token": "YOUR_GITHUB_TOKEN_HERE",
    "api_key": "YOUR_API_KEY_HERE"
  }'

# Get the ARN (copy this!)
aws secretsmanager describe-secret --secret-id ai-med-agent/prod \
  --query 'ARN' --output text
```

### For Development Environment:

```bash
# Create dev secret
aws secretsmanager create-secret \
  --name ai-med-agent/dev \
  --description "AI Med Agent Development Credentials" \
  --secret-string '{
    "aws_access_key_id": "YOUR_DEV_ACCESS_KEY",
    "aws_secret_access_key": "YOUR_DEV_SECRET_KEY"
  }'
```

### For GitHub Actions (CI/CD):

```bash
# Create GitHub Actions secret
aws secretsmanager create-secret \
  --name ai-med-agent/github-actions \
  --description "Credentials for GitHub Actions CI/CD" \
  --secret-string '{
    "aws_access_key_id": "YOUR_CI_ACCESS_KEY",
    "aws_secret_access_key": "YOUR_CI_SECRET_KEY"
  }'
```

---

## 📋 Step 4: Retrieve Secret Information

### Get Secret ARN:

```bash
# Get ARN for ai-med-agent/prod
aws secretsmanager describe-secret --secret-id ai-med-agent/prod
```

**Output will include:**
```json
{
    "ARN": "arn:aws:secretsmanager:us-east-1:123456789012:secret:ai-med-agent/prod-AbCdEf",
    "Name": "ai-med-agent/prod",
    "Description": "AI Med Agent Production Credentials",
    "LastChangedDate": "2026-01-30T12:00:00.000000+00:00"
}
```

**Copy the ARN** - you'll use this in your code!

---

## 💻 Step 5: Use Secret in Python Code

### In AI Med Agent App:

```python
# File: src/utils/secrets.py
import boto3
import json

def get_secret(secret_name='ai-med-agent/prod'):
    """Retrieve secret from AWS Secrets Manager"""
    
    client = boto3.client('secretsmanager', region_name='us-east-1')
    
    try:
        response = client.get_secret_value(SecretId=secret_name)
        
        # Parse the secret string
        if 'SecretString' in response:
            secret = json.loads(response['SecretString'])
            return secret
        else:
            # Binary secret (less common)
            return base64.b64decode(response['SecretBinary'])
            
    except Exception as e:
        print(f"Error retrieving secret: {e}")
        raise


# Usage in your app:
from utils.secrets import get_secret

# Get credentials
secrets = get_secret('ai-med-agent/prod')
aws_key = secrets['aws_access_key_id']
aws_secret = secrets['aws_secret_access_key']
```

### In Configuration Files:

```python
# File: config/secret_config.py
from utils.secrets import get_secret

class Config:
    def __init__(self, environment='dev'):
        self.environment = environment
        self.secret_name = f'ai-med-agent/{environment}'
        self.secrets = get_secret(self.secret_name)
    
    @property
    def aws_credentials(self):
        return {
            'access_key': self.secrets['aws_access_key_id'],
            'secret_key': self.secrets['aws_secret_access_key']
        }

# Usage:
config = Config(environment='prod')
credentials = config.aws_credentials
```

---

## 🔄 Step 6: Update Existing Secret

```bash
# Update secret value
aws secretsmanager update-secret \
  --secret-id ai-med-agent/prod \
  --secret-string '{
    "aws_access_key_id": "NEW_ACCESS_KEY",
    "aws_secret_access_key": "NEW_SECRET_KEY",
    "github_token": "NEW_GITHUB_TOKEN"
  }'

# Get current version
aws secretsmanager describe-secret --secret-id ai-med-agent/prod \
  --query 'VersionIdsToStages' --output json
```

---

## 🔐 Step 7: Set Up Rotation (Optional but Recommended)

```bash
# Enable automatic rotation every 30 days
aws secretsmanager rotate-secret \
  --secret-id ai-med-agent/prod \
  --rotation-lambda-arn arn:aws:lambda:us-east-1:123456789012:function:SecretsManagerRotation \
  --rotation-rules AutomaticallyAfterDays=30
```

---

## 🎯 Common Secret Patterns

### Pattern 1: Database Credentials

```bash
aws secretsmanager create-secret \
  --name ai-med-agent/database \
  --secret-string '{
    "username": "dbadmin",
    "password": "super-secure-password",
    "host": "database.us-east-1.rds.amazonaws.com",
    "port": 5432,
    "database": "aimedagent"
  }'
```

### Pattern 2: API Keys

```bash
aws secretsmanager create-secret \
  --name ai-med-agent/api-keys \
  --secret-string '{
    "openai_api_key": "sk-...",
    "stripe_api_key": "sk_live_...",
    "sendgrid_api_key": "SG..."
  }'
```

### Pattern 3: Environment Variables

```bash
aws secretsmanager create-secret \
  --name ai-med-agent/env \
  --secret-string '{
    "DEBUG": "False",
    "LOG_LEVEL": "INFO",
    "MAX_RETRIES": "3",
    "TIMEOUT": "30"
  }'
```

---

## 💰 Cost Information

**AWS Secrets Manager Pricing:**
- $0.40 per secret per month
- $0.05 per 10,000 API calls

**Example Costs:**
- 3 secrets (dev, staging, prod): $1.20/month
- 100,000 API calls: $0.50/month
- **Total: ~$2/month** (very affordable!)

---

## 🚨 Security Best Practices

### ✅ DO:
- Use different secrets for dev/staging/prod
- Enable secret rotation
- Use IAM policies to restrict access
- Log secret access in CloudTrail
- Delete unused secrets

### ❌ DON'T:
- Hard-code credentials in code
- Commit secrets to Git
- Share secrets via email/Slack
- Use same credentials across environments
- Store secrets in environment variables (use Secrets Manager instead)

---

## 📋 IAM Policy for App to Access Secrets

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:*:secret:ai-med-agent/*"
      ]
    }
  ]
}
```

**Attach this policy to:**
- Your EC2 instance role
- Lambda execution role
- ECS task role
- Your IAM user (for local development)

---

## 🔍 Troubleshooting

### Error: "ResourceNotFoundException"
**Problem:** Secret doesn't exist  
**Solution:** Create it first (see Step 3)

### Error: "AccessDeniedException"
**Problem:** No permission to access secret  
**Solution:** Add IAM policy (see above)

### Error: "InvalidRequestException"
**Problem:** Invalid secret format  
**Solution:** Ensure JSON is valid (use `jq` to validate)

---

## 🎯 Quick Commands Cheat Sheet

```bash
# List all secrets
aws secretsmanager list-secrets

# Create secret
aws secretsmanager create-secret --name NAME --secret-string 'JSON'

# Get secret value
aws secretsmanager get-secret-value --secret-id NAME

# Update secret
aws secretsmanager update-secret --secret-id NAME --secret-string 'JSON'

# Delete secret (30-day recovery window)
aws secretsmanager delete-secret --secret-id NAME

# Restore deleted secret
aws secretsmanager restore-secret --secret-id NAME

# Get ARN
aws secretsmanager describe-secret --secret-id NAME --query 'ARN'
```

---

## ✅ Next Steps

1. **Open CloudShell** (link at top)
2. **Run Step 2** (check existing secrets)
3. **Run Step 3** (create your secret)
4. **Copy the ARN** (you'll need this)
5. **Use Step 5** (add to your Python code)

**Ready to create your secret?** Just run the commands in CloudShell! 🚀
