const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const snsClient = new SNSClient({});
const emailTopicArn = process.env.EMAIL_TOPIC_ARN;

exports.lambdaHandler = async (event, context) => {
  console.log('[Lambda send-email] Received event:', JSON.stringify(event, null, 2));

  try {
    for (const record of event.Records) {
      const snsMessage = JSON.parse(record.body);
      const order = JSON.parse(snsMessage.Message);

      const recipientEmail = order.email;
      if (!recipientEmail) {
        console.warn(`[Lambda send-email] Order ${order.id} has no email. Skipping.`);
        continue;
      }

      // Build invoice text
      const invoiceText = `
=========================================
        TAX INVOICE - ORDER NOTIFICATION
=========================================
Order ID: ${order.id}
Date: ${new Date(order.createdAt).toUTCString()}

Items:
${order.items.map(item => `- ${item.name} | Qty: ${item.quantity} | Price: $${item.price}`).join('\n')}

-----------------------------------------
TOTAL AMOUNT: $${order.total}
=========================================
Thank you for your purchase!
`;

      // Publish to EmailNotificationTopic with email attribute for filter policy
      console.log(`[Lambda send-email] Publishing invoice to EmailNotificationTopic for ${recipientEmail}`);
      const messageObj = {
        default: invoiceText,
        email: invoiceText
      };

      const command = new PublishCommand({
        TopicArn: emailTopicArn,
        Message: JSON.stringify(messageObj),
        MessageStructure: 'json',
        MessageAttributes: {
          email: {
            DataType: 'String',
            StringValue: recipientEmail
          }
        }
      });

      await snsClient.send(command);
      console.log(`[Lambda send-email] ✅ Invoice published to EmailNotificationTopic for ${recipientEmail}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email notifications processed successfully' })
    };
  } catch (error) {
    console.error('[Lambda send-email] Error:', error);
    throw error;
  }
};
