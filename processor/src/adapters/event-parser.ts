import { CatalystDeploymentEvent, CollectionCreatedEvent, Entity, Event, Events, MoveToParcelEvent } from '@dcl/schemas'
import { AppComponents, IEventParser, ParsingEventError } from '../types'
import { createContentClient } from 'dcl-catalyst-client'

export async function createEventParser({
  config,
  fetch
}: Pick<AppComponents, 'config' | 'fetch'>): Promise<IEventParser> {
  const loadBalancer = await config.requireString('CATALYST_CONTENT_URL_LOADBALANCER')

  async function parseCatalystEvent(event: any): Promise<CatalystDeploymentEvent> {
    const contentUrl = event.contentServerUrls ? event.contentServerUrls[0] : loadBalancer

    const contentClient = createContentClient({
      fetcher: fetch,
      url: contentUrl
    })

    const fetchedEntity: Entity = await contentClient.fetchEntityById(event.entity.entityId)

    return {
      type: Events.Type.CATALYST_DEPLOYMENT,
      subType: event.entity.entityType,
      key: event.entity.entityId,
      timestamp: fetchedEntity.timestamp,
      entity: fetchedEntity
    } as CatalystDeploymentEvent
  }

  async function parse(event: any): Promise<Event | undefined> {
    try {
      if (event.entity && Object.values(Events.SubType.CatalystDeployment).includes(event.entity.entityType)) {
        return parseCatalystEvent(event)
      }

      if (event.type === Events.Type.BLOCKCHAIN && event.subType === Events.SubType.Blockchain.COLLECTION_CREATED) {
        return event as CollectionCreatedEvent
      }

      if (event.type === Events.Type.CLIENT && event.subType === Events.SubType.Client.MOVE_TO_PARCEL) {
        return event as MoveToParcelEvent
      }

      return undefined
    } catch (error: any) {
      throw new ParsingEventError(`Error while parsing event ${error?.message}`)
    }
  }

  return { parse }
}
