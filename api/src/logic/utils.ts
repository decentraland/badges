import { Badge, BadgeId, UserBadge } from '@badges/common'

export function parseBadgeId(id: string): BadgeId | undefined {
  if (Object.values(BadgeId).includes(id as BadgeId)) {
    return id as BadgeId
  }
  return undefined
}

export function validateUserProgress(
  userProgress: UserBadge,
  badge: Badge | undefined
): { ok: boolean; errors: string[] } {
  const errors: string[] = []

  if (!badge) {
    errors.push('badge not found')
  }

  if (
    badge?.tiers &&
    userProgress.completed_at &&
    (!userProgress.achieved_tiers || userProgress.achieved_tiers.length !== badge.tiers.length)
  ) {
    errors.push('mismatch between badge tiers and achieved tiers')
  }

  if (!badge?.tiers && userProgress.completed_at && userProgress.progress.steps !== badge!.criteria.steps) {
    errors.push('mismatch between badge criteria and progress steps')
  }

  // validate that achieved tiers were correctly calculated
  if (!!badge?.tiers && userProgress.achieved_tiers && userProgress.achieved_tiers.length > 0) {
    userProgress.achieved_tiers?.forEach((achievedTier, i) => {
      const tierDefinition = badge.tiers!.find((tier) => tier.tierId === achievedTier.tier_id)

      if (!tierDefinition) {
        errors.push(`tier achieved ${achievedTier.tier_id} not found in badge tiers`)
        return
      }

      if (tierDefinition.criteria.steps > userProgress.progress.steps) {
        errors.push(`tier achieved ${achievedTier.tier_id} is higher than badge criteria`)
      }

      if (i > 0) {
        const previousTier = userProgress.achieved_tiers![i - 1]
        if (previousTier.completed_at > achievedTier.completed_at) {
          errors.push(`tier achieved ${achievedTier.tier_id} completed before previous tier`)
        }
      }
    })
  }

  return { ok: errors.length === 0, errors }
}
