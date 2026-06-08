const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({});
const invoiceBucketName = process.env.INVOICE_BUCKET;

/**
 * Lambda handler for generating an invoice and updating the user's purchased items list.
 * Triggered by SQS events and writes to S3.
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
      
      // 1. Construct invoice document representation
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

      // 2. Fetch and update the user's purchased items list in S3
      const customerEmail = order.email || order.customerEmail || 'guest';
      const purchasedKey = `users/${customerEmail}/purchased.json`;
      let purchasedItems = [];

      try {
        console.log(`[Lambda generate-invoice] Downloading existing purchases from key: ${purchasedKey}`);
        const getCommand = new GetObjectCommand({
          Bucket: invoiceBucketName,
          Key: purchasedKey
        });
        const getResponse = await s3Client.send(getCommand);
        const getBody = await getResponse.Body.transformToString();
        purchasedItems = JSON.parse(getBody);
        if (!Array.isArray(purchasedItems)) {
          purchasedItems = [];
        }
      } catch (err) {
        if (err.name === 'NoSuchKey' || err.code === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
          console.log('[Lambda generate-invoice] No existing purchase file found. Initializing new list.');
        } else {
          console.error('[Lambda generate-invoice] Error downloading existing purchases:', err);
        }
      }

      // Append new items
      const newPurchases = (order.items || []).map(item => ({
        id: item.id || item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        purchaseDate: order.createdAt || new Date().toISOString(),
        orderId: order.id
      }));
      
      purchasedItems = [...purchasedItems, ...newPurchases];

      // Save updated list back to S3
      console.log(`[Lambda generate-invoice] Saving updated purchases to key: ${purchasedKey}`);
      const putPurchasedCommand = new PutObjectCommand({
        Bucket: invoiceBucketName,
        Key: purchasedKey,
        Body: JSON.stringify(purchasedItems, null, 2),
        ContentType: 'application/json'
      });
      await s3Client.send(putPurchasedCommand);
      console.log('[Lambda generate-invoice] Purchased list updated successfully.');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Invoices and user purchases updated successfully' })
    };
  } catch (error) {
    console.error('[Lambda generate-invoice] Error processing order event:', error);
    throw error;
  }
};
