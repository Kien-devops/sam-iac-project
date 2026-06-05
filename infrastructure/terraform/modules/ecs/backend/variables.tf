variable "environment" {
  type        = string
  description = "Environment name"
}

variable "vpc_id" {
  type        = string
  description = "VPC ID"
}

variable "private_subnets" {
  type        = list(string)
  description = "Private Subnet IDs"
}

variable "alb_security_group_id" {
  type        = string
  description = "ALB security group ID"
}

variable "cluster_id" {
  type        = string
  description = "ECS cluster ID"
}

variable "target_group_arn" {
  type        = string
  description = "Target Group ARN"
}

variable "image_url" {
  type        = string
  description = "Docker image URL for bootstrap"
  default     = "node:18-alpine" # Default bootstrap
}

variable "cpu" {
  type        = string
  description = "ECS Task CPU allocation"
  default     = "256"
}

variable "memory" {
  type        = string
  description = "ECS Task Memory allocation"
  default     = "512"
}

variable "desired_count" {
  type        = number
  description = "Desired number of tasks"
  default     = 2
}

variable "execution_role_arn" {
  type        = string
  description = "Execution role ARN"
}

variable "task_role_arn" {
  type        = string
  description = "Task role ARN"
}

variable "log_group_name" {
  type        = string
  description = "Cloudwatch Log Group name"
}

variable "aws_region" {
  type        = string
  description = "AWS region for logs"
  default     = "us-east-1"
}

# Backend specific integrations
variable "sns_topic_arn" {
  type        = string
  description = "SNS topic ARN to publish order events to"
  default     = ""
}

variable "products_table" {
  type        = string
  description = "DynamoDB Products table name"
  default     = ""
}

variable "orders_table" {
  type        = string
  description = "DynamoDB Orders table name"
  default     = ""
}

variable "jwt_secret" {
  type        = string
  description = "JWT secret key for backend authentication"
}
