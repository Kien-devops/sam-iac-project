resource "aws_security_group" "ecs_tasks" {
  name        = "${var.environment}-ecs-backend-tasks-sg"
  description = "Allow inbound access from the ALB only"
  vpc_id      = var.vpc_id

  ingress {
    protocol        = "tcp"
    from_port       = 3000
    to_port         = 3000
    security_groups = [var.alb_security_group_id]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-ecs-backend-tasks-sg"
    Environment = var.environment
  }
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.environment}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = var.execution_role_arn
  task_role_arn            = var.task_role_arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = var.image_url
      essential = true
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
        }
      ]
      environment = [
        {
          name  = "PORT"
          value = "3000"
        },
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "USE_LOCAL_MOCK"
          value = "false"
        },
        {
          name  = "SNS_TOPIC_ARN"
          value = var.sns_topic_arn
        },
        {
          name  = "PRODUCTS_TABLE"
          value = var.products_table
        },
        {
          name  = "ORDERS_TABLE"
          value = var.orders_table
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
        {
          name  = "JWT_SECRET"
          value = var.jwt_secret
        },
        {
          name  = "EMAIL_NOTIFICATION_TOPIC_ARN"
          value = var.email_notification_topic_arn
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = var.log_group_name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }
    }
  ])

  tags = {
    Environment = var.environment
  }
}

resource "aws_ecs_service" "backend" {
  name            = "${var.environment}-backend"
  cluster         = var.cluster_id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks.id]
    subnets          = var.private_subnets
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = "backend"
    container_port   = 3000
  }

  # Prevent Terraform from reverting deployment tags pushed by GitHub Actions
  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }

  tags = {
    Environment = var.environment
  }
}
