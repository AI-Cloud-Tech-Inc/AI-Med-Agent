# AppConfig Best Practices

## Configuration Management

### 1. Environment Separation

**DO:**
- Use separate AppConfig applications or environments for dev/staging/prod
- Maintain distinct configuration files for each environment
- Test changes in dev before promoting to staging/prod
- Use infrastructure-as-code for consistent environment setup

**DON'T:**
- Share configuration profiles across production and non-production
- Make direct production changes without testing
- Use the same feature flag values in all environments

**Example Structure:**
```
configs/
├── ai-med-agent/
│   ├── dev.json          # Development settings
│   ├── staging.json      # Pre-production testing
│   ├── prod.json         # Production configuration
│   └── feature-flags.json # Feature toggles
```

### 2. Configuration Versioning

**DO:**
- Store all configurations in version control (Git)
- Tag configuration versions for releases
- Document configuration changes in commit messages
- Maintain changelog for major configuration updates

**DON'T:**
- Make manual changes directly in AWS Console
- Skip version control for "quick fixes"
- Forget to document breaking changes

**Example Commit Message:**
```
feat(config): increase max_retries for production

- Increase max_retries from 3 to 5 in prod.json
- Add retry_delay_seconds configuration
- Update monitoring thresholds

BREAKING CHANGE: Applications must support new retry_delay_seconds parameter
```

### 3. Feature Flags

**DO:**
- Use feature flags for gradual rollouts
- Set default values (usually `false` for new features)
- Clean up flags after full rollout
- Document flag purpose and expected lifecycle

**DON'T:**
- Use feature flags for environment-specific settings
- Leave unused flags in configuration indefinitely
- Change flag values without notification

**Example:**
```json
{
  "features": {
    "new_ml_model": {
      "enabled": true,
      "rollout_percentage": 10,
      "description": "Use new AI model v2.0",
      "rollout_start": "2024-01-15",
      "expected_full_rollout": "2024-02-01",
      "owner": "ml-team@company.com"
    }
  }
}
```

## Deployment Strategies

### 4. Choose the Right Strategy

**Linear Deployment:**
- **Use for:** Development environments, low-risk changes, configuration updates
- **Advantages:** Gradual rollout, easy to monitor
- **Settings:** 10% every 30 seconds

**Canary Deployment:**
- **Use for:** Production, high-risk changes, new features
- **Advantages:** Quick validation, fast rollback
- **Settings:** 20% initial, then 100% after bake time

**Example Decision Matrix:**
| Change Type | Environment | Strategy |
|-------------|-------------|----------|
| Bug fix config | Dev | Linear |
| New feature flag | Staging | Canary |
| Critical fix | Production | Canary |
| Minor adjustment | Production | Linear |
| Major refactor | All | Canary |

### 5. Deployment Validation

**DO:**
- Enable CloudWatch alarms for all deployments
- Set appropriate error thresholds (e.g., 5% error rate)
- Monitor application metrics during deployment
- Have rollback plan ready before deploying

**DON'T:**
- Disable monitors "just for this deployment"
- Deploy to production during peak hours
- Skip pre-deployment testing in staging

**Example Monitoring:**
```yaml
DeploymentErrorsAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmDescription: Trigger on AppConfig deployment errors
    MetricName: DeploymentErrors
    Threshold: 5  # Max 5% error rate
    EvaluationPeriods: 2
    ComparisonOperator: GreaterThanThreshold
```

### 6. Bake Time

**DO:**
- Set appropriate bake times based on traffic patterns
- Allow enough time to detect issues (minimum 5 minutes for production)
- Monitor metrics during bake time
- Adjust based on historical deployment data

**Recommended Bake Times:**
- Development: 30 seconds
- Staging: 2 minutes
- Production: 5-10 minutes
- Critical production: 15+ minutes

## Security

### 7. Secrets Management

**DO:**
- Use AWS Secrets Manager for sensitive values
- Reference secrets by ARN in configurations
- Rotate secrets regularly
- Use IAM roles instead of access keys

**DON'T:**
- Store credentials in configuration files
- Commit secrets to version control
- Use the same credentials across environments

**Example:**
```json
{
  "database": {
    "host": "prod-db.example.com",
    "port": 5432,
    "credentials_arn": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod-db-creds"
  }
}
```

### 8. Access Control

**DO:**
- Use least privilege IAM policies
- Separate deployment roles for different environments
- Enable MFA for production deployments
- Audit access regularly

**Example IAM Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "appconfig:GetConfiguration",
      "appconfig:StartConfigurationSession",
      "appconfig:GetLatestConfiguration"
    ],
    "Resource": "arn:aws:appconfig:*:*:application/*/environment/dev/*"
  }]
}
```

### 9. Encryption

**DO:**
- Enable encryption at rest for S3 buckets
- Use AWS KMS for sensitive configurations
- Enable encryption in transit (HTTPS)
- Regularly audit encryption settings

**Example S3 Encryption:**
```yaml
ConfigBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketEncryption:
      ServerSideEncryptionConfiguration:
        - ServerSideEncryptionByDefault:
            SSEAlgorithm: aws:kms
            KMSMasterKeyID: !Ref ConfigEncryptionKey
```

## Configuration Design

### 10. Configuration Structure

**DO:**
- Use hierarchical structure for related settings
- Group configurations by domain (database, api, features)
- Keep configurations flat when possible
- Use consistent naming conventions

**Example:**
```json
{
  "database": {
    "connection": {
      "host": "db.example.com",
      "port": 5432,
      "pool_size": 10
    },
    "timeouts": {
      "connect_seconds": 5,
      "query_seconds": 30
    }
  },
  "api": {
    "rate_limiting": {
      "enabled": true,
      "requests_per_minute": 1000
    }
  }
}
```

### 11. Default Values

**DO:**
- Provide sensible defaults in application code
- Document default behavior
- Use explicit values in configuration files
- Validate configurations at startup

**Example in Application:**
```python
class Config:
    def __init__(self, appconfig_data):
        # Explicit defaults
        self.max_retries = appconfig_data.get('max_retries', 3)
        self.timeout = appconfig_data.get('timeout_seconds', 30)
        
        # Validate
        if self.max_retries < 1:
            raise ValueError("max_retries must be >= 1")
```

### 12. Configuration Size

**DO:**
- Keep configuration files under 64KB (AppConfig limit)
- Split large configurations into multiple profiles
- Use references to external resources for large data
- Compress configurations if needed

**DON'T:**
- Include large datasets in configuration
- Duplicate data across configuration files
- Store binary data in JSON configs

## Monitoring and Observability

### 13. Logging

**DO:**
- Log all configuration retrievals
- Include configuration version in logs
- Monitor configuration fetch failures
- Track which configuration values are actually used

**Example:**
```python
logger.info(
    "Retrieved AppConfig configuration",
    extra={
        "application_id": app_id,
        "environment": environment,
        "version": config_version,
        "timestamp": datetime.utcnow()
    }
)
```

### 14. Metrics

**DO:**
- Track deployment success/failure rates
- Monitor configuration retrieval latency
- Measure time between configuration updates
- Alert on unexpected configuration changes

**Key Metrics:**
- Deployment success rate (target: >99%)
- Configuration retrieval latency (target: <100ms)
- Configuration cache hit rate (target: >95%)
- Rollback frequency (target: <1% of deployments)

### 15. Alerting

**DO:**
- Set up alerts for deployment failures
- Alert on configuration retrieval errors
- Monitor for unexpected rollbacks
- Configure SNS topics for critical alerts

**Example Alert Configuration:**
```yaml
DeploymentFailureAlert:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: !Sub "${ProjectName}-deployment-failures"
    AlarmDescription: Alert on deployment failures
    MetricName: DeploymentFailures
    Statistic: Sum
    Period: 300
    EvaluationPeriods: 1
    Threshold: 1
    ComparisonOperator: GreaterThanOrEqualToThreshold
    AlarmActions:
      - !Ref CriticalAlertsTopic
```

## Testing

### 16. Configuration Validation

**DO:**
- Validate configuration syntax before deployment
- Use JSON Schema for structure validation
- Test configuration changes in non-production first
- Implement automated validation in CI/CD

**Example Validation Script:**
```python
import jsonschema

schema = {
    "type": "object",
    "required": ["log_level", "max_retries"],
    "properties": {
        "log_level": {"enum": ["DEBUG", "INFO", "WARNING", "ERROR"]},
        "max_retries": {"type": "integer", "minimum": 1, "maximum": 10}
    }
}

with open('config.json') as f:
    config = json.load(f)
    jsonschema.validate(config, schema)
```

### 17. Integration Testing

**DO:**
- Test configuration changes with integration tests
- Verify application behavior with new configurations
- Test rollback scenarios
- Simulate deployment failures

**Example Test:**
```python
def test_appconfig_retrieval():
    """Test that application retrieves config correctly"""
    config = get_appconfig(app_id='test-app', env='dev')
    assert config['max_retries'] == 3
    assert 'database' in config
    assert config['database']['port'] > 0
```

## Documentation

### 18. Configuration Documentation

**DO:**
- Document all configuration parameters
- Explain the impact of changing values
- Provide examples for each configuration option
- Keep documentation up-to-date with code

**Example:**
```json
{
  "max_retries": 3,
  "_comment_max_retries": "Maximum number of retry attempts for failed operations. Range: 1-10. Higher values increase resilience but may delay error detection.",
  
  "timeout_seconds": 30,
  "_comment_timeout": "Operation timeout in seconds. Increase for slow networks, decrease for faster failure detection. Must be > 0."
}
```

### 19. Change Management

**DO:**
- Document why configuration changes are made
- Link configurations to tickets/issues
- Communicate changes to affected teams
- Maintain runbook for common configuration tasks

**Example Change Log:**
```markdown
## 2024-01-15 - Production Configuration Update

### Changed
- Increased `max_retries` from 3 to 5
- Added `retry_delay_seconds` parameter (default: 1)

### Reason
- Reduce transient failure impact
- Improve resilience during AWS service degradations

### Impact
- Applications will retry failed operations more times
- Slightly increased latency on persistent failures

### Rollback Plan
- Revert to commit abc123
- Deploy previous configuration using canary strategy
```

## Performance

### 20. Caching

**DO:**
- Implement client-side caching of configurations
- Use AppConfig's built-in polling mechanism
- Set appropriate cache TTLs (typically 15-60 seconds)
- Invalidate cache on deployment

**Example:**
```python
class ConfigCache:
    def __init__(self, ttl_seconds=30):
        self.cache = {}
        self.ttl = ttl_seconds
    
    def get(self, key):
        if key in self.cache:
            value, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl:
                return value
        
        # Fetch from AppConfig
        new_value = fetch_from_appconfig(key)
        self.cache[key] = (new_value, time.time())
        return new_value
```

## Disaster Recovery

### 21. Backup and Recovery

**DO:**
- Enable S3 versioning for configuration storage
- Regularly backup configuration files
- Test configuration restoration procedures
- Document recovery time objectives (RTO)

**Example Backup Script:**
```bash
#!/bin/bash
# Backup all configurations
DATE=$(date +%Y%m%d)
aws s3 sync s3://appconfig-bucket/ \
  s3://appconfig-backups/$DATE/ \
  --include "*.json"
```

### 22. Multi-Region

**DO:**
- Consider multi-region deployments for critical apps
- Replicate configurations across regions
- Test region failover procedures
- Use Route53 health checks

## Compliance

### 23. Audit Trail

**DO:**
- Enable CloudTrail for all AppConfig operations
- Log who made configuration changes
- Monitor for unauthorized access
- Retain logs per compliance requirements

**Example CloudTrail Query:**
```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceType,AttributeValue=AWS::AppConfig::Application \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-31T23:59:59Z
```

### 24. Data Retention

**DO:**
- Define retention policies for configurations
- Archive old configuration versions
- Comply with data retention regulations
- Implement automated cleanup

**Example Lifecycle Policy:**
```yaml
ConfigBucketLifecycle:
  Type: AWS::S3::Bucket
  Properties:
    LifecycleConfiguration:
      Rules:
        - Id: ArchiveOldVersions
          Status: Enabled
          NoncurrentVersionTransitions:
            - TransitionInDays: 90
              StorageClass: GLACIER
          NoncurrentVersionExpiration:
            Days: 365
```

## Summary Checklist

Before deploying configurations:
- [ ] Validated JSON syntax
- [ ] Tested in non-production environment
- [ ] Reviewed security implications
- [ ] Documented changes
- [ ] Configured monitoring and alerts
- [ ] Planned rollback procedure
- [ ] Notified stakeholders
- [ ] Selected appropriate deployment strategy
- [ ] Set up bake time and validation
- [ ] Verified IAM permissions

After deployment:
- [ ] Monitored metrics during rollout
- [ ] Verified application behavior
- [ ] Checked for errors/warnings
- [ ] Updated documentation
- [ ] Communicated completion
- [ ] Archived deployment records
