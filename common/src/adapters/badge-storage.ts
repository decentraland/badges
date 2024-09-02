import { IConfigComponent } from '@well-known-components/interfaces'
import { Badge, BadgeId, badges } from '../types'
import { aggregateAssetsFor } from '../utils/assets-aggregator'

export type BadgeStorageComponents = {
  config: IConfigComponent
}

export type IBadgeStorage = {
  getBadges(): Map<BadgeId, Badge>
}

export async function createBadgeStorage({ config }: BadgeStorageComponents): Promise<IBadgeStorage> {
  const CDN_URL = await config.requireString('CDN_HOST')

  const aggregatedBadges = aggregateAssetsFor(badges, CDN_URL)

  function getBadges(): Map<BadgeId, Badge> {
    return aggregatedBadges
  }

  return { getBadges }
}
