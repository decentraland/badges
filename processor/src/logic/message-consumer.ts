import { Event, Events } from '@dcl/schemas'
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
  let isRunning = false

  async function removeMessageFromQueue(messageHandle: string, entityId: string) {
    logger.info('Removing message from queue', { messageHandle, entityId })
    await queue.deleteMessage(messageHandle)
  }

  async function start() {
    logger.info('Starting to listen messages from queue')
    isRunning = true
    while (isRunning) {
      const messages = await queue.receiveMessages(10)

      if (!messages || messages.length === 0) {
        continue
      }

      for (const message of messages) {
        const messageReceivedAt = Date.now()
        const { Body, ReceiptHandle } = message
        let parsedMessage: Event | undefined

        try {
          const message = JSON.parse(Body!)
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
          if (parsedMessage.type === Events.Type.CLIENT) {
            // check also done in events-notifier to prevent invalid reports
            if (!(parsedMessage.metadata.timestamps.reportedAt > parsedMessage.metadata.timestamps.receivedAt)) {
              const delayCalculation = (messageReceivedAt - parsedMessage.timestamp) / 1000
              const endToEndDelay = (messageReceivedAt - parsedMessage.metadata.timestamps.reportedAt) / 1000
              logger.info('Delay calculation', {
                delayCalculation,
                messageReceivedAt,
                parsedMessageTimestamp: parsedMessage.timestamp
              })
              metrics.increment(
                'webhook_badges_event_delay_in_seconds_total',
                {
                  event_type: parsedMessage.subType
                },
                delayCalculation
              )
              metrics.increment(
                'end_to_end_event_delay_in_seconds_total',
                {
                  event_type: parsedMessage.subType
                },
                endToEndDelay
              )
              metrics.increment('explorer_events_arriving_to_badges_count', {
                event_type: parsedMessage.subType
              })
            }
          }

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
