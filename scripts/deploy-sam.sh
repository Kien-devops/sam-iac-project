#!/usr/bin/env bash
set -euo pipefail

# Script to build and deploy Serverless SAM stack
# Usage: ./scripts/deploy-sam.sh <ENV>

ENV="${1:-prod}"

echo "========================================="
echo " Deploying Serverless SAM Stack (Env: $ENV)"
echo "========================================="

cd serverless/sam

echo "Step 1: Building SAM artifacts..."
sam build

echo "Step 2: Deploying SAM CloudFormation stack..."
sam deploy --config-env "$ENV" --no-confirm-changeset --no-fail-on-empty-changeset

echo "Success: Serverless SAM Stack deployed!"
