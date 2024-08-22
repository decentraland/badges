import { IHttpServerComponent } from '@well-known-components/interfaces'
import { Badge, UserBadge } from '@badges/common'
import { BadgesProgresses, HandlerContextWithPath } from '../../types'

type UserBadgesProgress = {
  data: BadgesProgresses
}

export async function getUserBadgesHandler(
  context: Pick<HandlerContextWithPath<'badgeService', '/users/:address/badges'>, 'url' | 'components' | 'params'>
): Promise<IHttpServerComponent.IResponse> {
  const { badgeService } = context.components
  const address = context.params.address

  const allBadges: Badge[] = badgeService.getAllBadges()
  const achievedBadges: UserBadge[] = await badgeService.getUserStates(address)
  const badgesProgresses: BadgesProgresses = badgeService.calculateUserProgress(allBadges, achievedBadges)

  return {
    body: {
      data: badgesProgresses
    } as UserBadgesProgress
  }
}
