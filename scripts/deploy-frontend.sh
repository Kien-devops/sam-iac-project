#!/usr/bin/env bash
set -euo pipefail

# Script to build and deploy Frontend ECS Fargate service
# Usage: ./scripts/deploy-frontend.sh <AWS_REGION> <ECR_REPO_URL> <ECS_CLUSTER> <ECS_SERVICE>

AWS_REGION="${1:-us-east-1}"
ECR_REPO_URL="${2:-}"
ECS_CLUSTER="${3:-prod-cluster}"
ECS_SERVICE="${4:-prod-frontend}"

echo "========================================="
echo " Deploying Frontend ECS Fargate Service"
echo "========================================="

if [ -z "$ECR_REPO_URL" ]; then
    echo "Error: ECR_REPO_URL parameter is required."
    exit 1
fi

# 1. Build Vite-React Frontend app
echo "Step 1: Building React bundle..."
cd apps/frontend
npm install
npm run build
cd ../..

# 2. Copy build and config files to context
echo "Step 2: Preparing Docker context..."
rm -rf deployments/ecs/frontend/dist
cp -r apps/frontend/dist deployments/ecs/frontend/dist

# 3. Build Docker Image
echo "Step 3: Building Nginx Docker image..."
IMAGE_TAG="latest"
docker build -t "${ECR_REPO_URL}:${IMAGE_TAG}" deployments/ecs/frontend

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

echo "Success: Frontend deployment triggered successfully!"
