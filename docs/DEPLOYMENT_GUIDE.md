# AppConfig Deployment Guide

## Overview

This guide explains how to deploy and manage AWS AppConfig configurations for multiple projects using this centralized repository.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Python 3.9+ installed
- Required Python packages: `pip install -r requirements.txt`
- AWS permissions for CloudFormation, AppConfig, S3, and IAM

## Architecture

```
┌─────────────────────────────────────────┐
│   Appconfig Repository (This Repo)     │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │ Base Template│  │ Project Templates│ │
│  │base-appconfig│  │- ai-med-agent   │ │
│  │    .yaml     │  │- ai-film-studio │ │
│  └──────────────┘  └─────────────────┘ │
│  ┌──────────────────────────────────┐  │
│  │      Configuration Files         │  │
│  │ configs/                         │  │
│  │  ├── ai-med-agent/              │  │
│  │  │   ├── dev.json               │  │
│  │  │   ├── staging.json           │  │
│  │  │   ├── prod.json              │  │
│  │  │   └── feature-flags.json     │  │
│  │  └── ai-film-studio/            │  │
│  │      ├── dev.json               │  │
│  │      ├── staging.json           │  │
│  │      ├── prod.json              │  │
│  │      └── feature-flags.json     │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
           │
           ▼
  ┌────────────────────┐
  │   AWS AppConfig    │
  │  ┌──────────────┐  │
  │  │ Applications │  │
  │  ├──────────────┤  │
  │  │ai-med-agent  │  │
  │  │ai-film-studio│  │
  │  └──────────────┘  │
  └────────────────────┘
```

## Deployment Workflows

### 1. Infrastructure Deployment

Deploy the CloudFormation stack for a project:

```bash
# Deploy AI-Med-Agent infrastructure
aws cloudformation deploy \
  --template-file infrastructure/ai-med-agent.yaml \
  --stack-name ai-med-agent-appconfig-dev \
  --parameter-overrides Environment=dev \
  --capabilities CAPABILITY_IAM

# Deploy AI-Film-Studio infrastructure
aws cloudformation deploy \
  --template-file infrastructure/ai-film-studio.yaml \
  --stack-name ai-film-studio-appconfig-prod \
  --parameter-overrides Environment=prod \
  --capabilities CAPABILITY_IAM
```

### 2. Configuration Deployment

Deploy configuration updates using the deployment script:

```bash
# Deploy AI-Med-Agent dev config with linear strategy
python scripts/deploy.py \
  --application-id <app-id> \
  --environment dev \
  --config-file configs/ai-med-agent/dev.json \
  --strategy linear \
  --verbose

# Deploy AI-Film-Studio prod config with canary strategy
python scripts/deploy.py \
  --application-id <app-id> \
  --environment prod \
  --config-file configs/ai-film-studio/prod.json \
  --strategy canary \
  --verbose
```

### 3. GitHub Actions Deployment

The repository includes automated workflows:

#### Manual Deployment
1. Go to **Actions** tab in GitHub
2. Select workflow (deploy-ai-med-agent or deploy-ai-film-studio)
3. Click **Run workflow**
4. Select environment and strategy
5. Monitor deployment progress

#### Automatic Deployment
Deployments trigger automatically on:
- Push to main branch
- Changes to `configs/{project}/**`
- Changes to infrastructure templates

## Deployment Strategies

### Linear Deployment (Default)
- Deploys configuration gradually
- 10% of targets every 30 seconds
- Best for: Development, low-risk changes
- Total time: ~5 minutes for full rollout

### Canary Deployment
- Deploys to 20% initially, then 100%
- 30-second bake time between phases
- Best for: Production, high-risk changes
- Total time: ~1 minute with validation

## Configuration Management

### Environment Progression

```
Development → Staging → Production
   (dev)        (staging)    (prod)
```

**Best Practice Flow:**
1. Test changes in **dev** environment
2. Promote to **staging** for validation
3. Deploy to **prod** after approval

### Configuration Schema

Each environment configuration should include:

```json
{
  "log_level": "INFO|DEBUG|WARNING|ERROR",
  "max_retries": 3,
  "timeout_seconds": 300,
  "feature_flags": {
    "enable_feature_x": true,
    "beta_features": false
  },
  "integrations": {
    "service_name": {
      "enabled": true,
      "endpoint": "https://..."
    }
  }
}
```

### Feature Flags

Manage features independently of deployments:

```json
{
  "features": {
    "new_ui": {
      "enabled": true,
      "rollout_percentage": 25
    },
    "experimental_api": {
      "enabled": false,
      "allowlist": ["user-123", "user-456"]
    }
  }
}
```

## Monitoring

### CloudWatch Alarms

The infrastructure creates alarms for:
- **DeploymentErrors**: Triggers on failed deployments
- **DeploymentDuration**: Triggers if deployment exceeds 5 minutes

### Viewing Deployment Status

```bash
# Get deployment status
aws appconfig get-deployment \
  --application-id <app-id> \
  --environment-id <env-id> \
  --deployment-number <deployment-num>

# List recent deployments
aws appconfig list-deployments \
  --application-id <app-id> \
  --environment-id <env-id>
```

### Logs

Monitor deployment logs:
```bash
aws logs tail /aws/appconfig/<application-name> --follow
```

## Rollback Procedures

### Automatic Rollback
AppConfig automatically rolls back on:
- CloudWatch alarm triggers
- Deployment validation failures
- Exceeded error thresholds

### Manual Rollback

1. **Stop Current Deployment:**
```bash
aws appconfig stop-deployment \
  --application-id <app-id> \
  --environment-id <env-id> \
  --deployment-number <deployment-num>
```

2. **Deploy Previous Version:**
```bash
python scripts/deploy.py \
  --application-id <app-id> \
  --environment dev \
  --config-version <previous-version> \
  --strategy linear
```

## Security Best Practices

1. **Use IAM Roles:** Configure GitHub Actions with OIDC for secure AWS access
2. **Encrypt Configurations:** Use AWS Secrets Manager for sensitive values
3. **Access Control:** Limit CloudFormation and AppConfig permissions
4. **Audit Trail:** Enable CloudTrail logging for all AppConfig operations
5. **Validation:** Always validate configurations before deployment

## Common Tasks

### Add New Project

1. Create project-specific CloudFormation template in `infrastructure/`:
```yaml
# infrastructure/new-project.yaml
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  AppConfigStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: ./base-appconfig.yaml
      Parameters:
        ProjectName: new-project
```

2. Create configuration directory:
```bash
mkdir -p configs/new-project
```

3. Add environment configs:
```bash
configs/new-project/
  ├── dev.json
  ├── staging.json
  ├── prod.json
  └── feature-flags.json
```

4. Create GitHub Actions workflow in `.github/workflows/deploy-new-project.yml`

### Update Configuration

1. Edit configuration file in `configs/{project}/{env}.json`
2. Commit and push changes
3. Workflow automatically deploys to AppConfig
4. Monitor deployment in AWS Console or CloudWatch

### Validate Configuration

```bash
# Validate JSON syntax
python -m json.tool configs/ai-med-agent/dev.json

# Validate against schema
python scripts/validate_config.py configs/ai-med-agent/dev.json
```

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions to common issues.

## References

- [AWS AppConfig Documentation](https://docs.aws.amazon.com/appconfig/)
- [CloudFormation Best Practices](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/best-practices.html)
- [GitHub Actions Security](https://docs.github.com/en/actions/security-guides)
