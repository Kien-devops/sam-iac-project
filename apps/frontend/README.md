# ECS Frontend Application

This directory contains the containerized React/Vite web application serving as the e-commerce client.

## Design Highlights
* **Pure React**: Built using Vite and simple hook-based state management.
* **Modern Style**: Fully-responsive dark mode UI styled via premium custom HSL palettes, smooth micro-animations, and styled layouts.
* **Architecture Visualization**: Built-in architecture rendering of the ECS + SAM ecosystem.
* **Offline-Resilient**: Automatically switches to client-side mocks if the ECS Backend API is unreachable.

## Architecture
In production, the client static bundles are served by an **Nginx** server inside an ECS Fargate container. The Application Load Balancer routes:
* `/api/*` requests to the **ECS Backend Service**.
* `/health` requests are resolved by Nginx to return a `200 OK`.
* Other requests fall back to the index router to serve Vite React static outputs.

## Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run development server:
   ```bash
   npm run dev
   ```
3. Run container locally:
   ```bash
   docker build -t hybrid-devops-frontend .
   docker run -p 8080:80 hybrid-devops-frontend
   ```
