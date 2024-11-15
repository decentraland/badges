import { Entity } from '@dcl/schemas'
import { createContentClient, ContentClient } from 'dcl-catalyst-client'
import { getCatalystServersFromCache } from 'dcl-catalyst-client/dist/contracts-snapshots'
import { AppComponents, IBadgeContext } from '../types'
import { getTokenIdAndAssetUrn, isExtendedUrn, parseUrn } from '@dcl/urn-resolver'
import { retry } from '../utils/retryer'
import { shuffleArray } from '../utils/array'

type Options = {
  retries?: number
  waitTime?: number
  contentServerUrl?: string
}

const L1_MAINNET = 'mainnet'
const L1_TESTNET = 'sepolia'

export async function createBadgeContext({
  fetch,
  config
}: Pick<AppComponents, 'fetch' | 'config'>): Promise<IBadgeContext> {
  const loadBalancer = await config.requireString('CATALYST_CONTENT_URL_LOADBALANCER')
  const contractNetwork = (await config.getString('ENV')) === 'prod' ? L1_MAINNET : L1_TESTNET

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

  function getContentClientOrDefault(contentServerUrl?: string): ContentClient {
    return contentServerUrl
      ? createContentClient({ fetcher: fetch, url: contentServerUrl })
      : createContentClient({
          fetcher: fetch,
          url: loadBalancer
        })
  }

  function rotateContentServerClient<T>(
    executeClientRequest: (client: ContentClient) => Promise<T>,
    contentServerUrl?: string
  ) {
    const catalystServers = shuffleArray(getCatalystServersFromCache(contractNetwork)).map((server) => server.address)
    let contentClientToUse: ContentClient = getContentClientOrDefault(contentServerUrl)

    return (attempt: number): Promise<T> => {
      if (attempt > 1 && catalystServers.length > 0) {
        const [catalystServerUrl] = catalystServers.splice(attempt % catalystServers.length, 1)
        contentClientToUse = getContentClientOrDefault(catalystServerUrl)
      }

      return executeClientRequest(contentClientToUse)
    }
  }

  async function getEntityById(entityId: string, options: Options = {}): Promise<Entity> {
    const { retries = 3, waitTime = 750, contentServerUrl } = options
    const executeClientRequest = rotateContentServerClient(
      (contentClientToUse) => contentClientToUse.fetchEntityById(entityId),
      contentServerUrl
    )

    return retry(executeClientRequest, retries, waitTime)
  }

  async function getEntitiesByPointers(pointers: string[], options: Options = {}): Promise<Entity[]> {
    const { retries = 3, waitTime = 300, contentServerUrl } = options
    const executeClientRequest = rotateContentServerClient(
      (contentClientToUse) => contentClientToUse.fetchEntitiesByPointers(pointers),
      contentServerUrl
    )
    return retry(executeClientRequest, retries, waitTime)
  }

  return { getWearablesWithRarity, getEntityById, getEntitiesByPointers }
}
