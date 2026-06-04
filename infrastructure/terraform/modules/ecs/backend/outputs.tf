output "service_name" {
  value       = aws_ecs_service.backend.name
  description = "The name of the ECS Backend service"
}

output "task_definition_family" {
  value       = aws_ecs_task_definition.backend.family
  description = "The family name of the task definition"
}
