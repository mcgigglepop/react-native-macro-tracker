######################
# AWS Provider Variables
######################

variable "aws_region" {
  description = "AWS region where resources will be created"
  type        = string
  default     = "us-west-2"
}

variable "aws_profile" {
  description = "AWS profile to use"
  type        = string
  default     = "217797467952_AdministratorAccess"
}

######################
# Common Variables
######################

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "application_name" {
  description = "Name of the application"
  type        = string
}

variable "environment" {
  description = "Environment"
  type        = string
}
