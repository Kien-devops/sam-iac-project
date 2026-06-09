const { RekognitionClient, DetectLabelsCommand } = require('@aws-sdk/client-rekognition');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const rekognition = new RekognitionClient({});
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;

exports.lambdaHandler = async (event) => {
  console.log('[ImageAnalyzer] Received event:', JSON.stringify(event, null, 2));

  if (!PRODUCTS_TABLE) {
    console.error('[ImageAnalyzer] PRODUCTS_TABLE environment variable is missing.');
    return;
  }

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`[ImageAnalyzer] Processing image upload: s3://${bucket}/${key}`);

    // Parse product ID from filename
    // Examples: "products/1.jpg" -> "1", "1_image.png" -> "1"
    const fileName = key.split('/').pop();
    const productId = fileName.split('.')[0].split('_')[0];

    if (!productId) {
      console.warn(`[ImageAnalyzer] Could not determine productId from key: ${key}. Skipping.`);
      continue;
    }

    try {
      // Step 1: Call Amazon Rekognition to detect labels
      const detectParams = {
        Image: {
          S3Object: {
            Bucket: bucket,
            Name: key
          }
        },
        MaxLabels: 10,
        MinConfidence: 75
      };

      console.log(`[ImageAnalyzer] Querying Amazon Rekognition for labels...`);
      const response = await rekognition.send(new DetectLabelsCommand(detectParams));
      const labels = response.Labels || [];
      const tags = labels.map(label => label.Name);

      console.log(`[ImageAnalyzer] Rekognition detected labels for product ${productId}:`, tags);

      if (tags.length === 0) {
        console.log('[ImageAnalyzer] No highly confident labels detected. Skipping DB update.');
        continue;
      }

      // Step 2: Update product tags in DynamoDB Products Table
      const updateParams = {
        TableName: PRODUCTS_TABLE,
        Key: { id: productId },
        UpdateExpression: 'SET tags = :tags',
        ExpressionAttributeValues: {
          ':tags': tags
        }
      };

      console.log(`[ImageAnalyzer] Updating DynamoDB product ${productId} with tags...`);
      await docClient.send(new UpdateCommand(updateParams));
      console.log(`[ImageAnalyzer] Successfully updated tags for product ${productId}`);

    } catch (err) {
      console.error(`[ImageAnalyzer] Error processing image s3://${bucket}/${key}:`, err);
    }
  }

  return { statusCode: 200, body: 'Processed S3 trigger successfully' };
};
