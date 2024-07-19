import { Event } from '@dcl/schemas'
import { IEventDispatcher, IObserver } from '../types'

export function createEventDispatcher(): IEventDispatcher {
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
    if (list) {
      const checkings = list.map((observer) => observer.check(event))
      const badgesToGrant = await Promise.all(checkings)
      return badgesToGrant
    }

    return
  }

  return { registerObserver, dispatch }
}
