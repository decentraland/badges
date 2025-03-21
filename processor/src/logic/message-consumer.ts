import { Event } from '@dcl/schemas'
import { AppComponents, MessageConsumerComponent } from '../types'
import { sleep } from '../utils/timer'

export function createMessagesConsumerComponent({
  logs,
  metrics,
  queue,
  messageProcessor,
  eventParser
}: Pick<AppComponents, 'logs' | 'metrics' | 'queue' | 'eventParser' | 'messageProcessor'>): MessageConsumerComponent {
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

      if (!messages || messages.length === 0) {
        logger.info(`No messages found in queue, waiting ${intervalToWaitInSeconds} seconds to check again`)
        await sleep(intervalToWaitInSeconds * 1000)
        continue
      }

      for (const message of messages) {
        const { Body, ReceiptHandle } = message
        let parsedMessage: Event | undefined

        try {
          const message = JSON.parse(JSON.parse(Body!).Message)
          parsedMessage = await eventParser.parse(message)

          if (!parsedMessage) {
            logger.warn('Message is not a valid event or could not be parsed', { message })
            await removeMessageFromQueue(ReceiptHandle!, 'unknown')
            continue
          }
        } catch (error: any) {
          logger.error('Failed while parsing message from queue', {
            messageHandle: ReceiptHandle!,
            error: error?.message || 'Unexpected failure'
          })
          await removeMessageFromQueue(ReceiptHandle!, 'unknown')
          continue
        }

        try {
          await messageProcessor.process(parsedMessage)
          await removeMessageFromQueue(ReceiptHandle!, parsedMessage.key)
        } catch (error: any) {
          metrics.increment('processing_failures_count', {
            event_type: parsedMessage.type,
            event_sub_type: parsedMessage.subType
          })
          logger.error('Failed while processing message from queue', {
            messageHandle: ReceiptHandle!,
            entityId: parsedMessage?.key || 'unknown',
            error: error?.message || 'Unexpected failure'
          })
          logger.debug('Failed while processing message from queue', {
            stack: JSON.stringify(error?.stack)
          })
          // TODO: Add a retry mechanism OR DLQ
          await removeMessageFromQueue(ReceiptHandle!, parsedMessage.key)
        }
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
