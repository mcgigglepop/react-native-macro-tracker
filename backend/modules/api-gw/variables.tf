variable "environment" {
  description = "The deployment environment for this stack (e.g., dev, staging, prod)."
  type        = string
}

variable "application_name" {
  description = "A unique, human-readable name used to identify this application across AWS resources."
  type        = string
}

variable "cognito_user_pool_arn" {
  description = "The Amazon Resource Name (ARN) for the Cognito User Pool, used for IAM policies and cross-service references."
  type        = string
}
