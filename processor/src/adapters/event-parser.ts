import {
  CatalystDeploymentEvent,
  CollectionCreatedEvent,
  Entity,
  Event,
  BaseEvent,
  Events,
  ItemSoldEvent,
  MoveToParcelEvent,
  UsedEmoteEvent,
  PassportOpenedEvent,
  VerticalHeightReachedEvent,
  WalkedDistanceEvent,
  ItemPublishedEvent
} from '@dcl/schemas'
import { AppComponents, IEventParser, ParsingEventError } from '../types'

export type SubType = BaseEvent['subType']
type EventParser = (event: any) => Event
type EventParsersMap = Partial<Record<Events.Type, Partial<Record<SubType, EventParser>>>>

export async function createEventParser({
  config,
  logs,
  badgeContext
}: Pick<AppComponents, 'config' | 'logs' | 'badgeContext'>): Promise<IEventParser> {
  const logger = logs.getLogger('event-parser')
  const loadBalancer = await config.requireString('CATALYST_CONTENT_URL_LOADBALANCER')

  const eventParsers: EventParsersMap = {
    [Events.Type.BLOCKCHAIN]: {
      [Events.SubType.Blockchain.COLLECTION_CREATED]: (event: any) => event as CollectionCreatedEvent,
      [Events.SubType.Blockchain.ITEM_SOLD]: (event: any) => event as ItemSoldEvent,
      [Events.SubType.Blockchain.ITEM_PUBLISHED]: (event: any) => event as ItemPublishedEvent
    },
    [Events.Type.CLIENT]: {
      [Events.SubType.Client.MOVE_TO_PARCEL]: (event: any) => event as MoveToParcelEvent,
      [Events.SubType.Client.USED_EMOTE]: (event: any) => event as UsedEmoteEvent,
      [Events.SubType.Client.PASSPORT_OPENED]: (event: any) => event as PassportOpenedEvent,
      [Events.SubType.Client.VERTICAL_HEIGHT_REACHED]: (event: any) => event as VerticalHeightReachedEvent,
      [Events.SubType.Client.WALKED_DISTANCE]: (event: any) => event as WalkedDistanceEvent
    }
  }

  async function parseCatalystEvent(event: any): Promise<CatalystDeploymentEvent | undefined> {
    const contentUrl = event.contentServerUrls ? event.contentServerUrls[0] : loadBalancer

    const fetchedEntity: Entity | undefined = (
      await badgeContext.getEntitiesByPointers(event.entity.pointers, { contentServerUrl: contentUrl })
    ).at(0)

    if (!fetchedEntity) {
      return undefined
    }

    return {
      type: Events.Type.CATALYST_DEPLOYMENT,
      subType: event.entity.entityType,
      key: event.entity.entityId,
      timestamp: fetchedEntity.timestamp,
      entity: fetchedEntity,
      authChain: event.authChain
    } as CatalystDeploymentEvent
  }

  function parseEvent(event: any): Event | undefined {
    const {
      type,
      subType
    }: {
      type: Events.Type
      subType: SubType
    } = event

    if (eventParsers[type] && eventParsers[type][subType]) {
      return eventParsers[type][subType](event)
    }

    return undefined
  }

  async function parse(event: any): Promise<Event | undefined> {
    try {
      if (event.entity && Object.values(Events.SubType.CatalystDeployment).includes(event.entity.entityType)) {
        return await parseCatalystEvent(event)
      }

      const parsedEvent = parseEvent(event)

      if (!parsedEvent) {
        logger.debug('Event not parsed', { event: JSON.stringify(event) })
      }

      return parsedEvent
    } catch (error: any) {
      const message = error?.message || 'No details'
      logger.debug('Error while parsing event', {
        error: message,
        cause: JSON.stringify(error.cause),
        stack: JSON.stringify(error.stack),
        event: JSON.stringify(event)
      })
      throw new ParsingEventError(`Error while parsing event: ${message}`, { cause: error })
    }
  }

  return { parse }
}
