# AppConfig Troubleshooting Guide

## Common Issues and Solutions

### Deployment Issues

#### Issue: Deployment Fails Immediately

**Symptoms:**
- Deployment status shows FAILED
- Error: "Invalid configuration data"

**Solutions:**
1. Validate JSON syntax:
```bash
python -m json.tool configs/project/env.json
```

2. Check configuration schema:
```bash
python scripts/validate_config.py configs/project/env.json
```

3. Verify S3 upload:
```bash
aws s3 ls s3://appconfig-bucket-name/
```

#### Issue: Deployment Stuck in DEPLOYING State

**Symptoms:**
- Deployment doesn't progress
- CloudWatch alarm not triggering

**Solutions:**
1. Check deployment strategy settings:
```bash
aws appconfig get-deployment-strategy \
  --deployment-strategy-id <strategy-id>
```

2. Verify CloudWatch alarms exist:
```bash
aws cloudwatch describe-alarms \
  --alarm-names "AppConfig-DeploymentErrors-*"
```

3. Stop and restart deployment:
```bash
aws appconfig stop-deployment --application-id <app-id> --environment-id <env-id> --deployment-number <num>
python scripts/deploy.py --application-id <app-id> --environment dev --config-file configs/project/dev.json
```

#### Issue: Automatic Rollback Triggered

**Symptoms:**
- Deployment reverting to previous version
- CloudWatch alarm in ALARM state

**Solutions:**
1. Check alarm metrics:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/AppConfig \
  --metric-name DeploymentErrors \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 300 \
  --statistics Sum
```

2. Review application logs for errors during deployment

3. Fix configuration issue and redeploy:
```bash
# Fix the config file
vim configs/project/env.json
# Deploy corrected version
python scripts/deploy.py --application-id <app-id> --environment dev --config-file configs/project/env.json --verbose
```

### Configuration Issues

#### Issue: Configuration Not Updating in Application

**Symptoms:**
- Deployment successful but app uses old config
- Changes not reflected in application behavior

**Solutions:**
1. Verify application is polling AppConfig:
```python
# Check retrieval interval in app code
config_client = boto3.client('appconfigdata')
session = config_client.start_configuration_session(
    ApplicationIdentifier='app-id',
    EnvironmentIdentifier='env-id',
    ConfigurationProfileIdentifier='profile-id',
    RequiredMinimumPollIntervalInSeconds=15
)
```

2. Force configuration refresh:
```bash
# Restart application pods/instances
kubectl rollout restart deployment/app-name
# Or for ECS
aws ecs update-service --cluster cluster-name --service service-name --force-new-deployment
```

3. Check AppConfig retrieval logs:
```bash
aws logs tail /aws/appconfig/retrievals --follow
```

#### Issue: Invalid JSON Format

**Symptoms:**
- Deployment fails with "Invalid JSON"
- Syntax errors in configuration

**Solutions:**
1. Use JSON linter:
```bash
jsonlint configs/project/env.json
```

2. Validate with Python:
```python
import json
with open('configs/project/env.json') as f:
    data = json.load(f)
    print(json.dumps(data, indent=2))
```

3. Check for common JSON errors:
   - Trailing commas
   - Missing quotes
   - Unescaped special characters

### Infrastructure Issues

#### Issue: CloudFormation Stack Creation Fails

**Symptoms:**
- Stack status: CREATE_FAILED or ROLLBACK_COMPLETE
- Resources not created

**Solutions:**
1. Check stack events:
```bash
aws cloudformation describe-stack-events \
  --stack-name project-appconfig-dev \
  --max-items 20
```

2. Verify IAM permissions:
```bash
aws iam get-role --role-name AppConfigMonitorRole
```

3. Check resource limits:
```bash
aws service-quotas list-service-quotas \
  --service-code appconfig
```

4. Delete failed stack and retry:
```bash
aws cloudformation delete-stack --stack-name project-appconfig-dev
# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name project-appconfig-dev
# Redeploy
aws cloudformation deploy --template-file infrastructure/project.yaml --stack-name project-appconfig-dev
```

#### Issue: S3 Bucket Access Denied

**Symptoms:**
- Error: "Access Denied" when uploading configs
- 403 Forbidden errors

**Solutions:**
1. Verify bucket policy:
```bash
aws s3api get-bucket-policy --bucket appconfig-bucket-name
```

2. Check IAM role permissions:
```bash
aws iam get-role-policy --role-name GitHubActionsRole --policy-name AppConfigDeployPolicy
```

3. Update bucket policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "AWS": "arn:aws:iam::ACCOUNT_ID:role/AppConfigDeployRole"
    },
    "Action": ["s3:PutObject", "s3:GetObject"],
    "Resource": "arn:aws:s3:::bucket-name/*"
  }]
}
```

### GitHub Actions Issues

#### Issue: Workflow Fails with Authentication Error

**Symptoms:**
- Error: "Unable to locate credentials"
- AWS operations fail in GitHub Actions

**Solutions:**
1. Verify OIDC configuration:
```bash
aws iam get-role --role-name GitHubActionsAppConfigRole
```

2. Check GitHub secrets:
   - `AWS_APPCONFIG_DEPLOY_ROLE` should be set to role ARN
   - Format: `arn:aws:iam::123456789012:role/RoleName`

3. Update trust relationship:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:ORG/REPO:ref:refs/heads/main"
      }
    }
  }]
}
```

#### Issue: Workflow Triggers Unexpectedly

**Symptoms:**
- Workflow runs on every commit
- Multiple deployments triggered

**Solutions:**
1. Check path filters in workflow:
```yaml
on:
  push:
    paths:
      - 'configs/specific-project/**'
      - '!**/*.md'
```

2. Use workflow conditions:
```yaml
if: github.event_name == 'workflow_dispatch' || contains(github.event.head_commit.message, '[deploy]')
```

### Monitoring Issues

#### Issue: CloudWatch Alarms Not Triggering

**Symptoms:**
- Deployment failures not triggering alarms
- No notifications received

**Solutions:**
1. Verify alarm configuration:
```bash
aws cloudwatch describe-alarms --alarm-names "AppConfig-DeploymentErrors"
```

2. Check alarm metrics:
```bash
aws cloudwatch get-metric-data \
  --metric-data-queries file://metric-query.json \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z
```

3. Test alarm manually:
```bash
aws cloudwatch set-alarm-state \
  --alarm-name "AppConfig-DeploymentErrors" \
  --state-value ALARM \
  --state-reason "Testing alarm"
```

4. Update SNS topic subscription:
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:region:account:AppConfigAlerts \
  --protocol email \
  --notification-endpoint team@example.com
```

## Diagnostic Commands

### Check Application Status
```bash
aws appconfig get-application --application-id <app-id>
```

### List All Environments
```bash
aws appconfig list-environments --application-id <app-id>
```

### View Recent Deployments
```bash
aws appconfig list-deployments \
  --application-id <app-id> \
  --environment-id <env-id> \
  --max-results 10
```

### Get Configuration Profile
```bash
aws appconfig get-configuration-profile \
  --application-id <app-id> \
  --configuration-profile-id <profile-id>
```

### Check Deployment Strategy
```bash
aws appconfig get-deployment-strategy \
  --deployment-strategy-id <strategy-id>
```

## Debug Mode

Enable verbose logging in deployment script:
```bash
python scripts/deploy.py \
  --application-id <app-id> \
  --environment dev \
  --config-file configs/project/dev.json \
  --verbose \
  --log-level DEBUG
```

## Getting Help

1. **Check AWS Service Health:** https://status.aws.amazon.com/
2. **Review AWS AppConfig Limits:** https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-limits.html
3. **AWS Support:** Create case in AWS Console
4. **Community:** AWS Developer Forums

## Additional Resources

- [AWS AppConfig Troubleshooting](https://docs.aws.amazon.com/appconfig/latest/userguide/troubleshooting.html)
- [CloudFormation Troubleshooting](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/troubleshooting.html)
- [GitHub Actions Debugging](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows)
