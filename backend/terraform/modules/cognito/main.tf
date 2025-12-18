resource "aws_cognito_user_pool" "main" {
  name = var.user_pool_name

  auto_verified_attributes = var.auto_verified_attributes

  email_configuration {
    email_sending_account = var.email_sending_account
  }

  verification_message_template {
    default_email_option = var.verification_email_option
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  password_policy {
    minimum_length    = var.password_minimum_length
    require_lowercase = var.password_require_lowercase
    require_numbers   = var.password_require_numbers
    require_symbols   = var.password_require_symbols
    require_uppercase  = var.password_require_uppercase
  }

  lambda_config {
    post_confirmation = var.post_confirmation_arn
  }

  tags = var.tags
}

resource "aws_cognito_user_pool_client" "client" {
  name         = "${var.user_pool_name}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  explicit_auth_flows = var.explicit_auth_flows

  generate_secret = var.generate_client_secret

  refresh_token_validity = var.refresh_token_validity_days

}

resource "aws_lambda_permission" "allow_cognito_to_invoke" {
  statement_id  = "AllowExecutionFromCognito"
  action        = "lambda:InvokeFunction"
  function_name = var.post_confirmation_function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}
