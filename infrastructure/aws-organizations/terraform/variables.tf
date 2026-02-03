variable "aws_region" {
  description = "AWS region for the management account"
  type        = string
  default     = "us-east-1"
}

variable "organization_name" {
  description = "Name of the AWS Organization"
  type        = string
  default     = "AI-Med-Agent-Organization"
}

variable "approved_regions" {
  description = "List of approved AWS regions"
  type        = list(string)
  default = [
    "us-east-1",
    "us-west-2",
    "eu-west-1"
  ]
}

variable "environment_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "AI-Med-Agent"
    ManagedBy   = "Terraform"
    Environment = "Management"
  }
}

variable "enable_cloudtrail" {
  description = "Enable CloudTrail for the organization"
  type        = bool
  default     = true
}

variable "enable_guardduty" {
  description = "Enable GuardDuty for the organization"
  type        = bool
  default     = true
}

variable "enable_config" {
  description = "Enable AWS Config for the organization"
  type        = bool
  default     = true
}

variable "enable_security_hub" {
  description = "Enable Security Hub for the organization"
  type        = bool
  default     = true
}

variable "cost_anomaly_threshold" {
  description = "Threshold for cost anomaly detection"
  type        = number
  default     = 100
}

variable "budget_limit" {
  description = "Monthly budget limit in USD"
  type        = number
  default     = 10000
}
