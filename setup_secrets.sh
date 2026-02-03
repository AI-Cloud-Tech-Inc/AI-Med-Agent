#!/bin/bash
# AI Med Agent - Secret Setup Script
# Run this in AWS CloudShell

echo "==================================="
echo "AI MED AGENT SECRET SETUP"
echo "==================================="
echo ""

# Step 1: Check existing secrets
echo "📋 Step 1: Checking existing secrets..."
aws secretsmanager list-secrets --query 'SecretList[*].[Name,ARN]' --output table
echo ""

# Step 2: Create production secret
echo "🔐 Step 2: Creating ai-med-agent/prod secret..."
aws secretsmanager create-secret \
  --name ai-med-agent/prod \
  --description "AI Med Agent Production Credentials" \
  --secret-string '{
    "aws_access_key_id": "REPLACE_WITH_YOUR_ACCESS_KEY",
    "aws_secret_access_key": "REPLACE_WITH_YOUR_SECRET_KEY",
    "github_token": "REPLACE_WITH_YOUR_GITHUB_TOKEN",
    "environment": "production"
  }'

if [ $? -eq 0 ]; then
  echo "✅ Production secret created successfully!"
else
  echo "⚠️  Secret might already exist or error occurred"
fi
echo ""

# Step 3: Create development secret
echo "🔐 Step 3: Creating ai-med-agent/dev secret..."
aws secretsmanager create-secret \
  --name ai-med-agent/dev \
  --description "AI Med Agent Development Credentials" \
  --secret-string '{
    "aws_access_key_id": "REPLACE_WITH_DEV_KEY",
    "aws_secret_access_key": "REPLACE_WITH_DEV_SECRET",
    "environment": "development"
  }'

if [ $? -eq 0 ]; then
  echo "✅ Development secret created successfully!"
else
  echo "⚠️  Secret might already exist or error occurred"
fi
echo ""

# Step 4: Get ARNs
echo "📍 Step 4: Getting secret ARNs..."
echo ""
echo "Production Secret ARN:"
aws secretsmanager describe-secret --secret-id ai-med-agent/prod --query 'ARN' --output text
echo ""
echo "Development Secret ARN:"
aws secretsmanager describe-secret --secret-id ai-med-agent/dev --query 'ARN' --output text
echo ""

# Step 5: Summary
echo "==================================="
echo "✅ SETUP COMPLETE!"
echo "==================================="
echo ""
echo "📋 Next Steps:"
echo "1. Update secrets with your real credentials:"
echo "   aws secretsmanager update-secret --secret-id ai-med-agent/prod --secret-string '{YOUR_JSON}'"
echo ""
echo "2. Use in Python code:"
echo "   from utils.secrets import get_secret"
echo "   secrets = get_secret('ai-med-agent/prod')"
echo ""
echo "3. Cost: $0.40/secret/month = $0.80/month for both"
echo ""
echo "==================================="
