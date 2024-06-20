import { createDotEnvConfigComponent } from '@well-known-components/env-config-provider'
import { createLogComponent } from '@well-known-components/logger'
import { createFetchComponent } from '@well-known-components/fetch-component'
import { AppComponents } from './types'
import { createSqsAdapter } from './adapters/sqs'
import { createMemoryQueueAdapter } from './adapters/memory-queue'
import { createSnsComponent } from './adapters/sns'
import { createMessageProcessorComponent } from './logic/message-processor'
import { createMessagesConsumerComponent } from './logic/consumer'

// Initialize all the components of the app
export async function initComponents(): Promise<AppComponents> {
  const config = await createDotEnvConfigComponent({ path: ['.env.default', '.env.local', '.env'] })
  const logs = await createLogComponent({ config })

  const logger = logs.getLogger('components')
  const commitHash = (await config.getString('COMMIT_HASH')) || 'unknown'
  logger.info(`Initializing components. Version: ${commitHash}`)

  const fetch = createFetchComponent()

  const publisher = await createSnsComponent({ config })

  const sqsEndpoint = await config.getString('AWS_SQS_ENDPOINT')
  const queue = sqsEndpoint ? await createSqsAdapter(sqsEndpoint) : createMemoryQueueAdapter()

  const messageProcessor = createMessageProcessorComponent({ logs })

  const messageConsumer = createMessagesConsumerComponent({
    logs,
    queue,
    messageProcessor
  })

  return {
    config,
    fetch,
    logs,
    publisher,
    queue,
    messageProcessor,
    messageConsumer
  }
}
