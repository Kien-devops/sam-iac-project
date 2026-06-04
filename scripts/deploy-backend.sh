#!/usr/bin/env bash
set -euo pipefail

# Script to build and deploy Backend ECS Fargate service
# Usage: ./scripts/deploy-backend.sh <AWS_REGION> <ECR_REPO_URL> <ECS_CLUSTER> <ECS_SERVICE>

AWS_REGION="${1:-us-east-1}"
ECR_REPO_URL="${2:-}"
ECS_CLUSTER="${3:-prod-cluster}"
ECS_SERVICE="${4:-prod-backend}"

echo "========================================="
echo " Deploying Backend ECS Fargate Service"
echo "========================================="

if [ -z "$ECR_REPO_URL" ]; then
    echo "Error: ECR_REPO_URL parameter is required."
    exit 1
fi

# 1. Run Backend Unit Tests
echo "Step 1: Running unit tests..."
cd apps/backend
npm install
npm test
cd ../..

# 2. Copy source code files to context
echo "Step 2: Preparing Docker context..."
rm -rf deployments/ecs/backend/src deployments/ecs/backend/package*.json
cp -r apps/backend/src deployments/ecs/backend/src
cp apps/backend/package*.json deployments/ecs/backend/

# 3. Build Docker Image
echo "Step 3: Building Express backend Docker image..."
IMAGE_TAG="latest"
docker build -t "${ECR_REPO_URL}:${IMAGE_TAG}" deployments/ecs/backend

# 4. Push to AWS ECR
echo "Step 4: Pushing to ECR registry..."
docker push "${ECR_REPO_URL}:${IMAGE_TAG}"

# 5. Force redeployment on ECS
echo "Step 5: Updating ECS service to download new container version..."
aws ecs update-service \
    --cluster "$ECS_CLUSTER" \
    --service "$ECS_SERVICE" \
    --force-new-deployment \
    --region "$AWS_REGION"

echo "Success: Backend deployment triggered successfully!"
