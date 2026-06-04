output "alb_dns_name" {
  value       = module.alb.dns_name
  description = "The public load balancer DNS endpoint to access the E-Commerce platform"
}

output "ecs_cluster_name" {
  value       = aws_ecs_cluster.main.name
  description = "Name of the ECS Cluster"
}

output "frontend_ecr_repository_url" {
  value       = module.ecr.frontend_repository_url
  description = "ECR Repository URL for frontend build tags"
}

output "backend_ecr_repository_url" {
  value       = module.ecr.backend_repository_url
  description = "ECR Repository URL for backend build tags"
}

output "frontend_service_name" {
  value = module.ecs_frontend.service_name
}

output "backend_service_name" {
  value = module.ecs_backend.service_name
}
