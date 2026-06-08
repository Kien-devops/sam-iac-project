terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  # Backend config is passed via -backend-config flags during terraform init in CI.
  # Required GitHub Secrets: TF_BACKEND_BUCKET, TF_BACKEND_DYNAMODB_TABLE
  # This makes the project portable to any AWS account without code changes.
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}

resource "aws_ecs_cluster" "main" {
  name = "${var.environment}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Environment = var.environment
  }
}

module "network" {
  source               = "../../modules/network"
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones   = var.availability_zones
}

module "ecr" {
  source      = "../../modules/ecr"
  environment = var.environment
}

module "alb" {
  source         = "../../modules/alb"
  environment    = var.environment
  vpc_id         = module.network.vpc_id
  public_subnets = module.network.public_subnets
}

module "iam" {
  source      = "../../modules/iam"
  environment = var.environment
}

module "monitoring" {
  source      = "../../modules/monitoring"
  environment = var.environment
}

module "ecs_frontend" {
  source                = "../../modules/ecs/frontend"
  environment           = var.environment
  vpc_id                = module.network.vpc_id
  private_subnets       = module.network.private_subnets
  alb_security_group_id = module.alb.alb_security_group_id
  cluster_id            = aws_ecs_cluster.main.id
  target_group_arn      = module.alb.frontend_target_group_arn
  execution_role_arn    = module.iam.execution_role_arn
  task_role_arn         = module.iam.task_role_arn
  log_group_name        = module.monitoring.frontend_log_group
  aws_region            = var.aws_region
  image_url             = "${module.ecr.frontend_repository_url}:latest"
  cpu                   = var.frontend_cpu
  memory                = var.frontend_memory
  desired_count         = var.frontend_desired_count
}

data "aws_cloudformation_stack" "sam" {
  name = "hybrid-devops-serverless-${var.environment}"
}

module "ecs_backend" {
  source                = "../../modules/ecs/backend"
  environment           = var.environment
  vpc_id                = module.network.vpc_id
  private_subnets       = module.network.private_subnets
  alb_security_group_id = module.alb.alb_security_group_id
  cluster_id            = aws_ecs_cluster.main.id
  target_group_arn      = module.alb.backend_target_group_arn
  execution_role_arn    = module.iam.execution_role_arn
  task_role_arn         = module.iam.task_role_arn
  log_group_name        = module.monitoring.backend_log_group
  aws_region            = var.aws_region
  image_url             = "${module.ecr.backend_repository_url}:latest"
  cpu                   = var.backend_cpu
  memory                = var.backend_memory
  desired_count         = var.backend_desired_count

  sns_topic_arn                = data.aws_cloudformation_stack.sam.outputs["OrderCreatedTopicArn"]
  products_table               = data.aws_cloudformation_stack.sam.outputs["ProductsTableName"]
  orders_table                 = data.aws_cloudformation_stack.sam.outputs["OrdersTableName"]
  jwt_secret                   = var.jwt_secret
  email_notification_topic_arn = data.aws_cloudformation_stack.sam.outputs["EmailNotificationTopicArn"]
  users_table                  = data.aws_cloudformation_stack.sam.outputs["UsersTableName"]
  invoice_bucket               = data.aws_cloudformation_stack.sam.outputs["InvoiceBucketName"]
}
