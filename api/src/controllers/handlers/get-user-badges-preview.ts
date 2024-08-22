import { IHttpServerComponent } from '@well-known-components/interfaces'
import { HandlerContextWithPath } from '../../types'
import { BadgeId } from '@badges/common'

export async function getUserBadgesPreviewHandler(
  context: Pick<HandlerContextWithPath<'badgeService', '/users/:address/preview'>, 'url' | 'components' | 'params'>
): Promise<IHttpServerComponent.IResponse> {
  const { badgeService } = context.components
  const address = context.params.address

  const latestUserAchievedBadges = await badgeService.getLatestAchievedBadges(address)
  const latestUserAchievedBadgesDefinitions = badgeService.getBadges(
    latestUserAchievedBadges.map((badge) => badge.badge_id as BadgeId)
  )

  return {
    body: {
      data: {
        latestAchievedBadges: latestUserAchievedBadgesDefinitions.map((badgeDefinition) => ({
          id: badgeDefinition.id,
          name: badgeDefinition.name,
          image: badgeDefinition.image
        }))
      }
    }
  }
}
