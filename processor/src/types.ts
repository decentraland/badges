import type {
  IBaseComponent,
  IConfigComponent,
  IFetchComponent,
  IHttpServerComponent,
  ILoggerComponent
  // IMetricsComponent
} from '@well-known-components/interfaces'
import { Message } from '@aws-sdk/client-sqs'

import { BadgeDefinition } from '@badges/common'
// import { metricDeclarations } from './metrics'

export type GlobalContext = {
  components: BaseComponents
}

// components used in every environment
export type BaseComponents = {
  config: IConfigComponent
  fetch: IFetchComponent
  logs: ILoggerComponent
  // metrics: IMetricsComponent<keyof typeof metricDeclarations>
}

// components used in runtime
export type AppComponents = BaseComponents & {
  publisher: PublisherComponent
  queue: QueueComponent
  messageConsumer: MessageConsumerComponent
  messageProcessor: MessageProcessorComponent
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

export type BadgeGrantedEvent = {
  type: 'badge-granted'
  data: {
    badge: BadgeDefinition
  }
}

export type QueueMessage = any

export type QueueComponent = {
  send(message: QueueMessage): Promise<void>
  receiveSingleMessage(): Promise<Message[]>
  deleteMessage(receiptHandle: string): Promise<void>
}

export type PublisherComponent = {
  publishMessage(event: BadgeGrantedEvent): Promise<string | undefined>
}

export type MessageConsumerComponent = IBaseComponent

export type MessageProcessorComponent = {
  process(message: any, messageHandle: string): Promise<void>
}
