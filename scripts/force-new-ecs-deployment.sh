#!/usr/bin/env bash
set -euo pipefail

# Force new ECS deployment for frontend or backend service
# Usage: ./scripts/force-new-ecs-deployment.sh <CLUSTER_NAME> <SERVICE_NAME> [REGION]

CLUSTER="${1:-prod-cluster}"
SERVICE="${2:-}"
REGION="${3:-us-east-1}"

if [ -z "$SERVICE" ]; then
    echo "Error: SERVICE_NAME is a required parameter."
    echo "Usage: ./scripts/force-new-ecs-deployment.sh <CLUSTER_NAME> <SERVICE_NAME> [REGION]"
    exit 1
fi

echo "========================================="
echo " Forcing Deployment Update on ECS"
echo " Cluster: $CLUSTER | Service: $SERVICE"
echo "========================================="

aws ecs update-service \
    --cluster "$CLUSTER" \
    --service "$SERVICE" \
    --force-new-deployment \
    --region "$REGION"

echo "Done! The service task deployment was successfully initiated."
