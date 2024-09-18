import { Badge, BadgeId, UserBadge } from '@badges/common'
import { EthAddress } from '@dcl/schemas'

type BackfillData = {
  badgeId: BadgeId
  progress: {
    profiles_visited: {
      profile_address: string
      visited_at: number
    }[]
  }
}

function validateSocialButterflyBackfillData(data: BackfillData): boolean {
  return (
    Array.isArray(data.progress.profiles_visited) &&
    data.progress.profiles_visited.every(
      (visit) => typeof visit.profile_address === 'string' && Number.isInteger(visit.visited_at)
    )
  )
}

function initUserProgress(userAddress: EthAddress, badgeId: BadgeId): Omit<UserBadge, 'updated_at'> {
  return {
    user_address: userAddress,
    badge_id: badgeId,
    completed_at: undefined,
    progress: {
      steps: 0,
      profiles_visited: []
    },
    achieved_tiers: []
  }
}

export function mergeSocialButterflyProgress(
  userAddress: EthAddress,
  currentUserProgress: UserBadge | undefined,
  badge: Badge,
  backfillData: BackfillData
): UserBadge {
  if (!validateSocialButterflyBackfillData(backfillData)) {
    throw new Error(`Invalid backfill data for user: ${userAddress}. Badge: ${badge?.id || 'Unknown'}.`)
  }

  const userProgress = currentUserProgress || initUserProgress(userAddress, backfillData.badgeId)

  try {
    const allVisits = [...userProgress.progress.profiles_visited, ...backfillData.progress.profiles_visited]

    const profileVisitMap = allVisits.reduce((map, visit) => {
      const currentVisitTime = map.get(visit.profile_address) || Date.now()
      map.set(visit.profile_address, Math.min(currentVisitTime, visit.visited_at))
      return map
    }, new Map<string, number>())

    const mergedVisits = Array.from(profileVisitMap, ([profile_address, visited_at]) => ({
      profile_address,
      visited_at
    }))

    const sortedVisits = mergedVisits.sort((a, b) => a.visited_at - b.visited_at)

    userProgress.progress = {
      steps: sortedVisits.length,
      profiles_visited: sortedVisits
    }

    userProgress.achieved_tiers = badge.tiers!.map((tier) => {
      const visitForTier = sortedVisits[tier.criteria.steps - 1]
      const userAlreadyHasTier = userProgress.achieved_tiers?.find((t) => t.tier_id === tier.tierId)

      const completedAt = userAlreadyHasTier
        ? Math.min(userAlreadyHasTier.completed_at, visitForTier?.visited_at || Date.now())
        : visitForTier?.visited_at || Date.now()

      return {
        tier_id: tier.tierId,
        completed_at: completedAt
      }
    })

    if (userProgress.achieved_tiers!.length === badge.tiers!.length) {
      const lastTier = badge.tiers![badge.tiers!.length - 1]
      const lastTierVisit = sortedVisits[lastTier.criteria.steps - 1]

      userProgress.completed_at = lastTierVisit
        ? Math.min(userProgress.completed_at || Infinity, lastTierVisit.visited_at)
        : Date.now()
    }

    return userProgress
  } catch (error) {
    console.error(`Error processing backfill for user ${userAddress}:`, error)
    throw error
  }
}
