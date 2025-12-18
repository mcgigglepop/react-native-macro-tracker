variable "user_pool_name" {
  description = "The display name for the Amazon Cognito User Pool that will handle application authentication."
  type        = string
}

variable "application_name" {
  description = "A unique, human-readable name used to identify this application across AWS resources."
  type        = string
}

variable "environment" {
  description = "The deployment environment for this stack (e.g., dev, staging, prod)."
  type        = string
}

variable "post_confirmation_function_name" {
  type = string
}

variable "post_confirmation_arn" {
  type = string
}