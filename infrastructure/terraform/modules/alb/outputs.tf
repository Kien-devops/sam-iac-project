output "dns_name" {
  value       = aws_lb.main.dns_name
  description = "The DNS name of the Load Balancer"
}

output "frontend_target_group_arn" {
  value       = aws_lb_target_group.frontend.arn
  description = "The ARN of the frontend Target Group"
}

output "backend_target_group_arn" {
  value       = aws_lb_target_group.backend.arn
  description = "The ARN of the backend Target Group"
}

output "alb_security_group_id" {
  value       = aws_security_group.alb.id
  description = "The ID of the ALB security group"
}
