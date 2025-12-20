##################################
# DATA SOURCES
##################################
data "aws_region" "current" {}

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
  depends_on = [
    aws_api_gateway_method.food_records_post,
    aws_api_gateway_method.food_records_get,
    aws_api_gateway_method.food_records_delete,
    aws_api_gateway_method.food_records_options,
    aws_api_gateway_method.user_info_get,
    aws_api_gateway_method.user_info_options,
    aws_api_gateway_method.food_records_range_get,
    aws_api_gateway_method.food_records_range_options,
    aws_api_gateway_integration.food_records_post,
    aws_api_gateway_integration.food_records_get,
    aws_api_gateway_integration.food_records_delete,
    aws_api_gateway_integration.food_records_options,
    aws_api_gateway_integration.user_info_get,
    aws_api_gateway_integration.user_info_options,
    aws_api_gateway_integration.food_records_range_get,
    aws_api_gateway_integration.food_records_range_options,
  ]

  rest_api_id = aws_api_gateway_rest_api.this.id

  triggers = {
    redeployment = sha1(jsonencode({
      authorizer                  = aws_api_gateway_authorizer.this.id,
      food_records_post           = aws_api_gateway_method.food_records_post.id,
      food_records_get            = aws_api_gateway_method.food_records_get.id,
      food_records_delete         = aws_api_gateway_method.food_records_delete.id,
      food_records_options        = aws_api_gateway_method.food_records_options.id,
      food_records_range_get      = aws_api_gateway_method.food_records_range_get.id,
      food_records_range_options  = aws_api_gateway_method.food_records_range_options.id,
      user_info_get               = aws_api_gateway_method.user_info_get.id,
      user_info_options           = aws_api_gateway_method.user_info_options.id,
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

##################################
# FOOD RECORDS ENDPOINTS
##################################

# Resource for /food-records
resource "aws_api_gateway_resource" "food_records" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "food-records"
}

# OPTIONS method for CORS preflight
resource "aws_api_gateway_method" "food_records_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.food_records.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "food_records_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.food_records.id
  http_method = aws_api_gateway_method.food_records_options.http_method

  type = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "food_records_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.food_records.id
  http_method = aws_api_gateway_method.food_records_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "food_records_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.food_records.id
  http_method = aws_api_gateway_method.food_records_options.http_method
  status_code = aws_api_gateway_method_response.food_records_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# POST method for creating food records
resource "aws_api_gateway_method" "food_records_post" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.food_records.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.this.id
}

resource "aws_api_gateway_integration" "food_records_post" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.food_records.id
  http_method = aws_api_gateway_method.food_records_post.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = var.lambda_functions["create-food-record"]
}

resource "aws_lambda_permission" "food_records_post" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["create-food-record"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

# GET method for getting food records
resource "aws_api_gateway_method" "food_records_get" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.food_records.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.this.id
}

resource "aws_api_gateway_integration" "food_records_get" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.food_records.id
  http_method = aws_api_gateway_method.food_records_get.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = var.lambda_functions["get-food-records"]
}

resource "aws_lambda_permission" "food_records_get" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["get-food-records"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

# Resource for /food-records/{recordId}
resource "aws_api_gateway_resource" "food_records_record_id" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.food_records.id
  path_part   = "{recordId}"
}

# DELETE method for deleting a specific food record
resource "aws_api_gateway_method" "food_records_delete" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.food_records_record_id.id
  http_method   = "DELETE"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.this.id
}

resource "aws_api_gateway_integration" "food_records_delete" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.food_records_record_id.id
  http_method = aws_api_gateway_method.food_records_delete.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = var.lambda_functions["delete-food-record"]
}

resource "aws_lambda_permission" "food_records_delete" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["delete-food-record"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

# Resource for /user-info
resource "aws_api_gateway_resource" "user_info" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "user-info"
}

# GET method for getting user information
resource "aws_api_gateway_method" "user_info_get" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.user_info.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.this.id
}

resource "aws_api_gateway_integration" "user_info_get" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.user_info.id
  http_method = aws_api_gateway_method.user_info_get.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = var.lambda_functions["get-user-info"]
}

resource "aws_lambda_permission" "user_info_get" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["get-user-info"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

# Resource for /food-records/range
resource "aws_api_gateway_resource" "food_records_range" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.food_records.id
  path_part   = "range"
}

# GET method for getting food records in a date range
resource "aws_api_gateway_method" "food_records_range_get" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.food_records_range.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.this.id
}

resource "aws_api_gateway_integration" "food_records_range_get" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.food_records_range.id
  http_method = aws_api_gateway_method.food_records_range_get.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = var.lambda_functions["get-food-records-range"]
}

resource "aws_lambda_permission" "food_records_range_get" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["get-food-records-range"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

# OPTIONS method for CORS preflight
resource "aws_api_gateway_method" "food_records_range_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.food_records_range.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "food_records_range_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.food_records_range.id
  http_method = aws_api_gateway_method.food_records_range_options.http_method

  type = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "food_records_range_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.food_records_range.id
  http_method = aws_api_gateway_method.food_records_range_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "food_records_range_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.food_records_range.id
  http_method = aws_api_gateway_method.food_records_range_options.http_method
  status_code = aws_api_gateway_method_response.food_records_range_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# OPTIONS method for CORS preflight
resource "aws_api_gateway_method" "user_info_options" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.user_info.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "user_info_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.user_info.id
  http_method = aws_api_gateway_method.user_info_options.http_method

  type = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "user_info_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.user_info.id
  http_method = aws_api_gateway_method.user_info_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "user_info_options" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.user_info.id
  http_method = aws_api_gateway_method.user_info_options.http_method
  status_code = aws_api_gateway_method_response.user_info_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}