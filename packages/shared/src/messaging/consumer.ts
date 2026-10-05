import { setTimeout as sleep } from 'node:timers/promises'

import {
  DeleteMessageCommand,
  GetQueueUrlCommand,
  type Message,
  ReceiveMessageCommand,
  type SQSClient,
} from '@aws-sdk/client-sqs'

import type { DomainMessage, DomainMessageType } from '../types'
import type { Logger } from '../utils'

const MESSAGE_TYPES: DomainMessageType[] = ['ORDER_PAID', 'BANNER_UPLOADED']

interface ConsumerOptions {
  client: SQSClient
  queueUrl: string
  logger: Logger
  handle: (message: DomainMessage) => Promise<void>
  signal: AbortSignal
  batchSize?: number
  waitTimeSeconds?: number
}

export async function resolveQueueUrl(client: SQSClient, queueName: string): Promise<string> {
  const { QueueUrl } = await client.send(new GetQueueUrlCommand({ QueueName: queueName }))
  if (!QueueUrl) throw new Error(`Queue not found: ${queueName}`)
  return QueueUrl
}

function parseMessage(body: string | undefined): DomainMessage {
  let payload: unknown = JSON.parse(body ?? 'null')
  if (payload && typeof payload === 'object' && 'Type' in payload && 'Message' in payload) {
    payload = JSON.parse(String(payload.Message))
  }
  const type = payload && typeof payload === 'object' && 'type' in payload ? payload.type : null
  if (!MESSAGE_TYPES.includes(type as DomainMessageType)) {
    throw new Error(`Unknown message type: ${String(type)}`)
  }
  return payload as DomainMessage
}

export async function consumeQueue({
  client,
  queueUrl,
  logger,
  handle,
  signal,
  batchSize = 5,
  waitTimeSeconds = 20,
}: ConsumerOptions): Promise<void> {
  const processMessage = async (raw: Message) => {
    try {
      const message = parseMessage(raw.Body)
      await handle(message)
      await client.send(
        new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: raw.ReceiptHandle }),
      )
    } catch (error) {
      logger.error({ err: error, messageId: raw.MessageId }, 'message processing failed')
    }
  }

  logger.info({ queueUrl }, 'consuming queue')
  while (!signal.aborted) {
    try {
      const { Messages = [] } = await client.send(
        new ReceiveMessageCommand({
          QueueUrl: queueUrl,
          MaxNumberOfMessages: batchSize,
          WaitTimeSeconds: waitTimeSeconds,
          MessageAttributeNames: ['All'],
        }),
        { abortSignal: signal },
      )
      await Promise.all(Messages.map(processMessage))
    } catch (error) {
      if (signal.aborted) break
      logger.error({ err: error, queueUrl }, 'receive failed, retrying in 5s')
      await sleep(5_000, undefined, { signal }).catch(() => undefined)
    }
  }
  logger.info({ queueUrl }, 'consumer stopped')
}
