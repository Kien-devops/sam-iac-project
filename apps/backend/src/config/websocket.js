const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const { useLocalMock, dynamoDocClient } = require('./aws');
const { PutCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforlocaldev123!';
const CONNECTIONS_TABLE = `WebSocketConnections-${process.env.ENV || 'prod'}`;

// Local mock connection storage: Map<email, Set<WebSocket>>
const localConnections = new Map();

let wss = null;

/**
 * Initialize local WebSocket server attached to the HTTP server (for local mock mode)
 */
function initLocalWebSocket(server) {
  if (!useLocalMock) {
    console.log('[WebSocket] Running in Production mode. Client should connect to AWS API Gateway WebSocket.');
    return;
  }

  console.log('[WebSocket] Initializing local WebSocket server...');
  wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    // Parse query params to extract token
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      wss.handleUpgrade(request, socket, head, (ws) => {
        ws.userEmail = decoded.email;
        wss.emit('connection', ws, request);
      });
    } catch (err) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    }
  });

  wss.on('connection', (ws) => {
    const email = ws.userEmail;
    console.log(`[WebSocket] Client connected: ${email}`);

    if (!localConnections.has(email)) {
      localConnections.set(email, new Set());
    }
    localConnections.get(email).add(ws);

    ws.on('close', () => {
      console.log(`[WebSocket] Client disconnected: ${email}`);
      const userSockets = localConnections.get(email);
      if (userSockets) {
        userSockets.delete(ws);
        if (userSockets.size === 0) {
          localConnections.delete(email);
        }
      }
    });

    ws.send(JSON.stringify({ type: 'SYSTEM', message: 'Connected to local WebSocket server' }));
  });
}

/**
 * Store a connection ID in DynamoDB (used by AWS API Gateway connection handler)
 */
async function registerConnection(connectionId, email) {
  if (useLocalMock) return;

  try {
    await dynamoDocClient.send(new PutCommand({
      TableName: CONNECTIONS_TABLE,
      Item: {
        connectionId,
        email,
        ttl: Math.floor(Date.now() / 1000) + 7200 // 2 hours connection TTL
      }
    }));
    console.log(`[WebSocket DB] Registered connection ${connectionId} for ${email}`);
  } catch (err) {
    console.error('[WebSocket DB] Failed to register connection:', err);
  }
}

/**
 * Remove a connection ID from DynamoDB
 */
async function unregisterConnection(connectionId) {
  if (useLocalMock) return;

  try {
    await dynamoDocClient.send(new DeleteCommand({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId }
    }));
    console.log(`[WebSocket DB] Unregistered connection ${connectionId}`);
  } catch (err) {
    console.error('[WebSocket DB] Failed to unregister connection:', err);
  }
}

/**
 * Send a message to a specific user (either locally or via APIGW WebSocket API)
 */
async function sendToUser(email, messageData) {
  const payload = JSON.stringify(messageData);

  if (useLocalMock) {
    const sockets = localConnections.get(email);
    if (sockets && sockets.size > 0) {
      console.log(`[WebSocket Mock] Pushing message to local sockets for ${email}`);
      for (const ws of sockets) {
        if (ws.readyState === ws.OPEN) {
          ws.send(payload);
        }
      }
    } else {
      console.log(`[WebSocket Mock] No active local connection for ${email}`);
    }
    return;
  }

  // AWS APIGW WebSocket implementation - query DB for connection IDs
  try {
    const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');
    
    const apiGatewayClient = new ApiGatewayManagementApiClient({
      endpoint: process.env.WEBSOCKET_ENDPOINT // APIGW callback URL
    });

    // Scan table for user connections (for demo simplicity, a scan or query by email index)
    const scanResp = await dynamoDocClient.send(new ScanCommand({
      TableName: CONNECTIONS_TABLE,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email }
    }));

    const connections = scanResp.Items || [];
    for (const conn of connections) {
      try {
        await apiGatewayClient.send(new PostToConnectionCommand({
          ConnectionId: conn.connectionId,
          Data: new TextEncoder().encode(payload)
        }));
      } catch (postErr) {
        if (postErr.name === 'GoneException') {
          // Stale connection - cleanup
          await unregisterConnection(conn.connectionId);
        } else {
          console.error(`[WebSocket APIGW] Error posting to connection ${conn.connectionId}:`, postErr);
        }
      }
    }
  } catch (err) {
    console.error('[WebSocket APIGW] Error broadcasting to user:', err);
  }
}

module.exports = {
  initLocalWebSocket,
  registerConnection,
  unregisterConnection,
  sendToUser
};
