import { Event } from '@dcl/schemas'
import { AppComponents, IEventDispatcher, IObserver } from '../types'
import { UserBadge } from '@badges/common'

export function createEventDispatcher({ db, logs }: Pick<AppComponents, 'db' | 'logs'>): IEventDispatcher {
  const logger = logs.getLogger('event-dispatcher')
  const observers: Map<string, IObserver[]> = new Map()

  function registerObserver(observer: IObserver): void {
    for (const eventData of observer.events) {
      const key = `${eventData.type}-${eventData.subType}`
      const list = observers.get(key) || []
      list.push(observer)
      observers.set(key, list)
    }
  }

  async function handleEvent(observer: IObserver, event: Event, userProgress: UserBadge | undefined): Promise<any> {
    const key = `${event.type}-${event.subType}
    `
    try {
      return observer.handle(event, userProgress)
    } catch (error: any) {
      logger.error(`Failed while executing handler for badge ${observer.badge.name} for ${key}`, {
        error: error.message
      })

      logger.debug(`Details about the error`, { stack: JSON.stringify(error.stack) })
    }
  }

  async function dispatch(event: Event): Promise<any> {
    try {
      const key = `${event.type}-${event.subType}`
      logger.debug(`Dispatching event ${key}`, { event: JSON.stringify(event) })

      const list = observers.get(key)
      if (!list) {
        logger.debug(`No observers configured for event ${key}`)
        return
      }

      const badgeIds = list.map((observer) => observer.badgeId)
      const userAddresses = list.map((observer) => observer.getUserAddress(event))

      const userProgresses = await db.getUserProgressesForMultipleBadges(badgeIds, userAddresses)
      const userProgressMap = new Map(
        userProgresses.map((userProgress) => [`${userProgress.badge_id}-${userProgress.user_address}`, userProgress])
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

      const badgesToGrant = await Promise.all(checks)
      return badgesToGrant.flat()
    } catch (error: any) {
      logger.error(`Failed while dispatching event`, { error: error.message })
      logger.debug(`Details about the error`, { stack: JSON.stringify(error.stack) })
    }
  }

  return { registerObserver, dispatch }
}
