#!/usr/bin/env bash
set -euo pipefail

# Clean the workspace of build files, temporary caches, and node_modules

echo "========================================="
echo " Cleaning Project Workspace"
echo "========================================="

# 1. Clean frontend artifacts
echo "Cleaning Frontend build cache and modules..."
rm -rf apps/frontend/dist apps/frontend/node_modules

# 2. Clean backend artifacts
echo "Cleaning Backend modules and reports..."
rm -rf apps/backend/node_modules apps/backend/coverage

# 3. Clean deployments cache
echo "Cleaning Deployments staging directories..."
rm -rf deployments/ecs/frontend/dist deployments/ecs/frontend/node_modules
rm -rf deployments/ecs/backend/src deployments/ecs/backend/package*.json

# 4. Clean SAM builds
echo "Cleaning AWS SAM build directories..."
rm -rf serverless/sam/.aws-sam

# 5. Clean Terraform cache
echo "Cleaning Terraform state files..."
find . -type d -name ".terraform" -exec rm -rf {} +
find . -type f -name "terraform.tfstate*" -delete
find . -type f -name ".terraform.lock.hcl" -delete

echo "Done! The project workspace is fully clean."
