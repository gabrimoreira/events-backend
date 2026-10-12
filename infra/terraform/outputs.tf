output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "instance_profile_name" {
  value = data.aws_iam_instance_profile.lab.name
}

output "app_url" {
  description = "Public URL of the application (ALB)."
  value       = "http://${aws_lb.main.dns_name}"
}

output "ecr_registry" {
  value = local.registry
}

output "bucket" {
  value = terraform_data.bucket.output
}

output "rds_endpoint" {
  value = aws_db_instance.main.address
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.main.cache_nodes[0].address
}
