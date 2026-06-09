#!/usr/bin/env node
/**
 * One-time script: Fix SNS Subscriptions FilterPolicy
 * 
 * Problem: Old subscriptions to EmailNotificationTopic were created WITHOUT
 * a FilterPolicy, causing ALL subscribers to receive EVERY order notification
 * instead of only the relevant customer.
 *
 * Solution: This script iterates through all confirmed email subscriptions
 * and sets a FilterPolicy so each subscriber only receives messages where
 * MessageAttributes.email matches their own email address.
 *
 * Usage:
 *   node scripts/fix-sns-subscriptions.js
 *
 * Prerequisites:
 *   - AWS credentials configured (env vars or ~/.aws/credentials)
 *   - EMAIL_NOTIFICATION_TOPIC_ARN env var set (or edit TOPIC_ARN below)
 */

const {
  SNSClient,
  ListSubscriptionsByTopicCommand,
  GetSubscriptionAttributesCommand,
  SetSubscriptionAttributesCommand
} = require('@aws-sdk/client-sns');

// ─── Configuration ──────────────────────────────────────────────────────────
const TOPIC_ARN = process.env.EMAIL_NOTIFICATION_TOPIC_ARN;
const DRY_RUN = process.argv.includes('--dry-run');
const REGION = process.env.AWS_REGION || 'ap-southeast-1';
// ─────────────────────────────────────────────────────────────────────────────

if (!TOPIC_ARN) {
  console.error('❌ EMAIL_NOTIFICATION_TOPIC_ARN env var is required.');
  console.error('   Export it or set it in your .env file.');
  process.exit(1);
}

const client = new SNSClient({ region: REGION });

async function getAllSubscriptions(topicArn) {
  const subscriptions = [];
  let nextToken;

  do {
    const command = new ListSubscriptionsByTopicCommand({
      TopicArn: topicArn,
      NextToken: nextToken
    });
    const response = await client.send(command);
    subscriptions.push(...(response.Subscriptions || []));
    nextToken = response.NextToken;
  } while (nextToken);

  return subscriptions;
}

async function getFilterPolicy(subscriptionArn) {
  try {
    const command = new GetSubscriptionAttributesCommand({
      SubscriptionArn: subscriptionArn
    });
    const response = await client.send(command);
    const filterPolicy = response.Attributes?.FilterPolicy;
    return filterPolicy ? JSON.parse(filterPolicy) : null;
  } catch (err) {
    console.warn(`  ⚠️  Could not read attributes for ${subscriptionArn}: ${err.message}`);
    return null;
  }
}

async function setFilterPolicy(subscriptionArn, email) {
  const filterPolicy = JSON.stringify({ email: [email] });

  if (DRY_RUN) {
    console.log(`  🔍 [DRY-RUN] Would set FilterPolicy = ${filterPolicy}`);
    return;
  }

  const command = new SetSubscriptionAttributesCommand({
    SubscriptionArn: subscriptionArn,
    AttributeName: 'FilterPolicy',
    AttributeValue: filterPolicy
  });
  await client.send(command);
  console.log(`  ✅ FilterPolicy set to: ${filterPolicy}`);
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   SNS Subscription FilterPolicy Fixer                ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log(`Topic: ${TOPIC_ARN}`);
  console.log(`Mode:  ${DRY_RUN ? '🔍 DRY-RUN (no changes)' : '🔧 LIVE (will modify subscriptions)'}`);
  console.log('');

  const subscriptions = await getAllSubscriptions(TOPIC_ARN);
  console.log(`Found ${subscriptions.length} total subscription(s).`);
  console.log('');

  let fixed = 0;
  let skipped = 0;
  let pending = 0;
  let errors = 0;

  for (const sub of subscriptions) {
    const { SubscriptionArn, Protocol, Endpoint } = sub;

    // Skip non-email protocols (SQS, Lambda, etc.)
    if (Protocol !== 'email') {
      console.log(`⏭️  Skipping non-email subscription: ${Protocol} → ${Endpoint}`);
      skipped++;
      continue;
    }

    // Skip pending confirmations
    if (SubscriptionArn === 'PendingConfirmation') {
      console.log(`⏳ Pending confirmation: ${Endpoint}`);
      pending++;
      continue;
    }

    console.log(`📧 Checking: ${Endpoint}`);
    console.log(`   ARN: ${SubscriptionArn}`);

    try {
      const existingPolicy = await getFilterPolicy(SubscriptionArn);

      if (existingPolicy && existingPolicy.email) {
        const existingEmails = existingPolicy.email;
        if (existingEmails.includes(Endpoint)) {
          console.log(`  ✅ Already has correct FilterPolicy. Skipping.`);
          skipped++;
          continue;
        }
        console.log(`  ⚠️  Has FilterPolicy but wrong email filter: ${JSON.stringify(existingPolicy)}`);
      } else if (existingPolicy) {
        console.log(`  ⚠️  Has FilterPolicy but missing email key: ${JSON.stringify(existingPolicy)}`);
      } else {
        console.log(`  ❌ NO FilterPolicy found — this subscriber receives ALL messages!`);
      }

      // Fix the subscription
      await setFilterPolicy(SubscriptionArn, Endpoint);
      fixed++;
    } catch (err) {
      console.error(`  ❌ Error fixing ${Endpoint}: ${err.message}`);
      errors++;
    }

    console.log('');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('Summary:');
  console.log(`  ✅ Fixed:   ${fixed}`);
  console.log(`  ⏭️  Skipped: ${skipped} (already correct or non-email)`);
  console.log(`  ⏳ Pending: ${pending}`);
  console.log(`  ❌ Errors:  ${errors}`);
  console.log('═══════════════════════════════════════════════════════');

  if (DRY_RUN && fixed > 0) {
    console.log('');
    console.log('💡 Run without --dry-run to apply changes:');
    console.log('   node scripts/fix-sns-subscriptions.js');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
