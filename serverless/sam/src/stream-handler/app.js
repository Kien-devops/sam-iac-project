const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const dbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dbClient);

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;
const WEBSOCKET_ENDPOINT = process.env.WEBSOCKET_ENDPOINT;

// Instantiate the APIGW management client if endpoint is configured
let apiGatewayClient = null;
if (WEBSOCKET_ENDPOINT) {
  const endpoint = WEBSOCKET_ENDPOINT.startsWith('http') 
    ? WEBSOCKET_ENDPOINT 
    : `https://${WEBSOCKET_ENDPOINT}`;
  apiGatewayClient = new ApiGatewayManagementApiClient({ endpoint });
}

exports.lambdaHandler = async (event) => {
  console.log('[Lambda StreamHandler] Received stream event:', JSON.stringify(event, null, 2));

  if (!CONNECTIONS_TABLE) {
    console.error('[Lambda StreamHandler] CONNECTIONS_TABLE environment variable is missing.');
    return;
  }

  for (const record of event.Records) {
    // We only care about INSERT and MODIFY events
    if (record.eventName !== 'INSERT' && record.eventName !== 'MODIFY') {
      continue;
    }

    try {
      // Unmarshall DynamoDB JSON format to standard JS object
      const newImage = unmarshall(record.dynamodb.NewImage);
      const { id: orderId, status, email, total, items } = newImage;

      if (!email) {
        console.log(`[Lambda StreamHandler] Order ${orderId} has no associated email. Skipping broadcast.`);
        continue;
      }

      console.log(`[Lambda StreamHandler] Order ${orderId} changed status to ${status}. Querying connections for ${email}...`);

      // Query active connections for this user's email using GSI (EmailIndex)
      const queryParams = {
        TableName: CONNECTIONS_TABLE,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email
        }
      };

      const queryResult = await docClient.send(new QueryCommand(queryParams));
      const connections = queryResult.Items || [];

      if (connections.length === 0) {
        console.log(`[Lambda StreamHandler] No active connections found for ${email}`);
        continue;
      }

      const payload = JSON.stringify({
        type: 'ORDER_UPDATE',
        orderId,
        status,
        total,
        items,
        timestamp: new Date().toISOString()
      });

      console.log(`[Lambda StreamHandler] Broadcasting update to ${connections.length} connection(s)...`);

      if (!apiGatewayClient) {
        console.warn('[Lambda StreamHandler] WEBSOCKET_ENDPOINT not configured. Cannot post to connections.');
        continue;
      }

      for (const conn of connections) {
        const { connectionId } = conn;
        try {
          await apiGatewayClient.send(new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: new TextEncoder().encode(payload)
          }));
          console.log(`[Lambda StreamHandler] Successfully sent update to connection: ${connectionId}`);
        } catch (err) {
          if (err.name === 'GoneException' || err.$metadata?.httpStatusCode === 410) {
            console.log(`[Lambda StreamHandler] Connection ${connectionId} is stale. Cleaning up.`);
            try {
              await docClient.send(new DeleteCommand({
                TableName: CONNECTIONS_TABLE,
                Key: { connectionId }
              }));
            } catch (delErr) {
              console.error(`[Lambda StreamHandler] Error deleting stale connection ${connectionId}:`, delErr);
            }
          } else {
            console.error(`[Lambda StreamHandler] Failed to post to connection ${connectionId}:`, err);
          }
        }
      }

    } catch (err) {
      console.error('[Lambda StreamHandler] Error processing record:', err);
    }
  }

  return { statusCode: 200 };
};
