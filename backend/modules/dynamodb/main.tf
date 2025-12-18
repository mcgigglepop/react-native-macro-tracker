resource "aws_dynamodb_table" "tables" {
  for_each = var.tables

  name         = "${var.table_name_prefix}-${each.key}"
  billing_mode = var.billing_mode

  hash_key = each.value.hash_key

  # Only set range_key if provided (for hash-key-only tables, omit this)
  range_key = try(each.value.range_key, null)

  # Dynamic attributes - include hash_key, optional range_key, plus any GSI attributes
  dynamic "attribute" {
    for_each = toset(concat(
      [each.value.hash_key],
      each.value.range_key != null ? [each.value.range_key] : [],
      [for gsi in each.value.global_secondary_indexes : gsi.hash_key],
      [for gsi in each.value.global_secondary_indexes : gsi.range_key if gsi.range_key != null]
    ))
    content {
      name = attribute.value
      type = "S"
    }
  }

  # Dynamic global secondary indexes
  dynamic "global_secondary_index" {
    for_each = each.value.global_secondary_indexes
    content {
      name            = global_secondary_index.value.name
      hash_key        = global_secondary_index.value.hash_key
      range_key       = try(global_secondary_index.value.range_key, null)
      projection_type = global_secondary_index.value.projection_type
    }
  }

  point_in_time_recovery {
    enabled = try(each.value.enable_point_in_time_recovery, var.enable_point_in_time_recovery)
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }

  # Dynamic TTL
  dynamic "ttl" {
    for_each = each.value.enable_ttl ? [1] : []
    content {
      attribute_name = "ttl"
      enabled        = true
    }
  }

  tags = merge(var.tags, {
    Name = "${var.table_name_prefix}-${each.key}"
    Type = each.key
  })
}
