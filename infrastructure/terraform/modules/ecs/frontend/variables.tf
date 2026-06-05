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
  default     = "nginx:alpine" # default bootstrap image
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
  default     = "ap-southeast-1"
}
