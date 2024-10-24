import { createInMemoryCacheComponent } from '../../../src/adapters/memory-cache'

describe('Memory Cache', () => {
  const cache = createInMemoryCacheComponent()

  it('should get and set values in the cache', async () => {
    await cache.set('key', 'value')
    const value = await cache.get('key')
    expect(value).toBe('value')
  })
})
