import { IHttpServerComponent } from '@well-known-components/interfaces'
import { Badge, BadgeId } from '@badges/common'
import { HandlerContextWithPath } from '../../types'

type Response = {
  data: {
    badge: Badge
  }
}

function parseBadgeId(id: string): BadgeId | undefined {
  if (Object.values(BadgeId).includes(id as BadgeId)) {
    return id as BadgeId
  }
  return undefined
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