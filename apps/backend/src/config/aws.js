const { SNSClient } = require('@aws-sdk/client-sns');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { SESClient } = require('@aws-sdk/client-ses');
const { S3Client } = require('@aws-sdk/client-s3');

const region = process.env.AWS_REGION || 'us-east-1';
const useLocalMock = process.env.USE_LOCAL_MOCK === 'true' || !process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI;

console.log(`[AWS Config] Mode: ${useLocalMock ? 'Mocking enabled (local)' : 'Production AWS SDK (Fargate Task Role)'}`);

let snsClient = null;
let dynamoDocClient = null;
let sesClient = null;
let s3Client = null;

if (!useLocalMock) {
  // Configured automatically using IAM Task Role on ECS or default credentials chain
  const config = { region };
  
  const dynamoClient = new DynamoDBClient(config);
  dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
  snsClient = new SNSClient(config);
  sesClient = new SESClient(config);
  s3Client = new S3Client(config);
}

module.exports = {
  useLocalMock,
  snsClient,
  dynamoDocClient,
  sesClient,
  s3Client,
  region
};

