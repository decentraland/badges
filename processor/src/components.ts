import path from 'path'
import { createDotEnvConfigComponent } from '@well-known-components/env-config-provider'
import { createLogComponent } from '@well-known-components/logger'
import { createFetchComponent } from '@well-known-components/fetch-component'
import { createPgComponent } from '@well-known-components/pg-component'
import { createMetricsComponent } from '@well-known-components/metrics'
import { createBadgeStorage, createDbComponent } from '@badges/common'
import { metricDeclarations } from './metrics'
import { AppComponents, GlobalContext } from './types'
import { createSqsAdapter } from './adapters/sqs'
import { createMemoryQueueAdapter } from './adapters/memory-queue'
import { createSnsComponent } from './adapters/sns'
import { createMessageProcessorComponent } from './logic/message-processor'
import { createMessagesConsumerComponent } from './logic/message-consumer'
import { createEventDispatcher } from './logic/event-dispatcher'
import { createOpenForBusinessObserver } from './logic/badges/open-for-business'
import { createEventParser } from './adapters/event-parser'
import { createBadgeContext } from './adapters/badge-context'
import { createRegallyRareObserver } from './logic/badges/regally-rare'
import { createEpicEnsembleObserver } from './logic/badges/epic-ensemble'
import {
  createServerComponent,
  createStatusCheckComponent,
  instrumentHttpServerWithPromClientRegistry
} from '@well-known-components/http-server'
import { createDecentralandCitizenObserver } from './logic/badges/decentraland-citizen'
import { createEventMemoryStorage } from './adapters/memory-cache'
import { createTravelerObserver } from './logic/badges/traveler'
import { createLegendaryLookObserver } from './logic/badges/legendary-look'
import { createExoticEleganceObserver } from './logic/badges/exotic-elegance'
import { createMythicModelObserver } from './logic/badges/mythic-model'
import { createUniqueUnicornObserver } from './logic/badges/unique-unicorn'
import { createProfileProObserver } from './logic/badges/profile-pro'
import { createEmotionistaObserver } from './logic/badges/emotionista'
import { createFashionistaObserver } from './logic/badges/fashionista'

// Initialize all the components of the app
export async function initComponents(): Promise<AppComponents> {
  const config = await createDotEnvConfigComponent({ path: ['.env.default', '.env.local', '.env'] })
  const logs = await createLogComponent({ config })

  const logger = logs.getLogger('components')
  const commitHash = (await config.getString('COMMIT_HASH')) || 'unknown'
  logger.info(`Initializing components. Version: ${commitHash}`)

  const server = await createServerComponent<GlobalContext>(
    { config, logs },
    {
      cors: {
        methods: ['GET', 'HEAD', 'OPTIONS', 'DELETE', 'POST', 'PUT'],
        maxAge: 86400
      }
    }
  )

  const statusChecks = await createStatusCheckComponent({ server, config })
  const metrics = await createMetricsComponent(metricDeclarations, { config })
  await instrumentHttpServerWithPromClientRegistry({ server, metrics, config, registry: metrics.registry! })

  let databaseUrl: string | undefined = await config.getString('PG_COMPONENT_PSQL_CONNECTION_STRING')
  if (!databaseUrl) {
    const dbUser = await config.requireString('PG_COMPONENT_PSQL_USER')
    const dbDatabaseName = await config.requireString('PG_COMPONENT_PSQL_DATABASE')
    const dbPort = await config.requireString('PG_COMPONENT_PSQL_PORT')
    const dbHost = await config.requireString('PG_COMPONENT_PSQL_HOST')
    const dbPassword = await config.requireString('PG_COMPONENT_PSQL_PASSWORD')
    databaseUrl = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbDatabaseName}`
  }

  const pg = await createPgComponent(
    { logs, config, metrics },
    {
      migration: {
        databaseUrl,
        dir: path.resolve(__dirname, 'migrations'),
        migrationsTable: 'pgmigrations',
        ignorePattern: '.*\\.map',
        direction: 'up'
      }
    }
  )
  const db = createDbComponent({ pg })

  const fetch = createFetchComponent()

  const publisher = await createSnsComponent({ config })

  const sqsEndpoint = await config.getString('AWS_SQS_ENDPOINT')
  const queue = sqsEndpoint ? await createSqsAdapter(sqsEndpoint) : createMemoryQueueAdapter()

  const memoryStorage = createEventMemoryStorage()
  const badgeContext = await createBadgeContext({ fetch, config })
  const badgeStorage = await createBadgeStorage({ config })

  const eventDispatcher = createEventDispatcher({ logs })
  eventDispatcher.registerObserver(createOpenForBusinessObserver({ db, logs, badgeStorage }))
  eventDispatcher.registerObserver(createRegallyRareObserver({ db, logs, badgeContext, badgeStorage }))
  eventDispatcher.registerObserver(createEpicEnsembleObserver({ db, logs, badgeContext, badgeStorage }))
  eventDispatcher.registerObserver(createLegendaryLookObserver({ db, logs, badgeContext, badgeStorage }))
  eventDispatcher.registerObserver(createExoticEleganceObserver({ db, logs, badgeContext, badgeStorage }))
  eventDispatcher.registerObserver(createMythicModelObserver({ db, logs, badgeContext, badgeStorage }))
  eventDispatcher.registerObserver(createUniqueUnicornObserver({ db, logs, badgeContext, badgeStorage }))
  eventDispatcher.registerObserver(createDecentralandCitizenObserver({ db, logs, badgeStorage }))
  eventDispatcher.registerObserver(createTravelerObserver({ db, logs, badgeContext, badgeStorage, memoryStorage }))
  eventDispatcher.registerObserver(createProfileProObserver({ db, logs, badgeStorage }))
  eventDispatcher.registerObserver(createEmotionistaObserver({ db, logs, badgeStorage }))
  eventDispatcher.registerObserver(createFashionistaObserver({ db, logs, badgeStorage }))

  const eventParser = await createEventParser({ config, fetch })

  const messageProcessor = await createMessageProcessorComponent({ logs, config, eventDispatcher, publisher })

  const messageConsumer = createMessagesConsumerComponent({
    logs,
    queue,
    messageProcessor,
    eventParser
  })

  return {
    config,
    fetch,
    logs,
    server,
    metrics,
    statusChecks,
    db,
    pg,
    publisher,
    queue,
    messageProcessor,
    messageConsumer,
    eventDispatcher,
    eventParser,
    badgeContext,
    badgeStorage,
    memoryStorage
  }
}
