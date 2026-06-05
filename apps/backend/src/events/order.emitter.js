const { snsClient, useLocalMock } = require('../config/aws');
const { PublishCommand } = require('@aws-sdk/client-sns');

const snsTopicArn = process.env.AWS_SNS_ORDER_CREATED_ARN || process.env.SNS_TOPIC_ARN;

class OrderEmitter {
  async emitOrderCreated(order) {
    if (useLocalMock) {
      console.log(`[Event Simulated] 🔔 OrderCreated event: ${order.id}. SNS message publish skipped (local mock).`);
      return { MessageId: 'mock-message-id-' + Math.random().toString(36).substr(2, 9) };
    }

    if (!snsTopicArn) {
      console.warn('[Event Warning] ⚠️ AWS_SNS_ORDER_CREATED_ARN is not configured. SNS publish skipped.');
      return null;
    }

    try {
      console.log(`[Event Emitter] 🔔 Publishing OrderCreated event for ${order.id} to ${snsTopicArn}...`);
      const command = new PublishCommand({
        TopicArn: snsTopicArn,
        Message: JSON.stringify(order),
        MessageAttributes: {
          EventType: {
            DataType: 'String',
            StringValue: 'OrderCreated'
          }
        }
      });
      const response = await snsClient.send(command);
      console.log(`[Event Emitter] ✅ SNS Publish success. MessageId: ${response.MessageId}`);
      return response;
    } catch (error) {
      console.error('[Event Emitter] ❌ Error publishing order event to SNS:', error);
      throw error;
    }
  }
}

module.exports = new OrderEmitter();
