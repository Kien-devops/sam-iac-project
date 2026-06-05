variable "aws_region" {
  type        = string
  description = "AWS deployment region"
  default     = "ap-southeast-1"
}

variable "environment" {
  type        = string
  description = "Environment target name"
  default     = "prod"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for VPC"
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "Public subnet lists"
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "Private subnet lists"
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "availability_zones" {
  type        = list(string)
  description = "Availability zones list"
  default     = ["ap-southeast-1a", "ap-southeast-1b"]
}

variable "frontend_cpu" {
  type        = string
  description = "CPU units for frontend container"
  default     = "256"
}

variable "frontend_memory" {
  type        = string
  description = "Memory (MB) for frontend container"
  default     = "512"
}

variable "frontend_desired_count" {
  type        = number
  description = "Scale number of frontend tasks"
  default     = 2
}

variable "backend_cpu" {
  type        = string
  description = "CPU units for backend container"
  default     = "256"
}

variable "backend_memory" {
  type        = string
  description = "Memory (MB) for backend container"
  default     = "512"
}

variable "backend_desired_count" {
  type        = number
  description = "Scale number of backend tasks"
  default     = 2
}

# Values for integrating serverless assets
variable "sns_topic_arn" {
  type        = string
  description = "SNS topic ARN managed by AWS SAM"
  default     = ""
}

variable "products_table" {
  type        = string
  description = "DynamoDB products table name managed by AWS SAM"
  default     = ""
}

variable "orders_table" {
  type        = string
  description = "DynamoDB orders table name managed by AWS SAM"
  default     = ""
}

variable "jwt_secret" {
  type        = string
  description = "JWT secret key for backend authentication"
  default     = "supersecretjwtkeyforlocaldev123!"
}
