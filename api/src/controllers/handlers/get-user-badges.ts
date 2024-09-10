import { IHttpServerComponent } from '@well-known-components/interfaces'
import { Badge, UserBadge } from '@badges/common'
import { HandlerContextWithPath } from '../../types'

type BadgeProgress = {
  id: number
  name: string
  description: string
  category: string
  isTier: boolean
  completedAt: Date | null
  progress: {
    stepsDone: number
    nextStepsTarget: number | null
    totalStepsTarget: number
    lastCompletedTierAt: Date | null
    lastCompletedTierName: string | null
    lastCompletedTierImage: string | null
  }
}

export type BadgesProgresses = {
  achieved: BadgeProgress[]
  notAchieved: BadgeProgress[]
}

type UserBadgesProgress = {
  data: BadgesProgresses
}

export async function getUserBadgesHandler(
  context: Pick<HandlerContextWithPath<'badgeService', '/users/:address/badges'>, 'url' | 'components' | 'params'>
): Promise<IHttpServerComponent.IResponse> {
  const { badgeService } = context.components
  const address = context.params.address
  const shouldIncludeNotAchieved = context.url.searchParams.get('includeNotAchieved') === 'true'

  const allBadges: Badge[] = badgeService.getAllBadges()
  const achievedBadges: UserBadge[] = await badgeService.getUserStates(address)
  const badgesProgresses: BadgesProgresses = badgeService.calculateUserProgress(
    allBadges,
    achievedBadges,
    shouldIncludeNotAchieved
  )

  return {
    body: {
      data: badgesProgresses
    } as UserBadgesProgress
  }
}
