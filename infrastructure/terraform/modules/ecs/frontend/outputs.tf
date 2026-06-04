output "service_name" {
  value       = aws_ecs_service.frontend.name
  description = "The name of the ECS Frontend service"
}

output "task_definition_family" {
  value       = aws_ecs_task_definition.frontend.family
  description = "The family name of the task definition"
}
