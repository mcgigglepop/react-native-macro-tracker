variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "aws_profile" {
  description = "AWS profile"
  type        = string
  default     = "217797467952_AdministratorAccess"
}

variable "application_name" {
  description = "Application name"
  type        = string
  default     = "macro-tracker"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Application = "macro-tracker"
    ManagedBy   = "terraform"
  }
}
