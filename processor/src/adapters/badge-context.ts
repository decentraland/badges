import { Entity } from '@dcl/schemas'
import { createContentClient } from 'dcl-catalyst-client'
import { AppComponents, IBadgeContext } from '../types'
import { getTokenIdAndAssetUrn, isExtendedUrn, parseUrn } from '@dcl/urn-resolver'

export async function createBadgeContext({
  fetch,
  config
}: Pick<AppComponents, 'fetch' | 'config'>): Promise<IBadgeContext> {
  const loadBalancer = await config.requireString('CATALYST_CONTENT_URL_LOADBALANCER')

  const contentClient = createContentClient({
    fetcher: fetch,
    url: loadBalancer
  })

  async function getWearablesWithRarity(wearables: string[]): Promise<Entity[]> {
    const wearablesUrns: string[] = []
    for (const wearable of wearables) {
      const identifier = await parseUrn(wearable)
      if (!identifier) {
        break
      }

      wearablesUrns.push(isExtendedUrn(identifier) ? getTokenIdAndAssetUrn(wearable).assetUrn : wearable)
    }

    const fetchedWearables: Entity[] = await contentClient.fetchEntitiesByPointers(wearablesUrns)

    return fetchedWearables
  }

  async function getEntityById(id: string): Promise<Entity> {
    const fetchedEntity: Entity = await contentClient.fetchEntityById(id)

    return fetchedEntity
  }

  async function getEntityByPointer(pointer: string): Promise<Entity> {
    const fetchedEntity: Entity[] = await contentClient.fetchEntitiesByPointers([pointer])

    return fetchedEntity[0]
  }

  return { getWearablesWithRarity, getEntityById, getEntityByPointer }
}
