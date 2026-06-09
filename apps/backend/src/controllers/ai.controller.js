const productService = require('../services/product.service');
const { bedrockClient } = require('../config/aws');
const { InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

exports.chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    console.log(`[AI Chat] User asks: "${message}"`);
    
    // Fetch current catalog
    const products = await productService.listProducts();
    const query = message.toLowerCase();

    // Perform keyword-based semantic matching
    const recommended = [];
    for (const p of products) {
      const matchName = p.name?.toLowerCase().includes(query) || query.includes(p.name?.toLowerCase());
      const matchCategory = p.category?.toLowerCase().includes(query) || query.includes(p.category?.toLowerCase());
      const matchDesc = p.description?.toLowerCase().includes(query);
      const matchTags = Array.isArray(p.tags) && p.tags.some(t => query.includes(t.toLowerCase()) || t.toLowerCase().includes(query));

      if (matchName || matchCategory || matchDesc || matchTags) {
        recommended.push(p);
      }
    }

    let reply = "";
    let bedrockSuccess = false;

    // Try Bedrock first if available
    if (bedrockClient) {
      try {
        console.log('[AI Chat] Invoking AWS Bedrock (Claude 3 Haiku) for natural language response...');
        const prompt = `You are "Cloudy", an intelligent and friendly e-commerce shopping assistant for our premium store.
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

        const response = await bedrockClient.send(new InvokeModelCommand(bedrockInput));
        // Simple decoder: new TextDecoder().decode()
        const textDecoder = new TextDecoder('utf-8');
        const responseBody = JSON.parse(textDecoder.decode(response.body));
        reply = responseBody.content?.[0]?.text || "";
        bedrockSuccess = true;
        console.log('[AI Chat] Bedrock response generated successfully.');
      } catch (err) {
        console.warn('[AI Chat] Bedrock invocation failed. Falling back to rule-based matching engine:', err.message);
      }
    }

    // Fallback to local rule-based engine if Bedrock was not run or failed
    if (!bedrockSuccess) {
      if (query.includes('hello') || query.includes('hi ') || query.includes('xin chào')) {
        reply = "Hello! I am your AI-powered E-Commerce Assistant. How can I help you find products or track orders today?";
      } else if (recommended.length > 0) {
        reply = `Based on your request, I found some matching item(s) in our store. Here are the top suggestions: ${recommended.slice(0, 3).map(p => p.name).join(', ')}. Let me know if you would like more details!`;
      } else if (query.includes('order') || query.includes('track') || query.includes('đơn hàng')) {
        reply = "You can view your order processing lifecycle live in the 'Account Dashboard' tab under 'Event Pipeline Log'. State updates are pushed in real time via AWS WebSockets!";
      } else if (query.includes('ship') || query.includes('delivery')) {
        reply = "We offer standard delivery. When you checkout, your items are registered, paid, and tax invoices are automatically generated and archived in S3.";
      } else {
        reply = "I'm your AI Shopping Assistant. Feel free to browse our premium catalog of laptops, noise-canceling headphones, and office accessories!";
        // Recommend some products anyway
        recommended.push(...products.slice(0, 2));
      }
    }

    return res.status(200).json({
      reply,
      products: recommended.slice(0, 3) // Return top 3 recommendations
    });
  } catch (err) {
    next(err);
  }
};
