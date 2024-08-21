import { IHttpServerComponent } from '@well-known-components/interfaces'
import { Badge, UserBadge } from '@badges/common'
import { BadgesProgresses, HandlerContextWithPath } from '../../types'
import { EthAddress } from '@dcl/schemas'

type UserBadgesProgress = {
  data: BadgesProgresses
}

function withHATEOAS(badgesProgresses: BadgesProgresses, userAddress: EthAddress): BadgesProgresses {
  badgesProgresses.achieved = badgesProgresses.achieved.map((achievedBadge) => ({
    ...achievedBadge,
    _links: {
      self: {
        href: `/badges/${achievedBadge.id}`
      }
    }
  }))

  badgesProgresses.notAchieved = badgesProgresses.notAchieved.map((notAchievedBadge) => ({
    ...notAchievedBadge,
    _links: {
      self: {
        href: `/users/${userAddress}/badges/${notAchievedBadge.id}`
      }
    }
  }))

  return badgesProgresses
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
      data: withHATEOAS(badgesProgresses, address)
    } as UserBadgesProgress
  }
}
