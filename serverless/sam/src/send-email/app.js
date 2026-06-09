const {
  SNSClient,
  PublishCommand,
  ListSubscriptionsByTopicCommand,
  GetSubscriptionAttributesCommand,
  SetSubscriptionAttributesCommand
} = require('@aws-sdk/client-sns');

const snsClient = new SNSClient({});
const emailTopicArn = process.env.EMAIL_TOPIC_ARN;

/**
 * Ensure every confirmed email subscription on the topic has a FilterPolicy
 * so it only receives messages where MessageAttributes.email matches its own
 * address. Fixes old subscriptions that were created without a FilterPolicy.
 *
 * Runs once per Lambda cold start via the `policyFixed` flag.
 */
let policyFixed = false;

async function ensureFilterPolicies() {
  if (policyFixed) return;

  try {
    console.log('[Lambda send-email] Checking FilterPolicy for all email subscriptions...');
    let nextToken;
    do {
      const resp = await snsClient.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: emailTopicArn, NextToken: nextToken })
      );

      for (const sub of (resp.Subscriptions || [])) {
        if (sub.Protocol !== 'email' || sub.SubscriptionArn === 'PendingConfirmation') continue;

        try {
          const { Attributes } = await snsClient.send(
            new GetSubscriptionAttributesCommand({ SubscriptionArn: sub.SubscriptionArn })
          );

          const raw = Attributes?.FilterPolicy;
          const current = raw ? JSON.parse(raw) : null;
          const expected = { email: [sub.Endpoint] };

          // Fix if FilterPolicy is missing or doesn't contain the subscriber's own email
          if (!current || !current.email || !current.email.includes(sub.Endpoint)) {
            await snsClient.send(new SetSubscriptionAttributesCommand({
              SubscriptionArn: sub.SubscriptionArn,
              AttributeName: 'FilterPolicy',
              AttributeValue: JSON.stringify(expected)
            }));
            console.log(`[Lambda send-email] ✅ Fixed FilterPolicy for: ${sub.Endpoint}`);
          }
        } catch (err) {
          console.warn(`[Lambda send-email] ⚠️ Could not check/fix ${sub.Endpoint}:`, err.message);
        }
      }

      nextToken = resp.NextToken;
    } while (nextToken);

    policyFixed = true;
    console.log('[Lambda send-email] FilterPolicy check complete.');
  } catch (err) {
    console.error('[Lambda send-email] Error ensuring FilterPolicies:', err.message);
  }
}

exports.lambdaHandler = async (event, context) => {
  console.log('[Lambda send-email] Received event:', JSON.stringify(event, null, 2));

  // Ensure all subscriptions have correct FilterPolicy (runs once per cold start)
  await ensureFilterPolicies();

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
      // Only the subscriber whose FilterPolicy matches recipientEmail will receive it
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
