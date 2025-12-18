
output "api_id" {
  description = "API Gateway ID"
  value       = aws_api_gateway_rest_api.this.id
}

output "api_url" {
  description = "API Gateway endpoint URL"
  value       = "https://${aws_api_gateway_rest_api.this.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${aws_api_gateway_stage.this.stage_name}"
}

output "execution_arn" {
  description = "API Gateway execution ARN"
  value       = aws_api_gateway_rest_api.this.execution_arn
}
