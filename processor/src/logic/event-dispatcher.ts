import { Event, Events } from '@dcl/schemas'
import { AppComponents, IEventDispatcher, IObserver } from '../types'
import { UserBadge } from '@badges/common'

export function createEventDispatcher({
  logs,
  metrics,
  db
}: Pick<AppComponents, 'logs' | 'metrics' | 'db'>): IEventDispatcher {
  const logger = logs.getLogger('event-dispatcher')
  const observers: Map<string, IObserver[]> = new Map()

  function getObservers(): Map<string, IObserver[]> {
    return observers
  }

  function registerObserver(observer: IObserver): void {
    for (const eventData of observer.events) {
      const key = `${eventData.type}-${eventData.subType}`
      const list = observers.get(key) || []
      list.push(observer)
      observers.set(key, list)

      metrics.increment('attached_observers_count', {
        event_type: eventData.type,
        event_sub_type: eventData.subType,
        badge_name: observer.badge.name
      })
    }
  }

  async function handleEvent(observer: IObserver, event: Event, userProgress: UserBadge | undefined): Promise<any> {
    try {
      const result = await observer.handle(event, userProgress)
      return result
    } catch (error: any) {
      metrics.increment('handler_failures_count', {
        event_type: event.type,
        event_sub_type: event.subType,
        badge_name: observer.badge.name
      })
      logger.error(`Failed while executing handler for badge ${observer.badge.name}`, {
        error: error.message,
        eventKey: event?.key
      })

      logger.debug(`Details about the error`, { stack: JSON.stringify(error.stack), eventKey: event?.key })
    }
  }

  async function dispatch(event: Event): Promise<any> {
    try {
      const observerKey = `${event.type}-${event.subType}`
      const eventMetadata = event.type === Events.Type.CATALYST_DEPLOYMENT ? event.entity : event.metadata
      logger.debug(`Receive event to dispatch`, {
        eventKey: event.key,
        eventType: event.type,
        eventSubType: event.subType,
        eventMetadata: JSON.stringify(eventMetadata)
      })

      const list = observers.get(observerKey)
      if (!list || list.length === 0) {
        logger.debug(`No observers configured for key ${observerKey}`)
        return
      }

      const badgeIds = list.map((observer) => observer.badgeId)
      const userAddresses = list.map((observer) => observer.getUserAddress(event))

      logger.info('Dispatching event', {
        eventKey: event.key,
        eventType: event.type,
        eventSubType: event.subType,
        associatedUserAddresses: userAddresses.join(' - ')
      })

      const userProgresses: UserBadge[] = await db.getUserProgressesForMultipleBadges(badgeIds, userAddresses)
      const userProgressMap: Map<string, UserBadge> = new Map(
        userProgresses.map((userProgress: UserBadge) => [
          `${userProgress.badge_id}-${userProgress.user_address}`,
          userProgress
        ])
      )

      const checks = list
        .filter((observer) => {
          const userProgress = userProgressMap.get(`${observer.badgeId}-${observer.getUserAddress(event)}`)
          return !userProgress || !userProgress.completed_at
        })
        .map(async (observer) => {
          const userProgress = userProgressMap.get(`${observer.badgeId}-${observer.getUserAddress(event)}`)
          return handleEvent(observer, event, userProgress)
        })

      const badgesToGrant = (await Promise.all(checks)).filter(Boolean).flat()

      metrics.increment('events_correctly_handled_count', {
        event_type: event.type,
        event_sub_type: event.subType
      })

      metrics.increment('badges_granted_count', {}, badgesToGrant.length)

      return badgesToGrant
    } catch (error: any) {
      logger.error(`Failed while dispatching event`, { error: error.message, eventKey: event?.key })
      logger.debug(`Details about the error`, { stack: JSON.stringify(error.stack), eventKey: event?.key })
    }
  }

  return { getObservers, registerObserver, dispatch }
}
