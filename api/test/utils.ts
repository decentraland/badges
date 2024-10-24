import { BadgeId, badges, Badge } from '@badges/common'

export function getExpectedAchievedBadge(
  badgeId: BadgeId,
  options: {
    steps: number
    isTier: boolean
    completed?: boolean
  }
) {
  const { steps, isTier, completed } = options
  const badge = badges.get(badgeId) as Badge
  const { id, name, description, category } = badge

  return {
    id,
    name,
    description,
    category,
    isTier,
    completedAt: completed ? expect.any(String) : null,
    assets: expect.any(Object),
    progress: {
      lastCompletedTierAt: isTier ? expect.any(Number) : null,
      lastCompletedTierImage: isTier ? expect.any(String) : null,
      lastCompletedTierName: isTier ? expect.any(String) : null,
      nextStepsTarget: completed ? null : expect.any(Number),
      stepsDone: steps,
      totalStepsTarget: isTier ? badge.tiers![badge.tiers!.length - 1].criteria.steps : badge.criteria.steps,
      ...(isTier
        ? {
            achieved_tiers: badge
              .tiers!.filter((tier) => steps >= tier.criteria.steps)
              .map((tier) => ({
                tier_id: tier.tierId,
                completed_at: expect.any(Number)
              }))
          }
        : undefined)
    }
  }
}

export function getExpectedNotAchievedBadges(allBadges: Badge[], achievedBadgesIds: BadgeId[]) {
  return allBadges
    .filter((badge) => !achievedBadgesIds.includes(badge.id))
    .map((badge) => getExpectedNotAchievedBadge(badge))
}

export function getExpectedNotAchievedBadge(badge: Badge) {
  const { id, name, description, category } = badge
  const isTier = !!badge.tiers && badge.tiers.length > 0

  return {
    id,
    name,
    description,
    category,
    isTier,
    completedAt: null,
    assets: expect.any(Object),
    progress: {
      stepsDone: 0,
      nextStepsTarget: isTier ? badge.tiers![0].criteria.steps : badge.criteria.steps,
      totalStepsTarget: isTier ? badge.tiers![badge.tiers!.length - 1].criteria.steps : badge.criteria.steps
    }
  }
}

// Return a partition of badge ids: [ [non-tiered badge ids], [tiered badge ids] ]
export function getBadgeIdsPartition(): [BadgeId[], BadgeId[]] {
  const tieredBadgeIds = Object.values(BadgeId).filter((id) => !!badges.get(id).tiers)
  const nonTieredBadgeIds = Object.values(BadgeId).filter((id) => !badges.get(id).tiers)

  return [nonTieredBadgeIds, tieredBadgeIds]
}
