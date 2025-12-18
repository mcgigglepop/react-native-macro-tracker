output "user_pool_id" {
  description = "The ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "The ARN of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.arn
}

output "client_id" {
  description = "The ID of the Cognito User Pool Client"
  value       = aws_cognito_user_pool_client.client.id
}

output "client_secret" {
  description = "The client secret of the Cognito User Pool Client (only if generate_client_secret is true)"
  value       = aws_cognito_user_pool_client.client.client_secret
  sensitive   = true
}
