import { LRUCache } from 'lru-cache'
import { EventMemoryStorage } from '../types'

export function createEventMemoryStorage(): EventMemoryStorage {
  const cache = new LRUCache<string, any>({
    max: 1000,
    ttl: 1000 * 60 * 60 * 2 // 2 hours
  })

  return {
    get(key: string): any {
      return cache.get(key)
    },
    set(key: string, value: any): void {
      cache.set(key, value)
    }
  }
}
