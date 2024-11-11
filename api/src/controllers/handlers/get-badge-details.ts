import { IHttpServerComponent } from '@well-known-components/interfaces'
import { Badge, BadgeId } from '@badges/common'
import { HandlerContextWithPath } from '../../types'
import { parseBadgeId } from '../../logic/utils'

type Response = {
  data: {
    badge: Badge
  }
}

export async function getBadgeDetailsHandler(
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
        badge
      }
    } as Response
  }
}
