##################################
# REST API GATEWAY
##################################
resource "aws_api_gateway_rest_api" "this" {
  name = var.name
}

resource "aws_api_gateway_authorizer" "this" {
  name            = "${var.name}-cognito-auth"
  rest_api_id     = aws_api_gateway_rest_api.this.id
  identity_source = "method.request.header.Authorization"
  type            = "COGNITO_USER_POOLS"
  provider_arns   = [var.user_pool_arn]
}

##################################
# FOOD LOGS ENDPOINT - POST
##################################
resource "aws_api_gateway_resource" "food_logs" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "food-logs"
}

resource "aws_api_gateway_method" "food_logs_post" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.food_logs.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.this.id
}

resource "aws_api_gateway_integration" "food_logs_post" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.food_logs.id
  http_method             = aws_api_gateway_method.food_logs_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.log_food_invoke_arn
}

resource "aws_api_gateway_method_response" "food_logs_post" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.food_logs.id
  http_method = aws_api_gateway_method.food_logs_post.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration_response" "food_logs_post" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.food_logs.id
  http_method = aws_api_gateway_method.food_logs_post.http_method
  status_code = aws_api_gateway_method_response.food_logs_post.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }
}

# OPTIONS method for CORS preflight
resource "aws_api_gateway_method" "food_logs_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.food_logs.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "food_logs_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.food_logs.id
  http_method = aws_api_gateway_method.food_logs_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "food_logs_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.food_logs.id
  http_method = aws_api_gateway_method.food_logs_options.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "food_logs_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.food_logs.id
  http_method = aws_api_gateway_method.food_logs_options.http_method
  status_code = aws_api_gateway_method_response.food_logs_options.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

##################################
# FOOD LOGS ENDPOINT - GET
##################################
resource "aws_api_gateway_method" "food_logs_get" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.food_logs.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.this.id
}

resource "aws_api_gateway_integration" "food_logs_get" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.food_logs.id
  http_method             = aws_api_gateway_method.food_logs_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.get_food_logs_invoke_arn
}

resource "aws_api_gateway_method_response" "food_logs_get" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.food_logs.id
  http_method = aws_api_gateway_method.food_logs_get.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration_response" "food_logs_get" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.food_logs.id
  http_method = aws_api_gateway_method.food_logs_get.http_method
  status_code = aws_api_gateway_method_response.food_logs_get.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }
}

##################################
# DEPLOYMENT + STAGE
##################################
data "aws_region" "current" {}

resource "aws_api_gateway_deployment" "this" {
  depends_on = [
    aws_api_gateway_integration.food_logs_post,
    aws_api_gateway_integration.food_logs_get,
    aws_api_gateway_integration.food_logs_options,
  ]

  rest_api_id = aws_api_gateway_rest_api.this.id

  triggers = {
    redeployment = sha1(jsonencode({
      food_logs_post    = aws_api_gateway_integration.food_logs_post.id
      food_logs_get     = aws_api_gateway_integration.food_logs_get.id
      food_logs_options = aws_api_gateway_integration.food_logs_options.id
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
  name              = "/aws/apigateway/${var.name}"
  retention_in_days = 7
}

resource "aws_iam_role" "api_gateway_logs" {
  name = "${var.name}_apigw_logs_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "apigateway.amazonaws.com" }
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
