import { AppComponents, MessageProcessorComponent } from '../types'
import { Event } from '@dcl/schemas'

export async function createMessageProcessorComponent({
  logs,
  eventDispatcher
}: Pick<AppComponents, 'logs' | 'fetch' | 'config' | 'eventDispatcher'>): Promise<MessageProcessorComponent> {
  const logger = logs.getLogger('message-processor')

  async function process(event: Event): Promise<void> {
    logger.info(`Processing entity`, { eventType: event.type, eventSubType: event.subType, eventKey: event.key })

    const grantedBadges = await eventDispatcher.dispatch(event)
    if (!!grantedBadges) {
      logger.info('Granted badges', { grantedBadges })
    }
  }

  return {
    process
  }
}
