# ECS Backend Service

This folder contains the Node.js Express application running containerized inside ECS Fargate.

## Architecture Features
* **REST API**: Serves JSON resources for users, catalog products, and checking out orders.
* **Event-Driven Emitter**: Placed orders emit `OrderCreated` messages to an AWS SNS Topic.
* **AWS SDK v3 integration**: Dynamically reads/writes to DynamoDB and registers triggers using IAM Fargate Task Roles.
* **Mock Failback Mode**: Enable `USE_LOCAL_MOCK=true` to test locally or verify endpoints without provisioning live AWS components.

## Endpoints
* `GET /api/health` - Cluster task state indicator.
* `POST /api/auth/login` - Authenticate users (default credentials: `admin/admin`).
* `GET /api/products` - Scan active store product items.
* `POST /api/products` - Admin creation of catalog products.
* `GET /api/orders` - Fetch all processed customer transactions.
* `GET /api/orders/:id` - Fetch details for a specific order.
* `POST /api/orders` - Execute a checkout event (publishes notification to SNS).

## Local Development & Verification
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set environment variables:
   Create a local `.env` matching `.env.example`.
3. Run tests locally using Jest and Supertest:
   ```bash
   npm test
   ```
4. Start service:
   ```bash
   npm start
   ```
