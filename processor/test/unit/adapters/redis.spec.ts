import { createClient } from 'redis'
import { createRedisComponent } from '../../../src/adapters/redis'
import { create } from 'domain'
import { disconnect } from 'process'
import { ICacheStorage } from '../../../src/types'
import { getMockedComponents } from '../../utils'

jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    on: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn()
  })
}))

describe('redis', () => {
  let redis: ICacheStorage
  let mockClient: ReturnType<typeof createClient>

  beforeEach(async () => {
    const { logs } = await getMockedComponents()
    redis = await createRedisComponent('localhost', {
      logs
    })

    mockClient = createClient({ url: 'redis://localhost:6379' })
  })

  describe('start()', () => {
    it('should start the redis client', async () => {
      await redis.start({} as any)
      expect(mockClient.connect).toHaveBeenCalled()
    })

    it('when connect fails, should throw an error', async () => {
      mockClient.connect = jest.fn().mockRejectedValueOnce(new Error('Connection failed'))
      await expect(redis.start({} as any)).rejects.toThrow('Connection failed')
    })
  })

  describe('get()', () => {
    it('should get a value from the redis client and return null if it was not found', async () => {
      const value = await redis.get('key')
      expect(mockClient.get).toHaveBeenCalledWith('key')
      expect(value).toBe(null)
    })

    it('should get a value from the redis client and parse it correctly', async () => {
      mockClient.get = jest.fn().mockResolvedValueOnce(JSON.stringify('value'))
      const value = await redis.get('key')
      expect(mockClient.get).toHaveBeenCalledWith('key')
      expect(value).toBe('value')
    })

    it('when get fails, should throw an error', async () => {
      mockClient.get = jest.fn().mockRejectedValueOnce(new Error('Get failed'))
      await expect(redis.get('key')).rejects.toThrow('Get failed')
    })
  })

  describe('set()', () => {
    it('should set a value in the redis client', async () => {
      await redis.set('key', 'value')
      expect(mockClient.set).toHaveBeenCalledWith('key', JSON.stringify('value'), { EX: 7200 })
    })

    it('when set fails, should throw an error', async () => {
      mockClient.set = jest.fn().mockRejectedValueOnce(new Error('Set failed'))
      await expect(redis.set('key', 'value')).rejects.toThrow('Set failed')
    })
  })

  describe('stop()', () => {
    it('should stop the redis client', async () => {
      await redis.stop()
      expect(mockClient.disconnect).toHaveBeenCalled()
    })

    it('when disconnect fails, should throw an error', async () => {
      mockClient.disconnect = jest.fn().mockRejectedValueOnce(new Error('Disconnection failed'))
      await redis.stop()
      expect(mockClient.disconnect).toHaveBeenCalled()
    })
  })
})
