import { createClient } from 'redis'
import { AppComponents, ICacheStorage } from '../types'

const TWO_HOURS_IN_SECONDS = 60 * 60 * 2

export default async function createRedisComponent(
  hostUrl: string,
  components: Pick<AppComponents, 'logs'>
): Promise<ICacheStorage> {
  const { logs } = components
  const logger = logs.getLogger('redis-component')

  const client = createClient({
    url: `redis://${hostUrl}:6379`
  })

  client.on('error', (err) => {
    logger.error(err)
  })

  async function start() {
    logger.debug('Connecting to Redis', { hostUrl })
    await client.connect()
  }

  async function stop() {
    logger.debug('Disconnecting from Redis')
    await client.disconnect()
  }

  async function get(key: string): Promise<any | null> {
    const serializedValue = await client.get(key)
    if (serializedValue) {
      return JSON.parse(serializedValue)
    }
    return null
  }

  async function set(key: string, value: any): Promise<void> {
    const serializedValue = JSON.stringify(value)
    await client.set(key, serializedValue, {
      EX: TWO_HOURS_IN_SECONDS
    })
  }

  return {
    get,
    set,
    start,
    stop
  }
}
