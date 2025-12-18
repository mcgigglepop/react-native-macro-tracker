variable "name" {
  description = "API Gateway name"
  type        = string
}

variable "user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "user_pool_arn" {
  description = "Cognito User Pool ARN"
  type        = string
}

variable "log_food_function" {
  description = "Lambda function ARN for log-food"
  type        = string
}

variable "get_food_logs_function" {
  description = "Lambda function ARN for get-food-logs"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
