#!/usr/bin/env bash
set -euo pipefail

# Login helper to authenticate Docker with Amazon ECR
# Usage: ./scripts/ecr-login.sh <AWS_ACCOUNT_ID> [AWS_REGION]

ACCOUNT_ID="${1:-}"
REGION="${2:-us-east-1}"

if [ -z "$ACCOUNT_ID" ]; then
    echo "Error: AWS_ACCOUNT_ID parameter is required."
    echo "Usage: ./scripts/ecr-login.sh <AWS_ACCOUNT_ID> [AWS_REGION]"
    exit 1
fi

echo "========================================="
echo " Authenticating with AWS ECR Registry"
echo "========================================="

aws ecr get-login-password --region "$REGION" | \
    docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

echo "Done! Authentication succeeded."
