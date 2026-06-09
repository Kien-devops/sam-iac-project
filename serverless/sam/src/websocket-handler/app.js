const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const jwt = require('jsonwebtoken');

const dbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dbClient);

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforlocaldev123!';

exports.lambdaHandler = async (event) => {
  console.log('[Lambda WebSocketHandler] Received event:', JSON.stringify(event, null, 2));

  const { eventType, connectionId } = event.requestContext;

  if (!CONNECTIONS_TABLE) {
    console.error('[Lambda WebSocketHandler] CONNECTIONS_TABLE env var not configured.');
    return { statusCode: 500, body: 'Table configuration missing' };
  }

  if (eventType === 'CONNECT') {
    // Authenticate client using jwt token from query parameters: ?token=...
    const queryStringParameters = event.queryStringParameters || {};
    const token = queryStringParameters.token;

    if (!token) {
      console.log('[Lambda WebSocketHandler] Connection rejected: token missing');
      return { statusCode: 401, body: 'Unauthorized: Missing token' };
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const email = decoded.email;

      console.log(`[Lambda WebSocketHandler] Client authenticated: ${email}. Registering connection ${connectionId}`);

      await docClient.send(new PutCommand({
        TableName: CONNECTIONS_TABLE,
        Item: {
          connectionId,
          email,
          ttl: Math.floor(Date.now() / 1000) + 7200 // 2 hours TTL
        }
      }));

      return { statusCode: 200, body: 'Connected' };
    } catch (err) {
      console.error('[Lambda WebSocketHandler] JWT verification failed:', err.message);
      return { statusCode: 401, body: 'Unauthorized: Invalid token' };
    }
  } 
  
  if (eventType === 'DISCONNECT') {
    console.log(`[Lambda WebSocketHandler] Client disconnected: ${connectionId}. Removing registration.`);
    try {
      await docClient.send(new DeleteCommand({
        TableName: CONNECTIONS_TABLE,
        Key: { connectionId }
      }));
    } catch (err) {
      console.error('[Lambda WebSocketHandler] Error deleting connection record:', err);
    }
    return { statusCode: 200, body: 'Disconnected' };
  }

  return { statusCode: 200, body: 'OK' };
};
