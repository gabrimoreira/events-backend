variable "project" {
  description = "Prefix for resource names and tags."
  type        = string
  default     = "eventflow"
}

variable "region" {
  description = "Learner Lab region."
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "admin_cidr" {
  description = "CIDR allowed to SSH into the instances (your IP/32). Null disables SSH."
  type        = string
  default     = null
}

variable "instance_type" {
  description = "EC2 type for the web fleet and the worker (spec: micro or small)."
  type        = string
  default     = "t3.small"
}

variable "key_name" {
  description = "Existing EC2 key pair for SSH (optional)."
  type        = string
  default     = null
}

variable "db_instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "cache_node_type" {
  type    = string
  default = "cache.t3.micro"
}
