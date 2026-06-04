const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

const ordersTable = process.env.ORDERS_TABLE;
const reportsTable = process.env.REPORTS_TABLE;

/**
 * Lambda handler for calculating daily revenue report.
 * Triggered by EventBridge cron schedule.
 */
exports.lambdaHandler = async (event, context) => {
  console.log('[Lambda daily-report] Starting daily revenue report aggregation...');

  if (!ordersTable || !reportsTable) {
    console.error('[Lambda daily-report] Configuration environment variables missing.');
    throw new Error('Database tables mappings missing');
  }

  try {
    // 1. Scan orders table
    const scanCommand = new ScanCommand({ TableName: ordersTable });
    const scanResponse = await dynamoDocClient.send(scanCommand);
    const orders = scanResponse.Items || [];

    console.log(`[Lambda daily-report] Found ${orders.length} total orders to process.`);

    // 2. Filter orders placed today
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const todayOrders = orders.filter(order => {
      if (!order.createdAt) return false;
      return order.createdAt.startsWith(todayStr);
    });

    // 3. Aggregate metrics
    const dailyRevenue = todayOrders.reduce((acc, order) => acc + (order.total || 0), 0);
    const orderCount = todayOrders.length;

    console.log(`[Lambda daily-report] Date: ${todayStr} | Order Count: ${orderCount} | Daily Revenue: $${dailyRevenue}`);

    // 4. Save to DailyReports table
    const putCommand = new PutCommand({
      TableName: reportsTable,
      Item: {
        date: todayStr,
        orderCount,
        revenue: dailyRevenue,
        processedAt: new Date().toISOString()
      }
    });

    await dynamoDocClient.send(putCommand);
    console.log(`[Lambda daily-report] Aggregated report successfully saved to ${reportsTable}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        date: todayStr,
        orderCount,
        revenue: dailyRevenue
      })
    };
  } catch (error) {
    console.error('[Lambda daily-report] Error running daily aggregation:', error);
    throw error;
  }
};
