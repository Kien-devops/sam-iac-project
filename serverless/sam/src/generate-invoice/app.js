const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({});
const invoiceBucketName = process.env.INVOICE_BUCKET;

/**
 * Lambda handler for generating an invoice.
 * Triggered by SQS events and writes static invoice files to S3.
 */
exports.lambdaHandler = async (event, context) => {
  console.log('[Lambda generate-invoice] Received event:', JSON.stringify(event, null, 2));

  if (!invoiceBucketName) {
    console.error('[Lambda generate-invoice] INVOICE_BUCKET environment variable is missing.');
    throw new Error('S3 target bucket configuration missing');
  }

  try {
    for (const record of event.Records) {
      const snsMessage = JSON.parse(record.body);
      const order = JSON.parse(snsMessage.Message);
      
      console.log(`[Lambda generate-invoice] Creating invoice for order: ${order.id}`);
      
      // Construct a mock invoice document representation
      const invoiceContent = `
=========================================
          TAX INVOICE - SIMULATED
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

      const key = `invoices/${order.id}.txt`;
      console.log(`[Lambda generate-invoice] Uploading invoice to S3 bucket ${invoiceBucketName} key ${key}...`);

      const command = new PutObjectCommand({
        Bucket: invoiceBucketName,
        Key: key,
        Body: invoiceContent,
        ContentType: 'text/plain'
      });

      await s3Client.send(command);
      console.log(`[Lambda generate-invoice] Invoice written successfully to S3 bucket.`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Invoices created and saved successfully' })
    };
  } catch (error) {
    console.error('[Lambda generate-invoice] Error creating invoice:', error);
    throw error;
  }
};
