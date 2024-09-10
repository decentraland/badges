import type {
  IBaseComponent,
  IConfigComponent,
  IFetchComponent,
  IHttpServerComponent,
  ILoggerComponent,
  IMetricsComponent
} from '@well-known-components/interfaces'
import { IPgComponent } from '@well-known-components/pg-component'
import { Message } from '@aws-sdk/client-sqs'
import { Badge, DbComponent, IBadgeStorage } from '@badges/common'
import { metricDeclarations } from './metrics'
import { Entity, Event } from '@dcl/schemas'
import { BadgeGrantedEvent } from '@dcl/schemas/dist/platform/events/services'

export type GlobalContext = {
  components: BaseComponents
}

// components used in every environment
export type BaseComponents = {
  config: IConfigComponent
  fetch: IFetchComponent
  logs: ILoggerComponent
  metrics: IMetricsComponent<keyof typeof metricDeclarations>
  server: IHttpServerComponent<GlobalContext>
  statusChecks: IBaseComponent
}

// components used in runtime
export type AppComponents = BaseComponents & {
  db: DbComponent
  pg: IPgComponent
  publisher: PublisherComponent
  queue: QueueComponent
  messageConsumer: MessageConsumerComponent
  messageProcessor: MessageProcessorComponent
  eventDispatcher: IEventDispatcher
  eventParser: IEventParser
  badgeContext: IBadgeContext
  memoryStorage: EventMemoryStorage
  badgeStorage: IBadgeStorage
}

// components used in tests
export type TestComponents = BaseComponents & {
  // A fetch component that only hits the test server
  localFetch: IFetchComponent
}

// this type simplifies the typings of http handlers
export type HandlerContextWithPath<
  ComponentNames extends keyof AppComponents,
  Path extends string = any
> = IHttpServerComponent.PathAwareContext<
  IHttpServerComponent.DefaultContext<{
    components: Pick<AppComponents, ComponentNames>
  }>,
  Path
>

export type QueueMessage = any

export type QueueComponent = {
  send(message: QueueMessage): Promise<void>
  receiveSingleMessage(): Promise<Message[]>
  deleteMessage(receiptHandle: string): Promise<void>
}

export type PublisherComponent = {
  publishMessages(events: BadgeGrantedEvent[]): Promise<{
    successfulMessageIds: string[]
    failedEvents: BadgeGrantedEvent[]
  }>
}

export type MessageConsumerComponent = IBaseComponent

export type MessageProcessorComponent = {
  process(message: Event): Promise<void>
}

export type IEventDispatcher = {
  registerObserver(observer: IObserver): void
  dispatch(event: Event): Promise<any>
}

type EventId = {
  type: string
  subType: string
}

export type IObserver = {
  handle(event: Event): Promise<any>
  badge: Badge
  events: EventId[]
}

export type IEventParser = {
  parse(event: any): Promise<Event | undefined>
}

export type EventMemoryStorage = {
  set(key: string, value: any): void
  get(key: string): any
}

export type IBadgeContext = {
  getWearablesWithRarity(wearables: string[]): Promise<Entity[]>
  getEntityById(id: string): Promise<Entity>
  getEntityByPointer(pointer: string): Promise<Entity>
}

export class ParsingEventError extends Error {
  constructor(message: string) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
  }
}

export type BadgeProcessorResult = {
  badgeGranted: Badge
  userAddress: string
}
