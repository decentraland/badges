import { LRUCache } from 'lru-cache'
import { EventMemoryStorage } from '../types'

export type CachedEventId = {
  userAddress: string
  sessionId: string
  eventSubType: string
}

export type CachedEvent = {
  type: string
  subType: string
  sessionId: string
  userAddress: string
  timestamp: number
  metadata: any
}

export function createEventMemoryStorage(): EventMemoryStorage {
  const cache = new LRUCache<string, CachedEvent[]>({
    max: 1000,
    ttl: 1000 * 60 * 60 * 2 // 2 hours
  })

  return {
    get(key: CachedEventId): CachedEvent[] {
      return cache.get(`${key.userAddress}:${key.sessionId}:${key.eventSubType}`) || []
    },
    set(key: CachedEventId, events: CachedEvent[]): void {
      cache.set(`${key.userAddress}:${key.sessionId}:${key.eventSubType}`, events)
    }
  }
}
