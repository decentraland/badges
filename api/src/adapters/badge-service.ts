import { EthAddress } from '@dcl/schemas'
import { AppComponents, BadgesProgresses, IBadgeService } from '../types'
import { Badge, BadgeId, badges, BadgeTier, UserBadge } from '@badges/common'

export function createBadgeService({ db }: Pick<AppComponents, 'db'>): IBadgeService {
  function getBadge(id: BadgeId): Badge {
    // we assert the value because if BadgeId exists
    // the badge should be already be added to the badges map
    return badges.get(id)!
  }

  function getAllBadges(): Badge[] {
    return Array.from(badges.values())
  }

  async function getUserStates(address: EthAddress) {
    return db.getAllUserProgresses(address)
  }

  async function getUserStateFor(badgeId: BadgeId, userAddress: EthAddress): Promise<UserBadge | undefined> {
    return db.getUserProgressFor(badgeId, userAddress)
  }

  function calculateUserProgress(allBadges: Badge[], userProgresses: UserBadge[]): BadgesProgresses {
    const badgesProgresses: BadgesProgresses = allBadges.reduce(
      (accumulator, badge) => {
        const isTierBadge = badge.tiers && badge.tiers.length > 0
        const badgeProgress = userProgresses.find((userBadge) => userBadge.badge_id === badge.id) || {
          badge_id: badge.id,
          progress: { steps: 0 },
          achieved_tiers: isTierBadge ? [] : undefined,
          completed_at: undefined
        }

        const tierProgress = isTierBadge ? getCurrentTierProgress(badge, badgeProgress) : undefined
        const calculatedNextTarget =
          !!tierProgress?.nextTier && isTierBadge ? tierProgress.nextTier.criteria.steps : badge.criteria.steps

        if (badgeProgress.completed_at || tierProgress?.currentTier) {
          accumulator.achieved.push({
            id: badge.id,
            name: badge.name,
            description: badge.description,
            category: badge.category,
            isTier: !!isTierBadge,
            completedAt: badgeProgress.completed_at,
            progress: {
              stepsDone: badgeProgress.progress.steps,
              nextStepsTarget: badgeProgress.completed_at ? null : calculatedNextTarget,
              totalStepsTarget: isTierBadge
                ? badge.tiers![badge.tiers!.length - 1].criteria.steps
                : badge.criteria.steps,
              lastCompletedTierAt: isTierBadge ? badgeProgress.achieved_tiers?.pop()?.completed_at : null,
              lastCompletedTierName: isTierBadge ? tierProgress?.currentTier?.tierName : null,
              lastCompletedTierImage: isTierBadge ? tierProgress?.currentTier?.image : null
            }
          })
        } else {
          accumulator.notAchieved.push({
            id: badge.id,
            name: badge.name,
            description: badge.description,
            category: badge.category,
            isTier: !!isTierBadge,
            completedAt: null,
            progress: {
              stepsDone: badgeProgress.progress.steps,
              nextStepsTarget: isTierBadge ? badge.tiers![0].criteria.steps : badge.criteria.steps,
              totalStepsTarget: isTierBadge
                ? badge.tiers![badge.tiers!.length - 1].criteria.steps
                : badge.criteria.steps
            }
          })
        }

        return accumulator
      },
      { achieved: [] as any, notAchieved: [] as any }
    )

    return badgesProgresses
  }

  function getCurrentTierProgress(
    badge: Badge,
    userProgress: Pick<UserBadge, 'achieved_tiers'>
  ): { nextTier: BadgeTier | undefined; currentTier: BadgeTier | undefined } {
    const lastAccomplishedTarget = userProgress.achieved_tiers!.length
      ? userProgress.achieved_tiers![userProgress.achieved_tiers!.length - 1]
      : undefined

    const currentAchievedTier = lastAccomplishedTarget
      ? badge.tiers!.find((tier) => tier.tierId === lastAccomplishedTarget.tier_id)
      : undefined

    const nextTierToAccomplish = lastAccomplishedTarget
      ? badge.tiers![badge.tiers!.findIndex((tier) => tier.tierId === lastAccomplishedTarget.tier_id) + 1]
      : badge.tiers![0]

    return { nextTier: nextTierToAccomplish, currentTier: currentAchievedTier }
  }

  return {
    getBadge,
    getAllBadges,
    getUserStates,
    getUserStateFor,
    calculateUserProgress
  }
}
