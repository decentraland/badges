import { createClient } from 'redis'
import { START_COMPONENT, STOP_COMPONENT } from '@well-known-components/interfaces'

import { AppComponents, ICacheStorage } from '../types'

const TWO_HOURS_IN_SECONDS = 60 * 60 * 2

export async function createRedisComponent(
  hostUrl: string,
  components: Pick<AppComponents, 'logs'>
): Promise<ICacheStorage> {
  const { logs } = components
  const logger = logs.getLogger('redis-component')

  // Parse the host URL to extract components
  let parsedUrl: string
  let username: string | undefined
  let password: string | undefined
  let host: string
  let port: number = 6379

  try {
    // Check if the URL already includes protocol
    if (hostUrl.startsWith('redis://') || hostUrl.startsWith('rediss://')) {
      parsedUrl = hostUrl

      // Extract username and password if present
      const urlObj = new URL(hostUrl)
      if (urlObj.username) username = urlObj.username
      if (urlObj.password) password = urlObj.password
      host = urlObj.hostname
      port = parseInt(urlObj.port || '6379', 10)
    } else {
      // Assume it's just a hostname or hostname:port
      const parts = hostUrl.split(':')
      host = parts[0]
      if (parts.length > 1) {
        port = parseInt(parts[1], 10)
      }

      // Construct the URL
      parsedUrl = `redis://${host}:${port}`
    }

    logger.info('Redis connection details', {
      host,
      port,
      hasUsername: !!username ? 'yes' : 'no',
      hasPassword: !!password ? 'yes' : 'no',
      url: parsedUrl.replace(/\/\/.*@/, '//***:***@') // Mask credentials in logs
    })
  } catch (error: any) {
    logger.error('Error parsing Redis URL', { hostUrl, error: error?.message })
    throw error
  }

  // Create Redis client with enhanced options
  const client = createClient({
    url: parsedUrl,
    username,
    password,
    socket: {
      connectTimeout: 10000, // 10 seconds
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error('Redis connection failed after 10 retries')
          return new Error('Redis connection failed after 10 retries')
        }
        logger.warn(`Redis connection retry attempt ${retries}`)
        return Math.min(retries * 100, 3000) // Exponential backoff with max 3 seconds
      }
    }
  })

  // Add more detailed event listeners
  client.on('connect', () => {
    logger.info('Successfully connected to Redis')
  })

  client.on('ready', () => {
    logger.info('Redis client is ready to accept commands')
  })

  client.on('error', (err) => {
    logger.error('Redis connection error', {
      error: err.message,
      stack: err.stack,
      code: err.code
    })
  })

  client.on('reconnecting', () => {
    logger.warn('Redis client is reconnecting')
  })

  client.on('end', () => {
    logger.info('Redis connection ended')
  })

  async function start() {
    try {
      logger.info('Connecting to Redis', {
        host,
        port,
        hasUsername: !!username ? 'yes' : 'no',
        hasPassword: !!password ? 'yes' : 'no',
        url: parsedUrl.replace(/\/\/.*@/, '//***:***@') // Mask credentials in logs
      })

      // Test connection with a simple command
      await client.connect()
      await client.ping()
      logger.info('Successfully connected to Redis and verified with PING')
    } catch (err: any) {
      logger.error('Error connecting to Redis', {
        error: err.message,
        stack: err.stack,
        code: err.code,
        host,
        port
      })
      throw err
    }
  }

  async function stop() {
    try {
      logger.info('Disconnecting from Redis')
      await client.disconnect()
      logger.info('Successfully disconnected from Redis')
    } catch (err: any) {
      logger.error('Error disconnecting from Redis', {
        error: err.message,
        stack: err.stack
      })
    }
  }

  async function get<T>(key: string): Promise<T | null> {
    try {
      const serializedValue = await client.get(key)
      if (serializedValue) {
        return JSON.parse(serializedValue) as T
      }
      return null
    } catch (err: any) {
      logger.error(`Error getting key "${key}"`, {
        error: err.message,
        stack: err.stack,
        code: err.code
      })
      throw err
    }
  }

  async function set<T>(key: string, value: T): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value)
      await client.set(key, serializedValue, {
        EX: TWO_HOURS_IN_SECONDS
      })
      logger.debug(`Successfully set key "${key}"`)
    } catch (err: any) {
      logger.error(`Error setting key "${key}"`, {
        error: err.message,
        stack: err.stack,
        code: err.code
      })
      throw err
    }
  }

  return {
    get,
    set,
    start,
    stop
  }
}
