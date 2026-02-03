# AWS Organizations Setup Guide

This guide provides comprehensive instructions for setting up AWS Organizations for the AI-Med-Agent autonomous governance platform.

## Overview

AWS Organizations enables centralized management of multiple AWS accounts with:
- Organizational Units (OUs) for logical grouping
- Service Control Policies (SCPs) for governance
- Tag Policies for resource standardization
- Consolidated billing across all accounts

## Architecture

```
Root
├── Production OU
│   ├── Workloads OU
│   └── Data OU
├── Development OU
│   ├── Workloads OU
│   └── Sandbox OU
├── Staging OU
├── Security OU
└── Infrastructure OU
```

## Prerequisites

1. **Management Account**: AWS account with Organizations administrator privileges
2. **AWS CLI**: Configured with appropriate credentials
3. **Terraform** (optional): Version 1.0 or higher
4. **Permissions**: `organizations:*` permissions in management account

## Deployment Options

### Option 1: CloudFormation

```bash
# Navigate to CloudFormation directory
cd infrastructure/aws-organizations/cloudformation

# Validate template
aws cloudformation validate-template \
  --template-body file://organization-structure.yaml

# Deploy stack
aws cloudformation create-stack \
  --stack-name ai-med-agent-organization \
  --template-body file://organization-structure.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameters ParameterKey=OrganizationName,ParameterValue=AI-Med-Agent-Org

# Monitor stack creation
aws cloudformation wait stack-create-complete \
  --stack-name ai-med-agent-organization

# Get outputs
aws cloudformation describe-stacks \
  --stack-name ai-med-agent-organization \
  --query 'Stacks[0].Outputs'
```

### Option 2: Terraform

```bash
# Navigate to Terraform directory
cd infrastructure/aws-organizations/terraform

# Initialize Terraform
terraform init

# Review planned changes
terraform plan

# Apply configuration
terraform apply

# View outputs
terraform output
```

### Option 3: AWS CLI

```bash
# Enable AWS Organizations
aws organizations create-organization \
  --feature-set ALL

# Create Production OU
PROD_OU=$(aws organizations create-organizational-unit \
  --parent-id $(aws organizations list-roots --query 'Roots[0].Id' --output text) \
  --name Production \
  --query 'OrganizationalUnit.Id' \
  --output text)

# Create Development OU
DEV_OU=$(aws organizations create-organizational-unit \
  --parent-id $(aws organizations list-roots --query 'Roots[0].Id' --output text) \
  --name Development \
  --query 'OrganizationalUnit.Id' \
  --output text)

# Apply Service Control Policy
aws organizations create-policy \
  --content file://policies/scp-deny-root-user.json \
  --description "Deny root user access" \
  --name DenyRootUser \
  --type SERVICE_CONTROL_POLICY
```

## Service Control Policies (SCPs)

### 1. Deny Root User Access
**Purpose**: Prevent use of root user credentials
**Applies to**: All OUs except Root
**File**: `policies/scp-deny-root-user.json`

### 2. Require MFA
**Purpose**: Enforce multi-factor authentication
**Applies to**: Production, Security OUs
**File**: `policies/scp-require-mfa.json`

### 3. Deny Non-Approved Regions
**Purpose**: Limit operations to approved AWS regions
**Applies to**: Production, Development OUs
**Approved Regions**: us-east-1, us-west-2, eu-west-1
**File**: `policies/scp-deny-regions.json`

### 4. Prevent Data Deletion
**Purpose**: Protect critical data resources from deletion
**Applies to**: Production OU
**Protected Resources**: S3, RDS, DynamoDB, EBS
**File**: `policies/scp-prevent-data-deletion.json`

## Account Management

### Creating New Accounts

```bash
# Create new account
aws organizations create-account \
  --email prod-account-1@example.com \
  --account-name "Production-Account-1"

# Get account creation status
aws organizations describe-create-account-status \
  --create-account-request-id <request-id>

# Move account to OU
aws organizations move-account \
  --account-id <account-id> \
  --source-parent-id <root-id> \
  --destination-parent-id <ou-id>
```

### Account Naming Convention

- **Production**: `prod-<service>-<number>`
- **Development**: `dev-<service>-<number>`
- **Staging**: `staging-<service>-<number>`
- **Security**: `security-<function>`
- **Infrastructure**: `infra-<function>`

## Tag Policies

### Required Tags

All resources in Production and Development OUs must have:

1. **Environment**: Production | Development | Staging
2. **Owner**: Team or individual responsible
3. **CostCenter**: Cost allocation identifier
4. **Application**: Application name
5. **ManagedBy**: Terraform | CloudFormation | Manual

### Applying Tag Policies

```bash
# Create tag policy
aws organizations create-policy \
  --content file://policies/tag-policy.json \
  --description "Required resource tags" \
  --name RequiredTags \
  --type TAG_POLICY

# Attach to OU
aws organizations attach-policy \
  --policy-id <policy-id> \
  --target-id <ou-id>
```

## Cost Management

### Budget Configuration

```bash
# Create organization-wide budget
aws budgets create-budget \
  --account-id <management-account-id> \
  --budget file://budgets/monthly-budget.json \
  --notifications-with-subscribers file://budgets/budget-notifications.json
```

### Cost Allocation Tags

Enable cost allocation tags in management account:

```bash
aws ce update-cost-allocation-tags-status \
  --cost-allocation-tags-status \
    TagKey=Environment,Status=Active \
    TagKey=CostCenter,Status=Active \
    TagKey=Application,Status=Active
```

## Security Configuration

### Enable AWS Services Organization-Wide

```bash
# Enable CloudTrail
aws organizations enable-aws-service-access \
  --service-principal cloudtrail.amazonaws.com

# Enable GuardDuty
aws organizations enable-aws-service-access \
  --service-principal guardduty.amazonaws.com

# Enable Security Hub
aws organizations enable-aws-service-access \
  --service-principal securityhub.amazonaws.com

# Enable AWS Config
aws organizations enable-aws-service-access \
  --service-principal config.amazonaws.com

# Enable AWS SSO
aws organizations enable-aws-service-access \
  --service-principal sso.amazonaws.com
```

### Delegated Administrator Accounts

```bash
# Delegate Security Hub administration
aws organizations register-delegated-administrator \
  --account-id <security-account-id> \
  --service-principal securityhub.amazonaws.com

# Delegate GuardDuty administration
aws organizations register-delegated-administrator \
  --account-id <security-account-id> \
  --service-principal guardduty.amazonaws.com
```

## Monitoring and Compliance

### CloudTrail Organization Trail

```bash
# Create organization trail
aws cloudtrail create-trail \
  --name organization-trail \
  --s3-bucket-name <cloudtrail-bucket> \
  --is-organization-trail \
  --is-multi-region-trail

# Start logging
aws cloudtrail start-logging \
  --name organization-trail
```

### AWS Config Organization Aggregator

```bash
# Create organization aggregator
aws configservice put-configuration-aggregator \
  --configuration-aggregator-name organization-aggregator \
  --organization-aggregation-source \
    RoleArn=<config-role-arn>,AllAwsRegions=true
```

## AI-Med-Agent Integration

### Autonomous Decision Making

The AI-Med-Agent backend integrates with Organizations API to:

1. **Monitor Account Health**: Track compliance, security, and cost metrics
2. **Autonomous Actions**: Create accounts, apply policies, move accounts between OUs
3. **Policy Recommendations**: Suggest SCP and tag policy updates
4. **Cost Optimization**: Identify savings opportunities across accounts

### Required IAM Role

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "organizations:List*",
        "organizations:Describe*",
        "organizations:CreateAccount",
        "organizations:MoveAccount",
        "organizations:AttachPolicy",
        "organizations:DetachPolicy"
      ],
      "Resource": "*"
    }
  ]
}
```

## Troubleshooting

### Common Issues

1. **Policy Conflicts**: Check inherited SCPs from parent OUs
2. **Account Limits**: Default limit is 10 accounts (request increase)
3. **Email Requirements**: Each account needs unique email address
4. **Region Restrictions**: Some services not available in all regions

### Validation Commands

```bash
# List all OUs
aws organizations list-organizational-units-for-parent \
  --parent-id $(aws organizations list-roots --query 'Roots[0].Id' --output text)

# List accounts in OU
aws organizations list-accounts-for-parent \
  --parent-id <ou-id>

# List policies attached to OU
aws organizations list-policies-for-target \
  --target-id <ou-id> \
  --filter SERVICE_CONTROL_POLICY

# Check effective policies
aws organizations describe-effective-policy \
  --policy-type SERVICE_CONTROL_POLICY \
  --target-id <account-id>
```

## Best Practices

1. **Use SCPs Defensively**: Start with permissive policies, tighten gradually
2. **Test in Development**: Validate policies in dev before applying to prod
3. **Monitor Policy Changes**: CloudTrail logs all Organizations API calls
4. **Regular Reviews**: Audit account structure and policies quarterly
5. **Least Privilege**: Apply minimum necessary permissions via SCPs
6. **Cost Tracking**: Tag all resources for accurate cost allocation
7. **Backup Policies**: Version control all SCP and tag policy JSON files
8. **Documentation**: Maintain runbook for account provisioning

## Security Checklist

- [ ] Root user MFA enabled on all accounts
- [ ] CloudTrail enabled organization-wide
- [ ] GuardDuty enabled in all regions
- [ ] Security Hub enabled with standards
- [ ] AWS Config rules deployed
- [ ] SCPs applied to all OUs
- [ ] Tag policies enforced
- [ ] Cost budgets configured
- [ ] Billing alerts set up
- [ ] AWS SSO configured for access

## Resources

- [AWS Organizations Documentation](https://docs.aws.amazon.com/organizations/)
- [Service Control Policies](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html)
- [Best Practices](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_best-practices.html)
- [AI-Med-Agent Backend Integration](../backend/README.md)

## Support

For issues or questions:
1. Check CloudTrail logs for API errors
2. Review SCP effective policies
3. Validate IAM permissions
4. Contact AWS Support for service limits
