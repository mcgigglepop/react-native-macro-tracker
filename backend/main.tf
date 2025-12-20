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
    create-food-record = {
      zip         = "${path.module}/../dist/zips/createFoodRecord.zip"
      description = "API Gateway Lambda function for creating food log records"
      env         = { 
        FOOD_RECORDS_TABLE = module.dynamodb.table_names["food-records"]
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
              module.dynamodb.table_arns["food-records"]
            ]
          }
        ]
      })
      timeout = 10
    }
    get-food-records = {
      zip         = "${path.module}/../dist/zips/getFoodRecords.zip"
      description = "API Gateway Lambda function for getting food log records"
      env         = { 
        FOOD_RECORDS_TABLE = module.dynamodb.table_names["food-records"]
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
              module.dynamodb.table_arns["food-records"]
            ]
          }
        ]
      })
      timeout = 10
    }
    delete-food-record = {
      zip         = "${path.module}/../dist/zips/deleteFoodRecord.zip"
      description = "API Gateway Lambda function for deleting food log records"
      env         = { 
        FOOD_RECORDS_TABLE = module.dynamodb.table_names["food-records"]
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
              "dynamodb:GetItem",
              "dynamodb:DeleteItem"
            ]
            Resource = [
              "arn:aws:logs:*:*:*",
              module.dynamodb.table_arns["food-records"]
            ]
          }
        ]
      })
      timeout = 10
    }
  }
}

######################
# Cognito Module
######################
module "cognito" {
  source                          = "./modules/cognito"
  user_pool_name                  = "${var.application_name}-${var.environment}-users"
  auto_verified_attributes        = var.auto_verified_attributes
  email_sending_account           = var.email_sending_account
  verification_email_option       = var.verification_email_option
  password_minimum_length         = var.password_minimum_length
  password_require_lowercase      = var.password_require_lowercase
  password_require_numbers        = var.password_require_numbers
  password_require_symbols        = var.password_require_symbols
  password_require_uppercase      = var.password_require_uppercase
  explicit_auth_flows             = var.explicit_auth_flows
  generate_client_secret          = var.generate_client_secret
  refresh_token_validity_days     = var.refresh_token_validity_days
  tags                            = var.tags
  allowed_oauth_flows             = var.allowed_oauth_flows
  allowed_oauth_scopes            = var.allowed_oauth_scopes
  callback_urls                   = var.callback_urls
  logout_urls                     = var.logout_urls
  supported_identity_providers    = var.supported_identity_providers
  domain_name                     = var.domain_name
  post_confirmation_arn           = module.lambda["post-confirmation"].function_arn
  post_confirmation_function_name = module.lambda["post-confirmation"].function_name
}

module "lambda" {
  source      = "./modules/lambda"
  for_each    = local.functions
  name        = "${var.application_name}-${var.environment}-${each.key}"
  zip_path    = each.value.zip
  description = each.value.description
  handler     = "index.handler"
  timeout     = try(each.value.timeout, 3)
  env         = each.value.env
  iam_policy  = each.value.iam_policy
  tags        = var.tags
}

module "dynamodb" {
  source = "./modules/dynamodb"

  table_name_prefix = "${var.application_name}-${var.environment}"
  billing_mode      = "PAY_PER_REQUEST"
  tags              = var.tags

  tables = {
    users = {
      hash_key                 = "PK"
      range_key                = "SK"
      global_secondary_indexes = []
      enable_ttl               = false
    }
    food-records = {
      hash_key                 = "user_id"
      range_key                = "date_timestamp"
      global_secondary_indexes = []
      enable_ttl               = false
    }
  }
}

module "api-gw" {
  source                = "./modules/api-gw"
  depends_on            = [module.dynamodb, module.lambda]
  environment           = var.environment
  application_name      = var.application_name
  cognito_user_pool_arn = module.cognito.user_pool_arn
  lambda_functions = {
    "create-food-record" = module.lambda["create-food-record"].invoke_arn
    "get-food-records"   = module.lambda["get-food-records"].invoke_arn
    "delete-food-record" = module.lambda["delete-food-record"].invoke_arn
  }
  lambda_function_names = {
    "create-food-record" = module.lambda["create-food-record"].function_name
    "get-food-records"   = module.lambda["get-food-records"].function_name
    "delete-food-record" = module.lambda["delete-food-record"].function_name
  }
}