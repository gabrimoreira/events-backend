resource "random_password" "db" {
  length  = 24
  special = false
}

resource "random_password" "jwt" {
  length  = 48
  special = false
}

# ---------------------------------------------------------------- RDS

resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-db"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_db_parameter_group" "postgres" {
  name   = "${var.project}-pg16"
  family = "postgres16"

  # The app connects without TLS; traffic stays inside the VPC.
  parameter {
    name  = "rds.force_ssl"
    value = "0"
  }
}

resource "aws_db_instance" "main" {
  identifier             = "${var.project}-db"
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = var.db_instance_class
  allocated_storage      = 20
  db_name                = "eventflow"
  username               = "eventflow"
  password               = random_password.db.result
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.postgres.name
  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible    = false
  multi_az               = false
  skip_final_snapshot    = true
  apply_immediately      = true
}

# ---------------------------------------------------------------- ElastiCache

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project}-redis"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_cluster" "main" {
  cluster_id         = "${var.project}-redis"
  engine             = "redis"
  engine_version     = "7.1"
  node_type          = var.cache_node_type
  num_cache_nodes    = 1
  port               = 6379
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
}

# ---------------------------------------------------------------- S3

data "aws_caller_identity" "current" {}

locals {
  bucket_name = "${var.project}-assets-${data.aws_caller_identity.current.account_id}"
}

# The Learner Lab SCP denies s3:GetBucketObjectLockConfiguration, which the provider calls
# for aws_s3_bucket, so the bucket itself is created through the AWS CLI.
resource "terraform_data" "bucket" {
  input = local.bucket_name

  provisioner "local-exec" {
    command = "aws s3api head-bucket --bucket ${self.input} 2>/dev/null || aws s3api create-bucket --bucket ${self.input} --region ${var.region}"
  }

  provisioner "local-exec" {
    when    = destroy
    command = "aws s3 rb s3://${self.input} --force || true"
  }
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket                  = terraform_data.bucket.output
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "assets" {
  bucket = terraform_data.bucket.output

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "PublicBanners"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "arn:aws:s3:::${terraform_data.bucket.output}/public/*"
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.assets]
}

resource "aws_s3_bucket_cors_configuration" "assets" {
  bucket = terraform_data.bucket.output

  cors_rule {
    allowed_methods = ["GET", "PUT", "POST", "HEAD"]
    allowed_origins = ["*"]
    allowed_headers = ["*"]
  }
}

# ---------------------------------------------------------------- DynamoDB

resource "aws_dynamodb_table" "audit" {
  name         = "${var.project}-audit-log"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }
  attribute {
    name = "sk"
    type = "S"
  }
  attribute {
    name = "actorId"
    type = "S"
  }

  global_secondary_index {
    name            = "actor-index"
    projection_type = "ALL"

    key_schema {
      attribute_name = "actorId"
      key_type       = "HASH"
    }
    key_schema {
      attribute_name = "sk"
      key_type       = "RANGE"
    }
  }
}

# ---------------------------------------------------------------- ECR

locals {
  images = ["gateway", "auth-service", "catalog-service", "sales-service", "processing-worker", "migrate"]
}

resource "aws_ecr_repository" "image" {
  for_each = toset(local.images)

  name         = "${var.project}/${each.key}"
  force_delete = true
}
