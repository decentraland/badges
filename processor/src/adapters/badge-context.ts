import { Entity } from '@dcl/schemas'
import { createContentClient } from 'dcl-catalyst-client'
import { AppComponents, IBadgeContext } from '../types'
import { getTokenIdAndAssetUrn, isExtendedUrn, parseUrn } from '@dcl/urn-resolver'
import { sleep } from '../utils/timer'

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
    const waitTime = options.waitTime ?? 300
    const contentClientToUser = options.contentServerUrl
      ? createContentClient({ fetcher: fetch, url: options.contentServerUrl })
      : contentClient

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await contentClientToUser.fetchEntityById(entityId)
      } catch (error: any) {
        if (attempt === retries) {
          throw new Error(`Failed to fetch entity after ${retries} attempts: ${error.message}`)
        }
        await sleep(waitTime)
      }
    }
    throw new Error('Unexpected error: retry loop ended without throwing')
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

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const fetchedEntities: Entity[] = await contentClientToUse.fetchEntitiesByPointers(pointers)
        return fetchedEntities
      } catch (error: any) {
        if (attempt === retries) {
          throw new Error(`Failed to fetch entity after ${retries} attempts: ${error.message}`)
        }
        await sleep(waitTime)
      }
    }
    throw new Error('Unexpected error: retry loop ended without throwing')
  }

  return { getWearablesWithRarity, getEntityById, getEntitiesByPointers }
}
