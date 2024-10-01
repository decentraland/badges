import { Entity } from '@dcl/schemas'
import { createContentClient } from 'dcl-catalyst-client'
import { AppComponents, IBadgeContext } from '../types'
import { getTokenIdAndAssetUrn, isExtendedUrn, parseUrn } from '@dcl/urn-resolver'
import retry from '../utils/retryer'

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

    const fetchedWearables: Entity[] = await getEntitiesByPointers(wearablesUrns)

    return fetchedWearables
  }

  async function getEntityById(
    entityId: string,
    options: { retries?: number; waitTime?: number; contentServerUrl?: string } = {}
  ): Promise<Entity> {
    const retries = options.retries ?? 3
    const waitTime = options.waitTime ?? 750
    const contentClientToUse = options.contentServerUrl
      ? createContentClient({ fetcher: fetch, url: options.contentServerUrl })
      : contentClient

    return retry(() => contentClientToUse.fetchEntityById(entityId), retries, waitTime)
  }

  async function getEntitiesByPointers(
    pointers: string[],
    options: { retries?: number; waitTime?: number; contentServerUrl?: string } = {}
  ): Promise<Entity[]> {
    const retries = options.retries ?? 3
    const waitTime = options.waitTime ?? 300
    const contentClientToUse = options.contentServerUrl
      ? createContentClient({ fetcher: fetch, url: options.contentServerUrl })
      : contentClient

    return retry(() => contentClientToUse.fetchEntitiesByPointers(pointers), retries, waitTime)
  }

  return { getWearablesWithRarity, getEntityById, getEntitiesByPointers }
}
