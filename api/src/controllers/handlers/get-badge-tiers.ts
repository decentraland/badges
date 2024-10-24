import { IHttpServerComponent } from '@well-known-components/interfaces'
import { Badge, BadgeId, BadgeTier } from '@badges/common'
import { HandlerContextWithPath } from '../../types'
import { parseBadgeId } from '../../logic/utils'

type Response = {
  data: {
    tiers: BadgeTier[]
  }
}

export async function getBadgeTiersHandler(
  context: Pick<HandlerContextWithPath<'badgeService', '/badges/:id'>, 'url' | 'components' | 'params'>
): Promise<IHttpServerComponent.IResponse> {
  const { badgeService } = context.components
  const badgeId = context.params.id

  const parsedBadgeId: BadgeId | undefined = parseBadgeId(badgeId)

  if (!parsedBadgeId) {
    return {
      status: 404,
      body: {
        error: 'Badge not found'
      }
    }
  }

  const badge: Badge = badgeService.getBadge(parsedBadgeId)

  return {
    body: {
      data: {
        tiers: badge.tiers || []
      }
    } as Response
  }
}
