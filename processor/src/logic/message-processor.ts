import { AppComponents, BadgeProcessorResult, MessageProcessorComponent } from '../types'
import { Event } from '@dcl/schemas'

export async function createMessageProcessorComponent({
  logs,
  eventDispatcher
}: Pick<AppComponents, 'logs' | 'fetch' | 'config' | 'eventDispatcher'>): Promise<MessageProcessorComponent> {
  const logger = logs.getLogger('message-processor')

  async function process(event: Event): Promise<void> {
    logger.info(`Processing entity`, { eventType: event.type, eventSubType: event.subType, eventKey: event.key })

    const processorsResult = (await eventDispatcher.dispatch(event)).filter((result: BadgeProcessorResult) => !!result)
    if (!!processorsResult.length) {
      logger.info('Granted badges', {
        grantedBadges: processorsResult.map((result: BadgeProcessorResult) => result!.badgeGranted)
      })
    }
  }

  return {
    process
  }
}
