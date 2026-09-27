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
