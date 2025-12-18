variable "name" {
  description = "Lambda function name"
  type        = string
}

variable "description" {
  description = "Lambda function description"
  type        = string
  default     = ""
}

variable "zip_path" {
  description = "Path to the Lambda deployment package ZIP file"
  type        = string
}

variable "handler" {
  description = "Lambda function handler"
  type        = string
  default     = "index.handler"
}

variable "timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 3
}

variable "env" {
  description = "Environment variables for Lambda function"
  type        = map(string)
  default     = {}
}

variable "iam_policy" {
  description = "IAM policy JSON for Lambda execution role"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
