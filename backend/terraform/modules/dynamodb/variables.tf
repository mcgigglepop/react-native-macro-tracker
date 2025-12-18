variable "table_name_prefix" {
  description = "Prefix for DynamoDB table names"
  type        = string
}

variable "billing_mode" {
  description = "DynamoDB billing mode (PAY_PER_REQUEST or PROVISIONED)"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption (null for default AWS managed key)"
  type        = string
  default     = null
}

variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery for all tables"
  type        = bool
  default     = false
}

variable "tables" {
  description = "Map of table configurations"
  type = map(object({
    hash_key  = string
    range_key = optional(string)
    global_secondary_indexes = optional(list(object({
      name            = string
      hash_key        = string
      range_key       = optional(string)
      projection_type = string
    })), [])
    enable_point_in_time_recovery = optional(bool, null)
  }))
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
