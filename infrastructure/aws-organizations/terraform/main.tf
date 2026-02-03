terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "ai-med-agent-terraform-state"
    key            = "organizations/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      ManagedBy   = "Terraform"
      Project     = "AI-Med-Agent"
      Environment = "Management"
    }
  }
}

# Enable AWS Organizations
resource "aws_organizations_organization" "main" {
  aws_service_access_principals = [
    "cloudtrail.amazonaws.com",
    "config.amazonaws.com",
    "guardduty.amazonaws.com",
    "securityhub.amazonaws.com",
    "sso.amazonaws.com",
    "account.amazonaws.com",
  ]

  enabled_policy_types = [
    "SERVICE_CONTROL_POLICY",
    "TAG_POLICY",
    "BACKUP_POLICY",
  ]

  feature_set = "ALL"
}

# Organizational Units
resource "aws_organizations_organizational_unit" "production" {
  name      = "Production"
  parent_id = aws_organizations_organization.main.roots[0].id
}

resource "aws_organizations_organizational_unit" "development" {
  name      = "Development"
  parent_id = aws_organizations_organization.main.roots[0].id
}

resource "aws_organizations_organizational_unit" "staging" {
  name      = "Staging"
  parent_id = aws_organizations_organization.main.roots[0].id
}

resource "aws_organizations_organizational_unit" "security" {
  name      = "Security"
  parent_id = aws_organizations_organization.main.roots[0].id
}

resource "aws_organizations_organizational_unit" "infrastructure" {
  name      = "Infrastructure"
  parent_id = aws_organizations_organization.main.roots[0].id
}

# Nested OUs
resource "aws_organizations_organizational_unit" "production_workloads" {
  name      = "Workloads"
  parent_id = aws_organizations_organizational_unit.production.id
}

resource "aws_organizations_organizational_unit" "production_data" {
  name      = "Data"
  parent_id = aws_organizations_organizational_unit.production.id
}

resource "aws_organizations_organizational_unit" "development_workloads" {
  name      = "Workloads"
  parent_id = aws_organizations_organizational_unit.development.id
}

resource "aws_organizations_organizational_unit" "development_sandbox" {
  name      = "Sandbox"
  parent_id = aws_organizations_organizational_unit.development.id
}

# Service Control Policies
resource "aws_organizations_policy" "deny_root_user" {
  name        = "DenyRootUserAccess"
  description = "Deny root user access across all accounts"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid      = "DenyRootUser"
      Effect   = "Deny"
      Action   = "*"
      Resource = "*"
      Condition = {
        StringLike = {
          "aws:PrincipalArn" = "arn:aws:iam::*:root"
        }
      }
    }]
  })
}

resource "aws_organizations_policy" "require_mfa" {
  name        = "RequireMFA"
  description = "Require MFA for all actions"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "DenyAllExceptListedIfNoMFA"
      Effect = "Deny"
      NotAction = [
        "iam:CreateVirtualMFADevice",
        "iam:EnableMFADevice",
        "iam:GetUser",
        "iam:ListMFADevices",
        "iam:ListVirtualMFADevices",
        "iam:ResyncMFADevice",
        "sts:GetSessionToken"
      ]
      Resource = "*"
      Condition = {
        BoolIfExists = {
          "aws:MultiFactorAuthPresent" = "false"
        }
      }
    }]
  })
}

resource "aws_organizations_policy" "deny_regions" {
  name        = "DenyNonApprovedRegions"
  description = "Deny access to non-approved AWS regions"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "DenyNonApprovedRegions"
      Effect = "Deny"
      NotAction = [
        "cloudfront:*",
        "iam:*",
        "route53:*",
        "support:*",
        "budgets:*"
      ]
      Resource = "*"
      Condition = {
        StringNotEquals = {
          "aws:RequestedRegion" = var.approved_regions
        }
      }
    }]
  })
}

resource "aws_organizations_policy" "prevent_data_deletion" {
  name        = "PreventDataDeletion"
  description = "Prevent deletion of critical data resources"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "PreventS3BucketDeletion"
        Effect = "Deny"
        Action = [
          "s3:DeleteBucket",
          "s3:DeleteBucketPolicy"
        ]
        Resource = "*"
      },
      {
        Sid    = "PreventRDSDeletion"
        Effect = "Deny"
        Action = [
          "rds:DeleteDBInstance",
          "rds:DeleteDBCluster"
        ]
        Resource = "*"
      },
      {
        Sid    = "PreventDynamoDBDeletion"
        Effect = "Deny"
        Action = [
          "dynamodb:DeleteTable"
        ]
        Resource = "*"
      }
    ]
  })
}

# Policy Attachments
resource "aws_organizations_policy_attachment" "deny_root_production" {
  policy_id = aws_organizations_policy.deny_root_user.id
  target_id = aws_organizations_organizational_unit.production.id
}

resource "aws_organizations_policy_attachment" "deny_root_development" {
  policy_id = aws_organizations_policy.deny_root_user.id
  target_id = aws_organizations_organizational_unit.development.id
}

resource "aws_organizations_policy_attachment" "require_mfa_production" {
  policy_id = aws_organizations_policy.require_mfa.id
  target_id = aws_organizations_organizational_unit.production.id
}

resource "aws_organizations_policy_attachment" "deny_regions_production" {
  policy_id = aws_organizations_policy.deny_regions.id
  target_id = aws_organizations_organizational_unit.production.id
}

resource "aws_organizations_policy_attachment" "prevent_deletion_production" {
  policy_id = aws_organizations_policy.prevent_data_deletion.id
  target_id = aws_organizations_organizational_unit.production.id
}

# Outputs
output "organization_id" {
  description = "The ID of the organization"
  value       = aws_organizations_organization.main.id
}

output "organization_root_id" {
  description = "The ID of the root"
  value       = aws_organizations_organization.main.roots[0].id
}

output "production_ou_id" {
  description = "Production OU ID"
  value       = aws_organizations_organizational_unit.production.id
}

output "development_ou_id" {
  description = "Development OU ID"
  value       = aws_organizations_organizational_unit.development.id
}

output "security_ou_id" {
  description = "Security OU ID"
  value       = aws_organizations_organizational_unit.security.id
}
