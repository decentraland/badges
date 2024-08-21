import { IHttpServerComponent } from '@well-known-components/interfaces'
import { Badge, BadgeId, UserBadge } from '@badges/common'
import { HandlerContextWithPath } from '../../types'

function parseBadgeId(id: string): BadgeId | undefined {
  if (Object.values(BadgeId).includes(id as BadgeId)) {
    return id as BadgeId
  }
  return undefined
}

export async function getUserBadgeDetailsHandler(
  context: Pick<HandlerContextWithPath<'badgeService', '/users/:address/badges/:id'>, 'url' | 'components' | 'params'>
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
  const userState: UserBadge | undefined = await badgeService.getUserStateFor(parsedBadgeId, context.params.address)
  const userProgress = badgeService.calculateProgress(badge, userState)

  return {
    body: {
      data: {
        badge: {
          ...badge,
          isTier: badge.tiers && badge.tiers.length > 0
        },
        progress: {
          ...userProgress,
          completedAt: userState?.completed_at
        }
      }
    }
  }
}
