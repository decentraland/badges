import { AppComponents, MessageConsumerComponent } from '../types'
import { sleep } from '../utils/timer'

export function createMessagesConsumerComponent({
  logs,
  queue,
  messageProcessor
}: Pick<AppComponents, 'logs' | 'queue' | 'messageProcessor'>): MessageConsumerComponent {
  const logger = logs.getLogger('messages-consumer')
  const intervalToWaitInSeconds = 5 // wait time when no messages are found in the queue
  let isRunning = false

  async function removeMessageFromQueue(messageHandle: string, entityId: string) {
    logger.info('Removing message from queue', { messageHandle, entityId })
    await queue.deleteMessage(messageHandle)
  }

  async function start() {
    logger.info('Starting to listen messages from queue')
    isRunning = true
    while (isRunning) {
      const messages = await queue.receiveSingleMessage()

      if (messages.length === 0) {
        logger.info(`No messages found in queue, waiting ${intervalToWaitInSeconds} seconds to check again`)
        await sleep(intervalToWaitInSeconds * 1000)
        continue
      }

      for (const message of messages) {
        const { Body, ReceiptHandle } = message
        let parsedMessage = undefined

        try {
          parsedMessage = JSON.parse(JSON.parse(Body!).Message)
        } catch (error: any) {
          logger.error('Failed while parsing message from queue', {
            messageHandle: ReceiptHandle!,
            error: error?.message || 'Unexpected failure'
          })
          await removeMessageFromQueue(ReceiptHandle!, 'unknown')
          continue
        }

        await messageProcessor.process(parsedMessage, ReceiptHandle!)
        await queue.deleteMessage(ReceiptHandle!)
      }
    }
  }

  async function stop() {
    isRunning = false
  }

  return {
    start,
    stop
  }
}
