resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/hybrid-devops-frontend-${var.environment}"
  retention_in_days = 7

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/hybrid-devops-backend-${var.environment}"
  retention_in_days = 7

  tags = {
    Environment = var.environment
  }
}
