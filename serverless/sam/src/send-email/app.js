/**
 * Lambda send-email: Xử lý sự kiện từ SQS (SendEmailQueue)
 * Email thực tế được gửi bởi SNS email subscription (có filter policy).
 * Lambda này chỉ ghi log theo dõi và xác nhận đã xử lý message.
 */

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

      console.log(`[Lambda send-email] ✅ Processed order ${order.id} for ${recipientEmail}`);
      console.log(`[Lambda send-email] Email delivery is handled by SNS email subscription.`);
      console.log(`[Lambda send-email] Order total: $${order.total}, Items: ${order.items.length}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email queue processed successfully' })
    };
  } catch (error) {
    console.error('[Lambda send-email] Error processing event:', error);
    throw error;
  }
};
