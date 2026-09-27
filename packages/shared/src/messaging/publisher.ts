import { PublishCommand, type SNSClient } from '@aws-sdk/client-sns'

import type { DomainMessage } from '../types'
import type { Logger } from '../utils'

interface PublisherOptions {
  client: SNSClient
  topicArn: string
  logger: Logger
}

/** Publishes domain messages to SNS; `type` goes as an attribute for the queue filter policies. */
export function createPublisher({ client, topicArn, logger }: PublisherOptions) {
  return {
    async publish(message: DomainMessage): Promise<void> {
      const result = await client.send(
        new PublishCommand({
          TopicArn: topicArn,
          Message: JSON.stringify(message),
          MessageAttributes: { type: { DataType: 'String', StringValue: message.type } },
        }),
      )
      logger.info({ type: message.type, messageId: result.MessageId }, 'message published')
    },
  }
}

export type Publisher = ReturnType<typeof createPublisher>
