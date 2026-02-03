# Quick Start Guide - AICloud-Innovation Enterprise
# Complete Setup Instructions for All Systems
# Last Updated: January 30, 2026

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Directory Structure](#directory-structure)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [Credential Management](#credential-management)
6. [Permission Configuration](#permission-configuration)
7. [Environment Setup](#environment-setup)
8. [AWS Deployment](#aws-deployment)
9. [GitHub Configuration](#github-configuration)
10. [Testing & Validation](#testing-validation)
11. [Troubleshooting](#troubleshooting)
12. [Support](#support)

---

## 1. Overview

This guide provides complete instructions for setting up the AICloud-Innovation Enterprise infrastructure, including:

- ✅ **Enterprise Structure**: 2 organizations, 12 repositories
- ✅ **Environments**: Production, Staging, Development, Testing, Sandbox
- ✅ **Permissions**: Enterprise, organization, and repository-level RBAC
- ✅ **Credentials**: Secure AWS, GitHub, and database credentials
- ✅ **AWS Infrastructure**: Organizations, accounts, OIDC, security services
- ✅ **GitHub Enterprise**: Branch protection, code scanning, SAML SSO

---

## 2. Prerequisites

### Required Tools
```bash
# AWS CLI (v2.13+)
aws --version

# GitHub CLI (v2.40+)
gh --version

# Terraform (v1.6+)
terraform --version

# Node.js (v20.x)
node --version

# Git (v2.40+)
git --version

# OpenSSL (for encryption)
openssl version
```

### Required Access
- ✅ AWS Enterprise account with admin access
- ✅ GitHub Enterprise owner access (https://github.com/enterprises/aicloud)
- ✅ Domain for SAML SSO (optional but recommended)
- ✅ Email for notifications

### Required Accounts
- AWS root account email
- GitHub personal access token (with enterprise scope)
- Email for alerts and notifications

---

## 3. Directory Structure

```
AI Video/
├── enterprise/                    # Enterprise configuration
│   ├── credentials/              # Credential management (RESTRICTED)
│   ├── environments/             # Environment configs
│   ├── organizations/            # Organization definitions
│   ├── permissions/              # Permission matrices
│   ├── aws-enterprise-integration.yaml
│   ├── github-enterprise-config.yaml
│   ├── DEPLOYMENT_GUIDE.md
│   ├── ENTERPRISE_README.md
│   └── ORG_ENVIRONMENT_GUIDE.md
│
├── AI-Med-Agent/                 # AI-Med-Agent repository
│   └── frontend/
│       └── __tests__/
│
├── AI-Film-Studio/               # AI-Film-Studio repository
│   └── frontend/
│       └── __tests__/
│
└── README.md                     # This file
```

---

## 4. Step-by-Step Setup

### Phase 1: Environment Preparation (30 minutes)

#### 1.1 Install Required Tools
```bash
# Windows (PowerShell)
# Install AWS CLI
winget install Amazon.AWSCLI

# Install GitHub CLI
winget install GitHub.cli

# Install Terraform
winget install Hashicorp.Terraform

# Install Node.js
winget install OpenJS.NodeJS.LTS
```

#### 1.2 Configure Git
```bash
cd "C:\Users\ctrpr\OneDrive\Desktop\New folder\AI Video"

# Configure Git
git config --global user.name "AICloud-Innovation"
git config --global user.email "enterprise@aicloud-innovation.com"

# Set default branch
git config --global init.defaultBranch main
```

#### 1.3 Set Environment Variables
```bash
# Create environment file
cd enterprise/environments
cp .env.production.example .env.production.local

# Edit with your values (NEVER commit this file)
notepad .env.production.local
```

---

### Phase 2: AWS Infrastructure Setup (90 minutes)

**Follow:** `enterprise/DEPLOYMENT_GUIDE.md`

#### 2.1 Enable AWS Organizations
```bash
cd enterprise

# Authenticate to AWS
aws configure --profile aicloud-enterprise-owner

# Create AWS Organization
aws organizations create-organization --feature-set ALL
```

#### 2.2 Deploy CloudFormation Stack
```bash
# Deploy enterprise infrastructure
aws cloudformation create-stack \
  --stack-name aicloud-enterprise-foundation \
  --template-body file://aws-enterprise-integration.yaml \
  --parameters \
    ParameterKey=EnterpriseId,ParameterValue=aicloud-innovation \
    ParameterKey=GitHubEnterpriseSlug,ParameterValue=aicloud \
  --capabilities CAPABILITY_NAMED_IAM \
  --profile aicloud-enterprise-owner

# Wait for completion (30 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name aicloud-enterprise-foundation
```

#### 2.3 Create AWS Accounts
```bash
# Get Organization ID
ORG_ID=$(aws organizations describe-organization --query 'Organization.Id' --output text)

# Create production account
aws organizations create-account \
  --email prod-ai-med-agent@aicloud-innovation.com \
  --account-name "AICloud-Production-AI-Med-Agent"

# Check status
aws organizations list-accounts
```

---

### Phase 3: Credential Management (60 minutes)

**Follow:** `enterprise/credentials/documentation/SECURITY_POLICY.md`

#### 3.1 Set Up AWS Secrets Manager
```bash
# Create database secret
aws secretsmanager create-secret \
  --name aicloud/production/database \
  --description "Production database credentials" \
  --secret-string '{
    "username": "prod_admin",
    "password": "YOUR_SECURE_PASSWORD",
    "host": "prod-db.amazonaws.com",
    "port": 5432
  }' \
  --kms-key-id arn:aws:kms:us-east-1:ACCOUNT:key/KEY_ID

# Enable rotation
aws secretsmanager put-secret-rotation-rules \
  --secret-id aicloud/production/database \
  --rotation-rules '{"AutomaticallyAfterDays": 30}'
```

#### 3.2 Configure GitHub OIDC (No Keys Needed!)
```bash
# Create OIDC provider
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# Create IAM role
aws iam create-role \
  --role-name github-actions-role \
  --assume-role-policy-document file://enterprise/credentials/aws/oidc/github-oidc-trust-policy.json
```

#### 3.3 Store GitHub Secrets
```bash
# Authenticate to GitHub
gh auth login

# Add AWS role ARN to GitHub
gh secret set AWS_ROLE_TO_ASSUME \
  --repo AI-Empower-Cloud-Hub-LLC/AI-Med-Agent \
  --body "arn:aws:iam::ACCOUNT_ID:role/github-actions-role"

gh secret set AWS_REGION \
  --repo AI-Empower-Cloud-Hub-LLC/AI-Med-Agent \
  --body "us-east-1"
```

---

### Phase 4: GitHub Enterprise Configuration (45 minutes)

**Follow:** `enterprise/github-enterprise-config.yaml`

#### 4.1 Configure Enterprise Settings
```bash
# Go to GitHub Enterprise
# https://github.com/enterprises/aicloud/settings

# Enable features:
# ✅ SAML SSO
# ✅ 2FA requirement
# ✅ IP allow list
# ✅ Advanced Security
```

#### 4.2 Create Organizations
```bash
# AI-Empower-Cloud-Hub-LLC
# Already exists - configure settings

# AI-Infrastructure-Agent  
# Already exists - configure settings
```

#### 4.3 Configure Repository Settings
```bash
# AI-Med-Agent repository
cd "AI-Med-Agent"

# Enable branch protection
gh api repos/AI-Empower-Cloud-Hub-LLC/AI-Med-Agent/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["unit-tests","e2e-tests"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":3,"require_code_owner_reviews":true}'

# Enable security features
gh api repos/AI-Empower-Cloud-Hub-LLC/AI-Med-Agent \
  --method PATCH \
  --field security_and_analysis='{"secret_scanning":{"status":"enabled"},"secret_scanning_push_protection":{"status":"enabled"}}'
```

---

### Phase 5: Permission Configuration (30 minutes)

**Follow:** `enterprise/permissions/PERMISSIONS_GUIDE.md`

#### 5.1 Create Teams
```bash
# Create Enterprise Admins team
gh api orgs/AI-Empower-Cloud-Hub-LLC/teams \
  --method POST \
  --field name="Enterprise Admins" \
  --field privacy="secret" \
  --field description="Enterprise administrators"

# Add repositories to team
gh api teams/TEAM_ID/repos/AI-Empower-Cloud-Hub-LLC/AI-Med-Agent \
  --method PUT \
  --field permission="admin"
```

#### 5.2 Assign Permissions
```bash
# Refer to: enterprise/permissions/ORGANIZATION_PERMISSIONS.yaml
# Implement team assignments as documented
```

---

### Phase 6: Environment Deployment (60 minutes)

**Follow:** `enterprise/ORG_ENVIRONMENT_GUIDE.md`

#### 6.1 Production Environment
```bash
# Copy environment file
cp enterprise/environments/.env.production AI-Med-Agent/frontend/.env.production

# Edit with production values
# IMPORTANT: Use AWS Secrets Manager, not plain text!

# Deploy to production
cd AI-Med-Agent
npm install
npm run build
npm run deploy:production
```

#### 6.2 Staging Environment
```bash
cp enterprise/environments/.env.staging AI-Med-Agent/frontend/.env.staging

# Deploy to staging
npm run deploy:staging
```

#### 6.3 Development Environment
```bash
cp enterprise/environments/.env.development AI-Med-Agent/frontend/.env.development

# Start local development
npm run dev
```

---

## 5. Credential Management

### Overview
**Location:** `enterprise/credentials/`

### Key Files
- `SECURITY_POLICY.md` - Complete security policy
- `COMPLETE_FOLDER_STRUCTURE.md` - Directory guide
- `aws/profiles/AWS_CREDENTIALS_TEMPLATE.txt` - AWS CLI config template
- `templates/.ENV_EXAMPLES.txt` - Environment variable templates

### Setup Instructions

#### 5.1 Configure AWS Credentials
```bash
# DO NOT store real keys in files - use AWS Secrets Manager

# Configure AWS CLI with OIDC (preferred)
aws configure sso

# Or configure with temporary credentials
aws configure --profile aicloud-production
```

#### 5.2 Enable Secret Rotation
```bash
# Database passwords (30 days)
aws secretsmanager put-secret-rotation-rules \
  --secret-id aicloud/production/database \
  --rotation-rules '{"AutomaticallyAfterDays": 30}'

# API keys (60 days)
aws secretsmanager put-secret-rotation-rules \
  --secret-id aicloud/api-keys/datadog \
  --rotation-rules '{"AutomaticallyAfterDays": 60}'
```

---

## 6. Permission Configuration

### Overview
**Location:** `enterprise/permissions/`

### Key Files
- `PERMISSIONS_GUIDE.md` - Complete guide
- `ENTERPRISE_PERMISSIONS.yaml` - Enterprise-level permissions
- `ORGANIZATION_PERMISSIONS.yaml` - Org-level permissions
- `REPOSITORY_PERMISSIONS.yaml` - Repo-level permissions

### Implementation

#### 6.1 Enterprise Owner (You)
- Full access to all organizations
- All repositories (admin)
- All AWS accounts (admin)
- Billing and security settings

#### 6.2 Organization Owners
- Full access to organization
- All org repositories (admin)
- Team management
- Settings and billing

#### 6.3 Team Permissions
See: `enterprise/permissions/ORGANIZATION_PERMISSIONS.yaml`

---

## 7. Environment Setup

### Overview
**Location:** `enterprise/environments/`

### Available Environments
1. **Production** - 99.99% SLA, full security
2. **Staging** - 99.9% SLA, pre-production testing
3. **Development** - 99% SLA, active development
4. **Testing** - Best effort, automated tests
5. **Sandbox** - Unlimited experimentation

### Configuration Files
- `.env.production` - Production config
- `.env.staging` - Staging config
- `.env.development` - Development config
- `.env.testing` - Testing config
- `.env.sandbox` - Sandbox config

### Setup Guide
See: `enterprise/ORG_ENVIRONMENT_GUIDE.md`

---

## 8. AWS Deployment

### Overview
**Location:** `enterprise/DEPLOYMENT_GUIDE.md`

### Deployment Phases (110 minutes total)
1. AWS Organizations Foundation (30 mins)
2. Create AWS Accounts (20 mins)
3. GitHub Enterprise Config (15 mins)
4. GitHub Actions OIDC Integration (20 mins)
5. Enable AWS Security Services (15 mins)
6. Cost Management Setup (10 mins)

### Quick Commands
```bash
# Deploy CloudFormation
aws cloudformation create-stack \
  --stack-name aicloud-enterprise-foundation \
  --template-body file://enterprise/aws-enterprise-integration.yaml

# Enable GuardDuty
aws guardduty create-detector --enable

# Enable Security Hub
aws securityhub enable-security-hub
```

---

## 9. GitHub Configuration

### Overview
**Location:** `enterprise/github-enterprise-config.yaml`

### Enterprise Settings
- ✅ SAML SSO enabled
- ✅ 2FA required
- ✅ IP allow list
- ✅ Advanced Security
- ✅ Secret scanning
- ✅ Code scanning
- ✅ Dependabot

### Repository Configuration
- ✅ Branch protection on main
- ✅ Required status checks
- ✅ Code owner reviews (3 approvals)
- ✅ Deployment protection
- ✅ Environment secrets

---

## 10. Testing & Validation

### Verification Checklist

#### AWS Infrastructure
- [ ] Organization created with ALL features
- [ ] 5 OUs created (Production, Development, Staging, Security, Infrastructure)
- [ ] 4 SCPs attached and enforcing
- [ ] Tag policies applied
- [ ] CloudTrail enabled organization-wide
- [ ] 4 AWS accounts created and moved to OUs

#### GitHub Enterprise
- [ ] Enterprise README created
- [ ] 2FA enforced for all users
- [ ] Branch protection on main branches
- [ ] Secret scanning enabled with push protection
- [ ] Code scanning enabled
- [ ] Dependabot alerts enabled

#### Integration
- [ ] OIDC provider created in AWS
- [ ] IAM roles created for GitHub Actions
- [ ] GitHub secrets configured (AWS_ROLE_TO_ASSUME)
- [ ] Test workflow runs successfully

#### Security
- [ ] GuardDuty enabled in all regions
- [ ] Security Hub enabled with standards
- [ ] KMS keys created with rotation

#### Cost Management
- [ ] Budgets created with alerts
- [ ] Cost allocation tags enabled
- [ ] SNS notifications configured

### Test Commands
```bash
# Test AWS access
aws sts get-caller-identity

# Test GitHub OIDC
gh workflow run test-aws-access.yml

# Test secret access
aws secretsmanager get-secret-value \
  --secret-id aicloud/production/database
```

---

## 11. Troubleshooting

### Common Issues

#### AWS Organizations
**Issue:** Cannot create organization
**Solution:** Ensure you're using root account or account with admin privileges

#### GitHub OIDC
**Issue:** OIDC authentication fails
**Solution:** Verify thumbprint and trust policy match exactly

#### Secret Rotation
**Issue:** Rotation fails
**Solution:** Check Lambda execution role has necessary permissions

#### Branch Protection
**Issue:** Cannot merge to main
**Solution:** Ensure all required status checks pass and reviews approved

### Debug Commands
```bash
# Check AWS CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name aicloud-enterprise-foundation

# Check GitHub Actions logs
gh run view --log

# Check AWS CloudTrail
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRoleWithWebIdentity
```

---

## 12. Support

### Documentation
- **Enterprise README**: `enterprise/ENTERPRISE_README.md`
- **Deployment Guide**: `enterprise/DEPLOYMENT_GUIDE.md`
- **Environment Guide**: `enterprise/ORG_ENVIRONMENT_GUIDE.md`
- **Permissions Guide**: `enterprise/permissions/PERMISSIONS_GUIDE.md`
- **Security Policy**: `enterprise/credentials/documentation/SECURITY_POLICY.md`
- **Credential Structure**: `enterprise/credentials/COMPLETE_FOLDER_STRUCTURE.md`

### Contact
- **Email**: enterprise@aicloud-innovation.com
- **Support Portal**: https://support.aicloud-innovation.com
- **Documentation**: https://docs.aicloud-innovation.com
- **Emergency**: security-emergency@aicloud-innovation.com

### Training Resources
- **Academy**: https://academy.aicloud-innovation.com
- **Tutorials**: https://tutorials.aicloud-innovation.com
- **Videos**: https://videos.aicloud-innovation.com

---

## 📝 Next Steps After Setup

1. **Review all documentation** in `enterprise/` folder
2. **Configure monitoring dashboards** (CloudWatch, Datadog)
3. **Set up Slack notifications** for alerts
4. **Schedule weekly security reviews**
5. **Train team members** on security policies
6. **Test disaster recovery** procedures
7. **Schedule monthly access audits**
8. **Review and update** credentials rotation schedule

---

## 🎯 Success Criteria

✅ All AWS infrastructure deployed
✅ All GitHub repositories configured
✅ All permissions assigned correctly
✅ All credentials stored securely
✅ All environments working
✅ All tests passing
✅ All monitoring enabled
✅ All documentation reviewed

**Congratulations! Your AICloud-Innovation Enterprise is ready for production!**

---

**Document Version:** 2.1
**Last Updated:** January 30, 2026
**Maintained By:** AICloud-Innovation Enterprise Team
