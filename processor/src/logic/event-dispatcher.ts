import { EthAddress, Event, Events } from '@dcl/schemas'
import { AppComponents, EventProcessingResult, IEventDispatcher, IObserver } from '../types'
import { BadgeId, UserBadge } from '@badges/common'
import { retry } from '../utils/retryer'

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

  async function handleEvent(
    observer: IObserver,
    event: Event,
    userProgress: UserBadge | undefined
  ): Promise<EventProcessingResult> {
    try {
      const result = await retry(() => observer.handle(event, userProgress))
      return { ok: true, result }
    } catch (error: any) {
      metrics.increment('handler_failures_count', {
        event_type: event.type,
        event_sub_type: event.subType,
        badge_name: observer.badge.name
      })

      logger.error(`Failed while executing handler for badge ${observer.badge.name}`, {
        error: error.message,
        rootCause: error?.cause?.message,
        eventKey: event?.key
      })

      logger.debug(`Details about the error`, {
        stack: JSON.stringify(error.stack),
        rootStack: JSON.stringify(error?.cause?.stack),
        eventKey: event?.key
      })

      return { ok: false, error }
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

      const observersToInvoke = observers.get(observerKey)
      if (!observersToInvoke || observersToInvoke.length === 0) {
        logger.debug(`No observers configured for key ${observerKey}`)
        return
      }

      const badgeIds: BadgeId[] = observersToInvoke.map((observer) => observer.badgeId)
      const userAddresses: EthAddress[] = Array.from(
        new Set<EthAddress>(observersToInvoke.map((observer) => observer.getUserAddress(event)))
      )

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

      const asyncResults = observersToInvoke
        .filter((observer) => {
          const userProgress = userProgressMap.get(`${observer.badgeId}-${observer.getUserAddress(event)}`)
          return !userProgress || !userProgress.completed_at
        })
        .map(async (observer) => {
          const userProgress = userProgressMap.get(`${observer.badgeId}-${observer.getUserAddress(event)}`)
          return handleEvent(observer, event, userProgress)
        })

      const results = await Promise.all(asyncResults)

      const badgesToGrant = results.filter(({ ok, result }) => ok && !!result).map(({ result }) => result)
      // If we go with the retry queue, we could use the following to retry only the handlers that fail
      // const handlersToRetry = results.filter(({ ok }) => !ok)

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
