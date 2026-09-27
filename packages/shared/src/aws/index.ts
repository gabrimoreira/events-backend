import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { S3Client } from '@aws-sdk/client-s3'
import { SNSClient } from '@aws-sdk/client-sns'
import { SQSClient } from '@aws-sdk/client-sqs'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

/**
 * `endpoint` is only set locally (LocalStack). On AWS the SDK resolves the real
 * endpoints and takes credentials from the instance profile (LabRole).
 */
export interface AwsOptions {
  region: string
  endpoint?: string
}

export function createS3Client({ region, endpoint }: AwsOptions) {
  return new S3Client({ region, endpoint, forcePathStyle: Boolean(endpoint) })
}

export function createSnsClient({ region, endpoint }: AwsOptions) {
  return new SNSClient({ region, endpoint })
}

export function createSqsClient({ region, endpoint }: AwsOptions) {
  // Queue URLs returned by LocalStack may not be reachable from containers — use the endpoint.
  return new SQSClient({ region, endpoint, useQueueUrlAsEndpoint: !endpoint })
}

export function createDynamoClient({ region, endpoint }: AwsOptions) {
  return DynamoDBDocumentClient.from(new DynamoDBClient({ region, endpoint }), {
    marshallOptions: { removeUndefinedValues: true },
  })
}
