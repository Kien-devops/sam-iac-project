# Infrastructure as Code with Terraform

This directory manages the AWS ECS Fargate, ALB, VPC, IAM, and ECR dependencies.

## Modules Structure
* **`network`**: VPC, routing, NAT, and subnetting across multiple zones.
* **`ecr`**: Image container repositories for frontend and backend.
* **`alb`**: Public application load balancer distributing path-based traffic:
  * `/api/*` -> backend services Target Group.
  * `/*` -> frontend SPA Target Group.
* **`iam`**: Security profiles for task execution and DynamoDB/SNS permissions.
* **`monitoring`**: Dedicated task CloudWatch log streams.
* **`ecs/frontend` & `ecs/backend`**: ECS Fargate service and task configurations.

## Setup & Deployment Commands
1. Navigate to the targeted environment scope:
   ```bash
   cd environments/prod
   ```
2. Setup local credentials config and duplicate properties:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```
3. Initialize providers:
   ```bash
   terraform init
   ```
4. Perform dry-run plan audit:
   ```bash
   terraform plan
   ```
5. Deploy configuration:
   ```bash
   terraform apply
   ```

*Note: Since deployment tags are updated directly via the GitHub Actions runner (`aws ecs update-service`), the ECS service resource has a lifecycle pattern blocking overrides of the active image version during manual `terraform apply` executions.*
