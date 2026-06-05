const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const s3Client = new S3Client({});
const sesClient = new SESClient({});

const invoiceBucketName = process.env.INVOICE_BUCKET;
const senderEmail = process.env.SENDER_EMAIL || 'kien_test_sns@mailinator.com';

exports.lambdaHandler = async (event, context) => {
  console.log('[Lambda send-email] Received event:', JSON.stringify(event, null, 2));

  try {
    for (const record of event.Records) {
      const snsMessage = JSON.parse(record.body);
      const order = JSON.parse(snsMessage.Message);
      
      const recipientEmail = order.email;
      if (!recipientEmail) {
        console.warn(`[Lambda send-email] Order ${order.id} has no email address. Skipping email sending.`);
        continue;
      }

      console.log(`[Lambda send-email] Processing email for order ${order.id} to ${recipientEmail}`);

      let invoiceContent = '';
      
      // Attempt 1: Fetch invoice from S3
      if (invoiceBucketName) {
        const key = `invoices/${order.id}.txt`;
        try {
          console.log(`[Lambda send-email] Fetching invoice from S3 bucket: ${invoiceBucketName}, key: ${key}`);
          const s3Response = await s3Client.send(new GetObjectCommand({
            Bucket: invoiceBucketName,
            Key: key
          }));
          invoiceContent = await s3Response.Body.transformToString('utf-8');
          console.log('[Lambda send-email] Successfully retrieved invoice from S3.');
        } catch (s3Error) {
          console.warn(`[Lambda send-email] Failed to retrieve invoice from S3: ${s3Error.message}. Falling back to SQS content.`);
        }
      }

      // Attempt 2: Fallback to constructing from SQS
      if (!invoiceContent) {
        invoiceContent = `
=========================================
          TAX INVOICE - GENERATED FROM EVENT
=========================================
Invoice Number: INV-${order.id.split('-')[1]}
Order ID: ${order.id}
Date: ${new Date(order.createdAt).toUTCString()}

Items:
${order.items.map(item => `- ${item.name} | Qty: ${item.quantity} | Price: $${item.price}`).join('\n')}

-----------------------------------------
TOTAL AMOUNT: $${order.total}
=========================================
Thank you for buying from our Cloud-Native platform!
`;
        console.log('[Lambda send-email] Generated fallback invoice content from SQS.');
      }

      // Send email via SES
      console.log(`[Lambda send-email] Sending email via SES to ${recipientEmail} from ${senderEmail}`);
      const emailParams = {
        Source: senderEmail,
        Destination: {
          ToAddresses: [recipientEmail]
        },
        Message: {
          Subject: {
            Data: `Invoice for Order - ${order.id}`,
            Charset: 'UTF-8'
          },
          Body: {
            Text: {
              Data: invoiceContent,
              Charset: 'UTF-8'
            }
          }
        }
      };

      await sesClient.send(new SendEmailCommand(emailParams));
      console.log(`[Lambda send-email] Email sent successfully to ${recipientEmail}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Processed email confirmations and sent invoices' })
    };
  } catch (error) {
    console.error('[Lambda send-email] Error processing event:', error);
    throw error;
  }
};
