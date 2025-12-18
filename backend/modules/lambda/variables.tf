variable "name" {
  type = string
}
variable "zip_path" {
  type = string
}
variable "handler" {
  type = string
}
variable "env" {
  type    = map(string)
  default = {}
}
variable "tags" {
  type    = map(string)
  default = {}
}
variable "description" {
  type    = string
  default = ""
}
variable "timeout" {
  type        = number
  default     = 3
  description = "Lambda function timeout in seconds"
}

variable "iam_policy" {
  type        = string
  description = "IAM policy JSON document to attach to the Lambda execution role"
}
