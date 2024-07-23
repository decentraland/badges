import { Entity } from '@dcl/schemas'
import { createContentClient } from 'dcl-catalyst-client'
import { AppComponents } from '../types'
import { getTokenIdAndAssetUrn, isExtendedUrn, parseUrn } from '@dcl/urn-resolver'

export async function createBadgeContext({ fetch, config }: Pick<AppComponents, 'fetch' | 'config'>) {
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

  return { getWearablesWithRarity }
}
