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

  function calculateUserProgress(
    allBadges: Badge[],
    userProgresses: UserBadge[],
    options: { includeNotAchievedBadges: boolean; unlockedBadgesLimit: number | undefined } = {
      includeNotAchievedBadges: false,
      unlockedBadgesLimit: undefined
    }
  ): BadgesProgresses {
    const badgesProgresses: BadgesProgresses = allBadges.reduce(
      (accumulator, badge) => {
        const badgeProgress = userProgresses.find((userBadge) => userBadge.badge_id === badge.id)

        const isTierBadge = badge.tiers && badge.tiers.length > 0
        if (
          badgeProgress &&
          (badgeProgress.completed_at || (isTierBadge && badgeProgress.achieved_tiers!.length > 0)) &&
          !!options.unlockedBadgesLimit &&
          accumulator.achieved.length < options.unlockedBadgesLimit
        ) {
          const nextTierCriteria = isTierBadge ? calculateNextTierCriteriaTarget(badge, badgeProgress) : undefined

          const calculatedNextTarget =
            !!nextTierCriteria && isTierBadge ? nextTierCriteria.criteria.steps : badge.criteria.steps

          accumulator.achieved.push({
            id: badge.id,
            name: badge.name,
            description: badge.description,
            category: badge.category,
            isTier: !!isTierBadge,
            completedAt: badgeProgress.completed_at,
            progress: {
              stepsDone: badgeProgress.progress.steps,
              stepsTarget: badgeProgress.completed_at ? null : calculatedNextTarget
            },
            tiers: isTierBadge
              ? badge.tiers?.map((tier) => {
                  const achievedTier = badgeProgress.achieved_tiers!.find(
                    (achievedTier) => achievedTier.tier_id === tier.tierId
                  )
                  return {
                    tierId: tier.tierId,
                    name: tier.tierName,
                    description: tier.description,
                    criteria: tier.criteria,
                    completedAt: achievedTier?.completed_at
                  }
                })
              : []
          })
        } else if (options.includeNotAchievedBadges) {
          accumulator.notAchieved.push({
            id: badge.id,
            name: badge.name,
            description: badge.description,
            category: badge.category,
            isTier: !!isTierBadge,
            completedAt: null,
            progress: {
              stepsDone: badgeProgress?.progress.steps || 0,
              stepsTarget: isTierBadge ? badge.tiers![0].criteria.steps : badge.criteria.steps
            },
            tiers: isTierBadge ? badge.tiers : []
          })
        }

        return accumulator
      },
      { achieved: [] as any, notAchieved: [] as any }
    )

    return badgesProgresses
  }

  function calculateNextTierCriteriaTarget(badge: Badge, userProgress: UserBadge): BadgeTier | undefined {
    const lastAccomplishedTarget = userProgress.achieved_tiers!.length
      ? userProgress.achieved_tiers![userProgress.achieved_tiers!.length - 1]
      : undefined

    const nextTierToAccomplish = lastAccomplishedTarget
      ? badge.tiers![badge.tiers!.findIndex((tier) => tier.tierId === lastAccomplishedTarget.tier_id) + 1]
      : badge.tiers![0]

    return nextTierToAccomplish
  }

  return {
    getBadge,
    getAllBadges,
    getUserStates,
    calculateUserProgress
  }
}
