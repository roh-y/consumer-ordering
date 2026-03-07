output "developer_access_keys" {
  description = "Access keys for each developer IAM user"
  value = {
    for name in var.developers : name => {
      access_key_id     = aws_iam_access_key.developers[name].id
      secret_access_key = aws_iam_access_key.developers[name].secret
    }
  }
  sensitive = true
}

output "group_name" {
  description = "IAM group name for developers"
  value       = aws_iam_group.developers.name
}

output "github_actions_role_arn" {
  description = "ARN of the IAM role for GitHub Actions OIDC"
  value       = aws_iam_role.github_actions.arn
}
