import { AppComponents, BadgeProcessorResult, MessageProcessorComponent } from '../types'
import { BadgeGrantedEvent, Event, Events } from '@dcl/schemas'

export async function createMessageProcessorComponent({
  logs,
  config,
  metrics,
  eventDispatcher,
  publisher
}: Pick<
  AppComponents,
  'logs' | 'config' | 'metrics' | 'eventDispatcher' | 'publisher'
>): Promise<MessageProcessorComponent> {
  const logger = logs.getLogger('message-processor')
  const isDevEnvironment = (await config.getString('ENV')) === 'dev'

  const generateIdempotencyKey = (result: BadgeProcessorResult): string => {
    const tierAchieved: string = !!result.badgeGranted.tiers?.length ? '-' + result.badgeGranted.tiers[0].tierId : ''
    return `${result.userAddress}-${result.badgeGranted.id}${tierAchieved}`
  }

  const generateTestingEventKey = (result: BadgeProcessorResult): string => {
    const idempotencyKey = generateIdempotencyKey(result)
    return `${idempotencyKey}-${Date.now()}`
  }

  const generateEventKey: (result: BadgeProcessorResult) => string = isDevEnvironment
    ? generateTestingEventKey
    : generateIdempotencyKey

  async function process(event: Event): Promise<void> {
    const { end: endMetricTimer } = metrics.startTimer('events_processing_duration_seconds')
    logger.info(`Processing entity`, { eventType: event.type, eventSubType: event.subType, eventKey: event.key })

    const processorsResult: BadgeProcessorResult[] = await eventDispatcher.dispatch(event)

    if (!!processorsResult.length) {
      logger.info('Granted badges', {
        grantedBadges: processorsResult.map((result: BadgeProcessorResult) => result.badgeGranted.id).join(' - ')
      })

      const eventsToPublish: BadgeGrantedEvent[] = processorsResult.map((result) => {
        const { badgeGranted, userAddress } = result

        return {
          type: Events.Type.BADGE,
          subType: Events.SubType.Badge.GRANTED,
          key: generateEventKey(result),
          timestamp: Date.now(),
          metadata: {
            badgeId: badgeGranted.id,
            badgeName: badgeGranted.name,
            badgeImageUrl: !!badgeGranted.tiers?.length
              ? badgeGranted.tiers.pop()?.assets?.['2d'].normal
              : badgeGranted.assets?.['2d'].normal,
            badgeTierName: !!badgeGranted.tiers?.length ? badgeGranted.tiers.pop()?.tierName : undefined,
            address: userAddress
          }
        } as BadgeGrantedEvent
      })

      const { successfulMessageIds, failedEvents } = await publisher.publishMessages(eventsToPublish)

      // TODO: handle retries
      if (failedEvents.length) {
        logger.error(`Failed to publish ${failedEvents.length} events`, { failedEvents: JSON.stringify(failedEvents) })
      }

      logger.info(`Published ${successfulMessageIds.length} events`, {
        successfulMessageIds: successfulMessageIds.join(' - ')
      })
    }

    endMetricTimer()
  }

  return {
    process
  }
}
