output "table_names" {
  description = "Map of table names"
  value = {
    for key, table in aws_dynamodb_table.tables : key => table.name
  }
}

output "table_arns" {
  description = "Map of table ARNs"
  value = {
    for key, table in aws_dynamodb_table.tables : key => table.arn
  }
}
