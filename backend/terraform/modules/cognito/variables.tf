variable "user_pool_name" {
  description = "Name for the Cognito User Pool"
  type        = string
}

variable "auto_verified_attributes" {
  description = "Attributes to automatically verify"
  type        = list(string)
  default     = ["email"]
}

variable "email_sending_account" {
  description = "Email sending account type (COGNITO_DEFAULT or DEVELOPER)"
  type        = string
  default     = "COGNITO_DEFAULT"
}

variable "verification_email_option" {
  description = "Verification email option (CONFIRM_WITH_CODE or CONFIRM_WITH_LINK)"
  type        = string
  default     = "CONFIRM_WITH_CODE"
}

variable "password_minimum_length" {
  description = "Minimum password length"
  type        = number
  default     = 8
}

variable "password_require_lowercase" {
  description = "Require lowercase characters in password"
  type        = bool
  default     = true
}

variable "password_require_numbers" {
  description = "Require numbers in password"
  type        = bool
  default     = true
}

variable "password_require_symbols" {
  description = "Require symbols in password"
  type        = bool
  default     = true
}

variable "password_require_uppercase" {
  description = "Require uppercase characters in password"
  type        = bool
  default     = true
}

variable "explicit_auth_flows" {
  description = "Explicit authentication flows to enable"
  type        = list(string)
  default = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]
}

variable "generate_client_secret" {
  description = "Whether to generate a client secret"
  type        = bool
  default     = false
}

variable "refresh_token_validity_days" {
  description = "Number of days refresh tokens are valid"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "post_confirmation_arn" {
  description = "ARN of the Lambda function to invoke after user confirmation"
  type        = string
  default     = null
}

variable "post_confirmation_function_name" {
  description = "Name of the Lambda function to invoke after user confirmation"
  type        = string
  default     = null
}
