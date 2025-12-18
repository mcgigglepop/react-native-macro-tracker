# Table names map
output "table_names" {
  description = "Map of table name suffixes to table names"
  value       = { for k, v in aws_dynamodb_table.tables : k => v.name }
}

# Table ARNs map
output "table_arns" {
  description = "Map of table name suffixes to table ARNs"
  value       = { for k, v in aws_dynamodb_table.tables : k => v.arn }
}

# Table IDs map
output "table_ids" {
  description = "Map of table name suffixes to table IDs"
  value       = { for k, v in aws_dynamodb_table.tables : k => v.id }
}
