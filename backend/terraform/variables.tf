variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
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
