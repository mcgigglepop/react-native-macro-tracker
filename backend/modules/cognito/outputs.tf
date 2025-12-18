output "cognito_user_pool_id" {
  description = "The unique identifier (ID) assigned to the Amazon Cognito User Pool."
  value       = aws_cognito_user_pool.this.id
}

output "cognito_client_id" {
  description = "The unique identifier (ID) assigned to the Cognito User Pool App Client, used for authentication requests."
  value       = aws_cognito_user_pool_client.this.id
}

output "cognito_user_pool_arn" {
  description = "The Amazon Resource Name (ARN) for the Cognito User Pool, used for IAM policies and cross-service references."
  value       = aws_cognito_user_pool.this.arn
}