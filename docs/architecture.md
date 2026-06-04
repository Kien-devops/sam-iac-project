# Architecture Design & Component Layout

This document provides a technical walkthrough of the **Hybrid DevOps E-Commerce AWS** system architecture.

## Architecture Diagram
![Project Architecture Diagram](project_architecture_diagram.png)

You can review the raw Mermaid diagram script under [architecture.mermaid](mermaid/architecture.mermaid).

## 1. Network Layer (VPC Topology)
Created using the Terraform `network` module:
* **Custom VPC**: Assigned CIDR `10.0.0.0/16`.
* **Public Subnets**: Two subnets in separate availability zones (e.g. `us-east-1a`, `us-east-1b`) hosting the public Application Load Balancer and the NAT Gateway.
* **Private Subnets**: Two subnets hosting the ECS Fargate container instances. Internet access is provided via the NAT Gateway for tasks pulling packages or calling AWS endpoints.
* **Routing**:
  * Public subnets map routes directly to the Internet Gateway (`0.0.0.0/0`).
  * Private subnets route through the NAT Gateway (`0.0.0.0/0`).

## 2. Load Balancing & Path-Based Routing
The Application Load Balancer (ALB) routes traffic based on HTTP paths:
* **HTTP Port 80 Listener**: Receives entry connections.
* **Routing Rules**:
  * Paths starting with `/api/*` route to the Backend Express ECS Target Group (TCP port 3000).
  * Default fallback paths route to the Frontend Nginx ECS Target Group (TCP port 80).
* **Health Checks**:
  * Frontend Target Group queries `/health` on port 80.
  * Backend Target Group queries `/api/health` on port 3000.

## 3. ECS Fargate Service Layer
Container applications are managed by ECS:
* **ECS Cluster**: `prod-cluster` orchestrates the services.
* **Frontend Service**:
  * Nginx container serving React assets statically compiled during CI/CD.
  * Security group limits incoming traffic to the ALB security group on port 80.
* **Backend Service**:
  * Node.js Express application container.
  * Environment variables configure tables mappings and SNS topic ARNs.
  * Security group limits incoming traffic to the ALB security group on port 3000.

## 4. Serverless Layer (AWS SAM Stack)
Event-driven processing handles background asynchronous orders events:
* **SNS Topic (`OrderCreatedTopic`)**: The Express Backend publishes an order payload here when a POST request hits `/api/orders`.
* **SQS Queue (`OrderCreatedQueue`)**: Subscribed to the SNS Topic. It acts as an integration queue buffer and triggers Lambda instances.
* **Lambda (`send-email`)**: Pulls events from SQS, parses the customer order, and logs simulated SMTP communications to CloudWatch logs.
* **Lambda (`generate-invoice`)**: Pulls events from SQS, compiles plain text invoices, and uploads them to the S3 bucket (`InvoicePDFBucket`).
* **Lambda (`daily-report`)**: Triggered daily by an EventBridge Cron rule. It scans the Orders table, filters current day items, and writes totals to the DailyReports DynamoDB table.

## 5. Security & Isolation Controls
* **Least-Privilege Roles**: The ECS Task Role allows only DynamoDB scans/gets/puts and publishing to the OrderCreatedTopic.
* **Security Group Choke Points**: Containers do not accept direct connection strings from the public internet. Access is only allowed via the Load Balancer security group IDs.
* **ECR Scanner**: ECR registries scan built container images on push to detect vulnerabilities (complemented by Trivy checks in CI/CD).
