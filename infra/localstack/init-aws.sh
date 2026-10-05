#!/usr/bin/env bash
set -euo pipefail

REGION=us-east-1
BUCKET=eventflow-assets
AUDIT_TABLE=eventflow-audit-log
TOPIC=eventflow-domain-events

echo "[init-aws] S3 bucket"
awslocal s3api create-bucket --bucket "$BUCKET" --region "$REGION" >/dev/null
awslocal s3api put-bucket-policy --bucket "$BUCKET" --policy "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Sid\": \"PublicBanners\",
    \"Effect\": \"Allow\",
    \"Principal\": \"*\",
    \"Action\": \"s3:GetObject\",
    \"Resource\": \"arn:aws:s3:::$BUCKET/public/*\"
  }]
}"

echo "[init-aws] DynamoDB audit table"
awslocal dynamodb create-table \
  --table-name "$AUDIT_TABLE" \
  --billing-mode PAY_PER_REQUEST \
  --attribute-definitions AttributeName=pk,AttributeType=S AttributeName=sk,AttributeType=S AttributeName=actorId,AttributeType=S \
  --key-schema AttributeName=pk,KeyType=HASH AttributeName=sk,KeyType=RANGE \
  --global-secondary-indexes '[{
    "IndexName": "actor-index",
    "KeySchema": [{"AttributeName": "actorId", "KeyType": "HASH"}, {"AttributeName": "sk", "KeyType": "RANGE"}],
    "Projection": {"ProjectionType": "ALL"}
  }]' >/dev/null

echo "[init-aws] SNS topic"
TOPIC_ARN=$(awslocal sns create-topic --name "$TOPIC" --query TopicArn --output text)

create_queue() {
  local name=$1 type=$2
  local dlq_url dlq_arn queue_url queue_arn
  dlq_url=$(awslocal sqs create-queue --queue-name "$name-dlq" --query QueueUrl --output text)
  dlq_arn=$(awslocal sqs get-queue-attributes --queue-url "$dlq_url" --attribute-names QueueArn --query Attributes.QueueArn --output text)
  queue_url=$(awslocal sqs create-queue --queue-name "$name" --attributes "{
    \"VisibilityTimeout\": \"60\",
    \"RedrivePolicy\": \"{\\\"deadLetterTargetArn\\\":\\\"$dlq_arn\\\",\\\"maxReceiveCount\\\":\\\"3\\\"}\"
  }" --query QueueUrl --output text)
  queue_arn=$(awslocal sqs get-queue-attributes --queue-url "$queue_url" --attribute-names QueueArn --query Attributes.QueueArn --output text)
  awslocal sns subscribe \
    --topic-arn "$TOPIC_ARN" \
    --protocol sqs \
    --notification-endpoint "$queue_arn" \
    --attributes "{\"RawMessageDelivery\": \"true\", \"FilterPolicy\": \"{\\\"type\\\": [\\\"$type\\\"]}\"}" >/dev/null
  echo "[init-aws] queue $name <- $type"
}

create_queue eventflow-ticket-jobs ORDER_PAID
create_queue eventflow-image-jobs BANNER_UPLOADED

echo "[init-aws] ready"
