# Serverless Workloads with AWS SAM

This directory contains the AWS SAM (Serverless Application Model) configuration and Lambda source code to manage event-driven workloads.

## Architecture Topology
1. **SNS Topic** (`OrderCreatedTopic`): The integration gate from the ECS Backend. Placed orders publish notifications to this topic.
2. **SQS Queue** (`OrderCreatedQueue`): Subscribed to the SNS Topic to absorb traffic spikes and ensure message delivery retries.
3. **S3 Bucket** (`InvoicePDFBucket`): Stores generated plain text/PDF invoices.
4. **DynamoDB Tables**:
   * `ProductsTable` (referenced/managed by the ECS App).
   * `OrdersTable` (referenced/managed by the ECS App).
   * `DailyReportsTable` (storing aggregated sales summaries).

## Lambdas Functions
* **`send-email`**: Triggered by SQS. Parses the order event and logs simulated email outputs to CloudWatch.
* **`generate-invoice`**: Triggered by SQS. Compiles invoice details and writes files to the target S3 bucket.
* **`daily-report`**: Triggered by an **EventBridge Scheduled Cron Rule** running daily. Scans order transactions, groups current day amounts, and writes reports to DynamoDB.

## Development & Deployment Commands
1. **Validate Template**:
   ```bash
   sam validate
   ```
2. **Build Functions**:
   ```bash
   sam build
   ```
3. **Local Testing (Invoke Single Lambda)**:
   Ensure you have Docker running.
   ```bash
   sam local invoke SendEmailConfirmationFunction --event events/order-event.json
   ```
4. **Deploy Stack manually**:
   ```bash
   sam deploy --config-env prod
   ```
