import { BadgesProgresses, HandlerContextWithPath } from '../../types'
import { IHttpServerComponent } from '@well-known-components/interfaces'
import { Badge, UserBadge } from '@badges/common'

type UserBadgesProgress = {
  data: BadgesProgresses
}

export async function getUserBadgesHandler(
  context: Pick<HandlerContextWithPath<'badgeService' | 'logs', '/badges/:address'>, 'url' | 'components' | 'params'>
): Promise<IHttpServerComponent.IResponse> {
  const { badgeService, logs } = context.components
  const logger = logs.getLogger('get-user-badges-progress')

  const address = context.params.address

  logger.debug('Getting badges progress for user', { address })
  const allBadges: Badge[] = badgeService.getAllBadges()
  const achievedBadges: UserBadge[] = await badgeService.getUserStates(address)
  const badgesProgresses: BadgesProgresses = badgeService.calculateUserProgress(allBadges, achievedBadges)

  return {
    body: {
      data: badgesProgresses
    } as UserBadgesProgress
  }
}
