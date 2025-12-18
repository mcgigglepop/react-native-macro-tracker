data "aws_caller_identity" "current" {}

resource "aws_cognito_user_pool" "this" {
  name                     = var.user_pool_name
  auto_verified_attributes = ["email"]

  schema {
    name                = "given_name"
    attribute_data_type = "String"
    string_attribute_constraints {
      min_length = 1
      max_length = 50
    }
    required = false
    mutable  = true
  }

  schema {
    name                = "family_name"
    attribute_data_type = "String"
    string_attribute_constraints {
      min_length = 1
      max_length = 50
    }
    required = false
    mutable  = true
  }

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  lambda_config {
    post_confirmation = var.post_confirmation_arn
  }
}

resource "aws_cognito_user_pool_client" "this" {
  name                                 = "${var.user_pool_name}-client"
  user_pool_id                         = aws_cognito_user_pool.this.id
  allowed_oauth_flows_user_pool_client = true
  generate_secret                      = false

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]

  allowed_oauth_flows          = ["code"]
  allowed_oauth_scopes         = ["openid", "email", "profile"]
  callback_urls                = ["https://oauth.pstmn.io/v1/callback"]
  logout_urls                  = ["https://example.com"]
  supported_identity_providers = ["COGNITO"]
}

resource "aws_cognito_user_pool_domain" "this" {
  domain       = var.application_name
  user_pool_id = aws_cognito_user_pool.this.id
}

resource "aws_lambda_permission" "allow_cognito_to_invoke" {
  statement_id  = "AllowExecutionFromCognito"
  action        = "lambda:InvokeFunction"
  function_name = var.post_confirmation_function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.this.arn
}