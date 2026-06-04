#!/usr/bin/env bash
set -euo pipefail

# Start the full environment locally via Docker Compose

echo "========================================="
echo " Starting Hybrid E-Commerce Local System"
echo "========================================="

# 1. Check if .env exists, if not copy from example
if [ ! -f .env ]; then
    echo "Creating .env configuration file from .env.example..."
    cp .env.example .env
fi

# 2. Build and run containers
echo "Building and launching containers..."
docker-compose up -d --build

echo ""
echo "========================================="
echo " Local Stack is Up and Running!"
echo "-----------------------------------------"
echo " - Frontend Web Interface: http://localhost:8080"
echo " - Backend API Endpoints:  http://localhost:3000"
echo " - Database Sandbox:       Local Mocked Mode"
echo "========================================="
echo "To view logs, run: docker-compose logs -f"
