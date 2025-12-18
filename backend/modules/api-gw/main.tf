##################################
# REST API GATEWAY
##################################
resource "aws_api_gateway_rest_api" "this" {
  name = "${var.application_name}-rest-api-${var.environment}"
}

resource "aws_api_gateway_authorizer" "this" {
  name            = "${var.application_name}-cognito-auth-${var.environment}"
  rest_api_id     = aws_api_gateway_rest_api.this.id
  identity_source = "method.request.header.Authorization"
  type            = "COGNITO_USER_POOLS"
  provider_arns   = [var.cognito_user_pool_arn]
}

##################################
# DEPLOYMENT + STAGE
##################################
resource "aws_api_gateway_deployment" "this" {
  depends_on = []

  rest_api_id = aws_api_gateway_rest_api.this.id

  triggers = {
    redeployment = sha1(jsonencode({
      authorizer              = aws_api_gateway_authorizer.this.id,
    }))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "this" {
  deployment_id = aws_api_gateway_deployment.this.id
  rest_api_id   = aws_api_gateway_rest_api.this.id
  stage_name    = var.environment

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.this.arn
    format = jsonencode({
      requestId         = "$context.requestId",
      extendedRequestId = "$context.extendedRequestId",
      sourceIp          = "$context.identity.sourceIp",
      userAgent         = "$context.identity.userAgent",
      requestTime       = "$context.requestTime",
      httpMethod        = "$context.httpMethod",
      path              = "$context.path",
      status            = "$context.status",
      authorizerError   = "$context.authorizer.error"
    })
  }

  depends_on = [
    aws_api_gateway_account.this
  ]
}

resource "aws_api_gateway_method_settings" "this" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  stage_name  = aws_api_gateway_stage.this.stage_name
  method_path = "*/*"

  settings {
    logging_level      = "INFO"
    metrics_enabled    = true
    data_trace_enabled = true
  }
}

##################################
# LOGGING CONFIG
##################################
resource "aws_cloudwatch_log_group" "this" {
  name              = "/aws/apigateway/${var.application_name}-${var.environment}"
  retention_in_days = 7
}

resource "aws_iam_role" "api_gateway_logs" {
  name = "${var.application_name}_apigw_logs_role_${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "apigateway.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "apigw_logs_policy" {
  role       = aws_iam_role.api_gateway_logs.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_api_gateway_account" "this" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_logs.arn

  depends_on = [
    aws_iam_role_policy_attachment.apigw_logs_policy
  ]
}