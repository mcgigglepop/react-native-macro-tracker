##################################
# IAM EXECUTION ROLE
##################################
resource "aws_iam_role" "lambda_execution" {
  name = "${var.name}-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# Attach IAM policy from variable
resource "aws_iam_role_policy" "lambda_execution" {
  name   = "${var.name}-execution-policy"
  role   = aws_iam_role.lambda_execution.id
  policy = var.iam_policy
}

##################################
# LAMBDA FUNCTION
##################################
resource "aws_lambda_function" "this" {
  function_name    = var.name
  description      = var.description
  filename         = var.zip_path
  handler          = var.handler
  runtime          = "nodejs20.x"
  timeout          = var.timeout
  role             = aws_iam_role.lambda_execution.arn
  source_code_hash = filebase64sha256(var.zip_path)

  environment {
    variables = var.env
  }

  tags = var.tags
}