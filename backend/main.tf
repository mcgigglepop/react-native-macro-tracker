# locals {
#   functions = {
#     search_foods = {
#       zip = "${path.module}/../../../dist/zips/searchFoods.zip"
#       env = { TABLE_NAME = module.food_tracking_table.table_name }
#     }
#     create_custom_food = {
#       zip = "${path.module}/../../../dist/zips/createCustomFood.zip"
#       env = { TABLE_NAME = module.food_tracking_table.table_name }
#     }
#     log_food = {
#       zip = "${path.module}/../../../dist/zips/logFood.zip"
#       env = { TABLE_NAME = module.food_tracking_table.table_name }
#     }
#     get_logs_by_day = {
#       zip = "${path.module}/../../../dist/zips/getLogsByDay.zip"
#       env = { TABLE_NAME = module.food_tracking_table.table_name }
#     }
#     get_by_barcode = {
#       zip = "${path.module}/../../../dist/zips/getByBarcode.zip"
#       env = { TABLE_NAME = module.food_tracking_table.table_name }
#     }
#     post_confirmation = {
#       zip = "${path.module}/../../../dist/zips/postConfirmation.zip"
#       env = { USER_TABLE = module.user_data_table.table_name }
#     }
#     create_measurement = {
#       zip = "${path.module}/../../../dist/zips/createMeasurement.zip"
#       env = { USER_TABLE = module.user_data_table.table_name }
#     }
#     get_latest_measurement = {
#       zip = "${path.module}/../../../dist/zips/getLatestMeasurement.zip"
#       env = { USER_TABLE = module.user_data_table.table_name }
#     }
#     get_measurements = {
#       zip = "${path.module}/../../../dist/zips/getMeasurements.zip"
#       env = { USER_TABLE = module.user_data_table.table_name }
#     }
#     get_profile = {
#       zip = "${path.module}/../../../dist/zips/getProfile.zip"
#       env = { USER_TABLE = module.user_data_table.table_name }
#     }
#     update_profile = {
#       zip = "${path.module}/../../../dist/zips/updateProfile.zip"
#       env = { USER_TABLE = module.user_data_table.table_name }
#     }
#   }

#   fn_arn    = { for k, m in module.lambda : k => m.function_arn }
#   fn_name   = { for k, m in module.lambda : k => m.function_name }
#   fn_invoke = { for k, m in module.lambda : k => m.invoke_arn }
# }

# resource "aws_iam_role" "lambda_exec_role" {
#   name = "${var.application_name}_lambda_exec_role_${var.environment}"

#   assume_role_policy = jsonencode({
#     Version = "2012-10-17",
#     Statement = [{
#       Effect    = "Allow",
#       Principal = { Service = "lambda.amazonaws.com" },
#       Action    = "sts:AssumeRole"
#     }]
#   })
# }

# resource "aws_iam_policy" "lambda_log_access" {
#   name = "${var.application_name}_lambda_log_access_${var.environment}"

#   policy = jsonencode({
#     Version = "2012-10-17",
#     Statement = [
#       {
#         Effect = "Allow",
#         Action = [
#           "logs:CreateLogGroup",
#           "logs:CreateLogStream",
#           "logs:PutLogEvents"
#         ],
#         Resource = "arn:aws:logs:*:*:*"
#       }
#     ]
#   })
# }

# resource "aws_iam_role_policy_attachment" "log_access_attachment" {
#   role       = aws_iam_role.lambda_exec_role.name
#   policy_arn = aws_iam_policy.lambda_log_access.arn
# }

# resource "aws_iam_policy" "dynamodb_access" {
#   name = "${var.application_name}_lambda_dynamo_access_${var.environment}"

#   policy = jsonencode({
#     Version = "2012-10-17",
#     Statement = [
#       {
#         Effect   = "Allow",
#         Action   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Query", "dynamodb:UpdateItem"],
#         Resource = module.food_tracking_table.table_arn
#       },
#       {
#         Effect   = "Allow",
#         Action   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Query", "dynamodb:UpdateItem"],
#         Resource = module.user_data_table.table_arn
#       },
#       {
#         Effect   = "Allow",
#         Action   = ["dynamodb:Query"],
#         Resource = module.food_tracking_table.gsi_arns["GSI1"]
#       },
#       {
#         Effect   = "Allow",
#         Action   = ["dynamodb:Query"],
#         Resource = module.user_data_table.gsi_arns["GSI1"]
#       },
#       {
#         Effect   = "Allow",
#         Action   = ["dynamodb:Query"],
#         Resource = module.food_tracking_table.gsi_arns["GSI2"]
#       },
#       {
#         Effect   = "Allow",
#         Action   = ["dynamodb:Query"],
#         Resource = module.food_tracking_table.gsi_arns["GSI3"]
#       },
#       {
#         Effect   = "Allow",
#         Action   = ["dynamodb:PutItem"],
#         Resource = module.user_data_table.table_arn
#       },
#     ]
#   })
# }

# resource "aws_iam_role_policy_attachment" "dynamodb_attachment" {
#   role       = aws_iam_role.lambda_exec_role.name
#   policy_arn = aws_iam_policy.dynamodb_access.arn
# }


# module "lambda" {
#   source   = "../../modules/lambda"
#   for_each = local.functions
#   name     = "${var.application_name}-${each.key}-${var.environment}"
#   role_arn = aws_iam_role.lambda_exec_role.arn
#   zip_path = each.value.zip
#   handler  = "index.handler"
#   env      = each.value.env
#   tags = {
#     service = "${var.application_name}",
#     env     = "${var.environment}",
#     func    = each.key
#   }
# }

module "cognito" {
  source                          = "../../modules/cognito"
  user_pool_name                  = "${var.application_name}-user-pool-${var.environment}"
  application_name                = var.application_name
  environment                     = var.environment
  post_confirmation_function_name = local.fn_name["post_confirmation"]
  post_confirmation_arn           = local.fn_arn["post_confirmation"]
}

# module "food_tracking_table" {
#   source           = "../../modules/dynamodb/food-tracking"
#   table_name       = "${var.application_name}-food-tracking-${var.environment}"
#   environment      = var.environment
#   application_name = var.application_name

#   tags = {
#     Project = var.application_name
#   }
# }

# module "user_data_table" {
#   source           = "../../modules/dynamodb/user-data"
#   table_name       = "${var.application_name}-user-data-${var.environment}"
#   environment      = var.environment
#   application_name = var.application_name

#   tags = {
#     Project = var.application_name
#   }
# }

# module "api-gw" {
#   source                = "../../modules/api-gw"
#   depends_on            = [module.food_tracking_table]
#   environment           = var.environment
#   application_name      = var.application_name
#   cognito_user_pool_arn = module.cognito.cognito_user_pool_arn

#   search_foods_function_name = local.fn_name["search_foods"]
#   search_foods_invoke_arn    = local.fn_invoke["search_foods"]

#   create_custom_foods_function_name = local.fn_name["create_custom_food"]
#   create_custom_foods_invoke_arn    = local.fn_invoke["create_custom_food"]

#   log_food_function_name = local.fn_name["log_food"]
#   log_food_invoke_arn    = local.fn_invoke["log_food"]

#   get_logs_by_day_function_name = local.fn_name["get_logs_by_day"]
#   get_logs_by_day_invoke_arn    = local.fn_invoke["get_logs_by_day"]

#   get_by_barcode_function_name = local.fn_name["get_by_barcode"]
#   get_by_barcode_invoke_arn    = local.fn_invoke["get_by_barcode"]

#   get_profile_name       = local.fn_name["get_profile"]
#   get_profile_invoke_arn = local.fn_invoke["get_profile"]

#   update_profile_name       = local.fn_name["update_profile"]
#   update_profile_invoke_arn = local.fn_invoke["update_profile"]

#   create_measurement_name       = local.fn_name["create_measurement"]
#   create_measurement_invoke_arn = local.fn_invoke["create_measurement"]

#   get_measurements_name       = local.fn_name["get_measurements"]
#   get_measurements_invoke_arn = local.fn_invoke["get_measurements"]

#   get_latest_name       = local.fn_name["get_latest_measurement"]
#   get_latest_invoke_arn = local.fn_invoke["get_latest_measurement"]
# }