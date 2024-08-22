import { Event } from '@dcl/schemas'
import { AppComponents, IEventDispatcher, IObserver } from '../types'

export function createEventDispatcher({ logs }: Pick<AppComponents, 'logs'>): IEventDispatcher {
  const logger = logs.getLogger('event-dispatcher')
  const observers: Map<string, IObserver[]> = new Map()

  function registerObserver(eventsData: { type: string; subType: string }[], observer: IObserver): void {
    for (const eventData of eventsData) {
      const key = `${eventData.type}-${eventData.subType}`
      const list = observers.get(key) || []
      list.push(observer)
      observers.set(key, list)
    }
  }

  async function dispatch(event: Event): Promise<any> {
    const key = `${event.type}-${event.subType}`
    const list = observers.get(key)
    logger.debug(`Dispatching event ${key}`, { event: JSON.stringify(event) })
    if (list) {
      const checkings = list.map((observer) =>
        observer.check(event).catch((error) => {
          logger.error(`Failed while executing handler for badge ${observer.badge.name} for ${key}`, {
            error: error.message
          })

          logger.debug(`Details about the error`, { stack: JSON.stringify(error.stack) })
          return Promise.resolve(undefined)
        })
      )
      const badgesToGrant = await Promise.all(checkings)
      return badgesToGrant.flat()
    }

    return
  }

  return { registerObserver, dispatch }
}
