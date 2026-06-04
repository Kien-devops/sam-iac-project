#!/usr/bin/env bash
set -euo pipefail

# Tear down the local container stack

echo "========================================="
echo " Stopping Local Container Services"
echo "========================================="

docker-compose down -v

echo "Done! All local containers and networks have been stopped and cleaned."
