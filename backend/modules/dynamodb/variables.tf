variable "table_name_prefix" {
  description = "Prefix for DynamoDB table names (e.g., 'pravvi-prod' will create 'pravvi-prod-users', 'pravvi-prod-cards', etc.)"
  type        = string
}

variable "billing_mode" {
  description = "Billing mode for the DynamoDB tables"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery for all tables"
  type        = bool
  default     = true
}

variable "kms_key_arn" {
  description = "ARN of the KMS key for encryption (null uses AWS managed key)"
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags to apply to all DynamoDB tables"
  type        = map(string)
  default     = {}
}

variable "tables" {
  description = "Map of table configurations. Key is the table name suffix, value contains table configuration."
  type = map(object({
    hash_key  = string
    range_key = optional(string) # Optional - omit for hash-key-only tables
    global_secondary_indexes = list(object({
      name            = string
      hash_key        = string
      range_key       = optional(string)
      projection_type = string
    }))
    enable_ttl                    = bool
    enable_point_in_time_recovery = optional(bool, true)
  }))
}