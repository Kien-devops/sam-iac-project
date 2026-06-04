/**
 * Lambda handler for sending email confirmation.
 * Triggered by SQS queue events.
 */
exports.lambdaHandler = async (event, context) => {
  console.log('[Lambda send-email] Received event:', JSON.stringify(event, null, 2));

  try {
    for (const record of event.Records) {
      // SQS message body contains the SNS notification structure
      const snsMessage = JSON.parse(record.body);
      
      // The actual order is stored in the SNS message body
      const order = JSON.parse(snsMessage.Message);
      
      console.log(`[Lambda send-email] Processing order notification:`, order.id);
      console.log(`--------------------------------------------------`);
      console.log(`To: customer@example.com`);
      console.log(`Subject: Order Confirmation - ${order.id}`);
      console.log(`Body: Thank you for your purchase of $${order.total}!`);
      console.log(`Items: ${JSON.stringify(order.items)}`);
      console.log(`--------------------------------------------------`);
      console.log(`[Lambda send-email] Email sent successfully.`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Processed email confirmation events' })
    };
  } catch (error) {
    console.error('[Lambda send-email] Error processing event:', error);
    throw error;
  }
};
