# Get current AWS account ID and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

########################################################
# LOCALS
########################################################
locals {
  functions = {
    post-confirmation = {
      zip         = "${path.module}/../dist/zips/postConfirmation.zip"
      description = "Cognito Post confirmation Lambda function"
      env         = { USERS_TABLE = module.dynamodb.table_names["users"] }
      iam_policy = jsonencode({
        Version = "2012-10-17"
        Statement = [
          {
            Effect = "Allow"
            Action = [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "dynamodb:PutItem"
            ]
            Resource = [
              "arn:aws:logs:*:*:*",
              module.dynamodb.table_arns["users"]
            ]
          }
        ]
      })
    }
    log-food = {
      zip         = "${path.module}/../dist/zips/logFood.zip"
      description = "Log food entry Lambda function"
      timeout     = 10
      env = {
        FOOD_LOGS_TABLE = module.dynamodb.table_names["food-logs"]
      }
      iam_policy = jsonencode({
        Version = "2012-10-17"
        Statement = [
          {
            Effect = "Allow"
            Action = [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "dynamodb:PutItem"
            ]
            Resource = [
              "arn:aws:logs:*:*:*",
              module.dynamodb.table_arns["food-logs"]
            ]
          }
        ]
      })
    }
    get-food-logs = {
      zip         = "${path.module}/../dist/zips/getFoodLogs.zip"
      description = "Get food logs Lambda function"
      timeout     = 10
      env = {
        FOOD_LOGS_TABLE = module.dynamodb.table_names["food-logs"]
      }
      iam_policy = jsonencode({
        Version = "2012-10-17"
        Statement = [
          {
            Effect = "Allow"
            Action = [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "dynamodb:Query"
            ]
            Resource = [
              "arn:aws:logs:*:*:*",
              module.dynamodb.table_arns["food-logs"],
              "${module.dynamodb.table_arns["food-logs"]}/index/*"
            ]
          }
        ]
      })
    }
  }
}

########################################################
# DYNAMODB
########################################################
module "dynamodb" {
  source = "./modules/dynamodb"

  table_name_prefix = "${var.application_name}-${var.environment}"
  billing_mode      = "PAY_PER_REQUEST"
  kms_key_arn       = null # Use default AWS managed key

  tables = {
    users = {
      hash_key = "PK"
      range_key = "SK"
      global_secondary_indexes = [
        {
          name            = "GSI1"
          hash_key        = "GSI1PK"
          range_key       = "GSI1SK"
          projection_type = "ALL"
        }
      ]
    }
    food-logs = {
      hash_key = "PK"
      range_key = "SK"
      global_secondary_indexes = [
        {
          name            = "GSI1"
          hash_key        = "GSI1PK"
          range_key       = "GSI1SK"
          projection_type = "ALL"
        }
      ]
    }
  }

  tags = var.tags
}

########################################################
# COGNITO
########################################################
module "cognito" {
  source = "./modules/cognito"

  user_pool_name                = "${var.application_name}-${var.environment}"
  auto_verified_attributes       = ["email"]
  email_sending_account          = "COGNITO_DEFAULT"
  verification_email_option      = "CONFIRM_WITH_CODE"
  password_minimum_length        = 8
  password_require_lowercase     = true
  password_require_numbers        = true
  password_require_symbols        = true
  password_require_uppercase      = true
  explicit_auth_flows            = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_SRP_AUTH"]
  generate_client_secret         = false
  refresh_token_validity_days    = 30
  post_confirmation_arn           = module.lambda["post-confirmation"].function_arn
  post_confirmation_function_name = module.lambda["post-confirmation"].function_name

  tags = var.tags
}

########################################################
# LAMBDA FUNCTIONS
########################################################
module "lambda" {
  source   = "./modules/lambda"
  for_each = local.functions

  name        = "${var.application_name}-${var.environment}-${each.key}"
  description = each.value.description
  zip_path    = each.value.zip
  handler     = "index.handler"
  timeout     = try(each.value.timeout, 3)
  env         = each.value.env
  iam_policy  = each.value.iam_policy

  tags = var.tags
}

########################################################
# API GATEWAY
########################################################
module "api_gateway" {
  source = "./modules/api-gw"

  name                 = "${var.application_name}-${var.environment}"
  environment          = var.environment
  user_pool_id         = module.cognito.user_pool_id
  user_pool_arn        = module.cognito.user_pool_arn
  log_food_invoke_arn  = module.lambda["log-food"].invoke_arn
  get_food_logs_invoke_arn = module.lambda["get-food-logs"].invoke_arn

  tags = var.tags
}

########################################################
# LAMBDA PERMISSIONS
########################################################
# Note: Cognito permission is handled in the cognito module

resource "aws_lambda_permission" "allow_api_gateway_log_food" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda["log-food"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.api_gateway.execution_arn}/*/*"
}

resource "aws_lambda_permission" "allow_api_gateway_get_food_logs" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda["get-food-logs"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.api_gateway.execution_arn}/*/*"
}
