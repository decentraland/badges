import { Message } from '@aws-sdk/client-sqs'
import { randomUUID } from 'node:crypto'

import { QueueComponent, QueueMessage } from '../types'
import { sleep } from '../utils/timer'

export function createMemoryQueueAdapter(): QueueComponent {
  const queue: Map<string, Message> = new Map()

  async function send(message: QueueMessage): Promise<void> {
    const receiptHandle = randomUUID().toString()
    queue.set(receiptHandle, {
      MessageId: randomUUID().toString(),
      ReceiptHandle: receiptHandle,
      Body: JSON.stringify({ Message: JSON.stringify(message) })
    })

    return
  }

  async function receiveMessages(amount: number): Promise<Message[]> {
    await sleep(1000)
    const messages = Array.from(queue.values()).slice(0, amount)
    return messages
  }

  async function deleteMessage(receiptHandle: string): Promise<void> {
    queue.delete(receiptHandle)
  }

  return { send, receiveMessages, deleteMessage }
}
