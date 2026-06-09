const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const bedrock = new BedrockRuntimeClient({});
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;

exports.lambdaHandler = async (event) => {
  console.log('[AIAssistant] Received event:', JSON.stringify(event, null, 2));

  let message = "";
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    message = body?.message || "";
  } catch (e) {
    console.error('[AIAssistant] Failed to parse event body:', e);
  }

  if (!message) {
    return {
      statusCode: 400,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,POST'
      },
      body: JSON.stringify({ error: 'Message content is required.' })
    };
  }

  try {
    // 1. Fetch current catalog
    let products = [];
    if (PRODUCTS_TABLE) {
      try {
        const scanParams = { TableName: PRODUCTS_TABLE };
        const scanResult = await docClient.send(new ScanCommand(scanParams));
        products = scanResult.Items || [];
      } catch (dbErr) {
        console.error('[AIAssistant] Failed to scan ProductsTable:', dbErr);
      }
    }

    // 2. Perform simple filtering to feed matching items to context
    const query = message.toLowerCase();
    const matchedProducts = [];
    for (const p of products) {
      const matchText = `${p.name} ${p.category} ${p.description} ${Array.isArray(p.tags) ? p.tags.join(' ') : ''}`.toLowerCase();
      if (matchText.includes(query) || query.split(' ').some(word => word.length > 3 && matchText.includes(word))) {
        matchedProducts.push(p);
      }
    }

    // 3. Invoke Bedrock if available (Fallback if error/no credentials)
    let reply = "";
    try {
      const prompt = `You are "Cloudy", an intelligent and friendly e-commerce shopping assistant.
Here is the available product catalog context:
${JSON.stringify(products.map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category, description: p.description, tags: p.tags })))}

User query: "${message}"

Answer the user query in a helpful, conversational manner. If they ask for product recommendations, recommend matching products from the catalog context. Keep your response brief and premium.`;

      const bedrockInput = {
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 500,
          messages: [
            { role: 'user', content: prompt }
          ]
        })
      };

      const response = await bedrock.send(new InvokeModelCommand(bedrockInput));
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      reply = responseBody.content?.[0]?.text || "";
    } catch (bedrockErr) {
      console.warn('[AIAssistant] Bedrock invocation failed or unconfigured. Falling back to rule-based engine:', bedrockErr);
      
      // Dynamic rules fallback
      if (matchedProducts.length > 0) {
        reply = `I found some excellent products in our store matching your request: ${matchedProducts.slice(0, 3).map(p => p.name).join(', ')}. Let me know if you would like more details!`;
      } else if (query.includes('hello') || query.includes('hi ') || query.includes('xin chào')) {
        reply = "Hello! I am your AI-powered E-Commerce Assistant. How can I help you find products or track orders today?";
      } else if (query.includes('order') || query.includes('track') || query.includes('đơn hàng')) {
        reply = "You can view your order processing lifecycle live in the 'Account Dashboard' tab under 'Event Pipeline Log'. State updates are pushed in real time via AWS WebSockets!";
      } else {
        reply = "I'm your AI Shopping Assistant. Feel free to browse our premium catalog of laptops, noise-canceling headphones, and office accessories!";
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,POST',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reply,
        products: matchedProducts.slice(0, 3)
      })
    };

  } catch (err) {
    console.error('[AIAssistant] Lambda execution error:', err);
    return {
      statusCode: 500,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,POST'
      },
      body: JSON.stringify({ error: err.message || 'Internal Server Error' })
    };
  }
};
