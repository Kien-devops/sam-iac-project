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

    // Try to extract authorization header to get user orders
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let username = 'guest';
    let userOrders = [];

    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforlocaldev123!';
        const decoded = jwt.verify(token, JWT_SECRET);
        username = decoded.username;
        const orderService = require('../services/order.service');
        userOrders = await orderService.listOrdersForUser(username, decoded.role);
      } catch (err) {
        console.warn('[AI Chat] Could not verify token or fetch orders for AI context:', err.message);
      }
    }

    let reply = "";
    let bedrockSuccess = false;

    // Try Bedrock first if available
    if (bedrockClient) {
      try {
        console.log('[AI Chat] Invoking AWS Bedrock (Claude 3 Haiku) for natural language response...');
        const prompt = `You are "Cloudy", an intelligent and friendly e-commerce shopping assistant for our premium store.
The current user session is: "${username}".
Here is the available product catalog context:
${JSON.stringify(products.map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category, description: p.description, tags: p.tags })))}

Here is the user's order history context:
${JSON.stringify(userOrders.map(o => ({ id: o.id, status: o.status, total: o.total, createdAt: o.createdAt, itemsCount: o.items ? o.items.length : 0 })))}

User query: "${message}"

Answer the user query in a helpful, conversational manner. If they ask about their orders (e.g. how many orders they have, status of orders), count their orders and summarize them based on the order history context. If they ask for product recommendations, recommend matching products from the catalog context. Keep your response brief and premium.`;

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
        reply = `Hello ${username !== 'guest' ? username : ''}! I am your AI-powered E-Commerce Assistant. How can I help you find products or track orders today?`;
      } else if (query.includes('order') || query.includes('track') || query.includes('đơn hàng')) {
        if (username !== 'guest') {
          reply = `Chào ${username}! Hiện tại bạn đang có ${userOrders.length} đơn hàng trong hệ thống. Bạn có thể theo dõi tiến độ cập nhật trạng thái đơn hàng của mình theo thời gian thực tại tab 'Account Dashboard' (phần Event Pipeline Log) nhé!`;
        } else {
          reply = "Bạn vui lòng đăng nhập để xem thông tin chi tiết về các đơn hàng của mình. (Có thể xem nhật ký xử lý đơn hàng trực quan theo thời gian thực tại tab 'Account Dashboard' sau khi đăng nhập).";
        }
      } else if (recommended.length > 0) {
        reply = `Dựa trên yêu cầu của bạn, tôi tìm thấy một số sản phẩm phù hợp: ${recommended.slice(0, 3).map(p => p.name).join(', ')}. Hãy cho tôi biết nếu bạn muốn xem chi tiết!`;
      } else if (query.includes('ship') || query.includes('delivery')) {
        reply = "Chúng tôi cung cấp dịch vụ giao hàng tiêu chuẩn. Khi bạn hoàn tất thanh toán, hóa đơn GTGT của bạn sẽ được tự động tạo và lưu trữ trên S3.";
      } else {
        reply = "Tôi là Cloudy - Trợ lý mua sắm AI của bạn. Hãy thoải mái tìm hiểu các sản phẩm công nghệ cao cấp của chúng tôi như Laptop, tai nghe chống ồn, v.v.!";
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
