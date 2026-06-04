output "frontend_repository_url" {
  value       = aws_ecr_repository.frontend.repository_url
  description = "The URL of the frontend repository"
}

output "backend_repository_url" {
  value       = aws_ecr_repository.backend.repository_url
  description = "The URL of the backend repository"
}

output "frontend_repository_name" {
  value       = aws_ecr_repository.frontend.name
  description = "The name of the frontend ECR repository"
}

output "backend_repository_name" {
  value       = aws_ecr_repository.backend.name
  description = "The name of the backend ECR repository"
}
