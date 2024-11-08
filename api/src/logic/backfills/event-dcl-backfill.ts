import { Badge, BadgeId, BadgeTier, UserBadge } from '@badges/common'
import { TierEventType } from '@badges/common/src/types/tiers'
import { EthAddress } from '@dcl/schemas'
import { tryToGetAchievedTiers, tryToGetCompletedAt, validateEventTiers, validateUserProgress } from '../utils'

function validateEventDCLProgress(
  badgeTiers: BadgeTier[],
  progress: {
    steps: number
    tiers: {
      id: TierEventType
      at: number
    }[]
  }
): boolean {
  if (!Number.isInteger(progress.steps)) return false

  return validateEventTiers(progress.tiers, badgeTiers)
}

export function mergeEventDCLProgress(
  userAddress: EthAddress,
  currentUserProgress: UserBadge | undefined,
  badge: Badge,
  backfillData: {
    badgeId: BadgeId
    progress: {
      steps: number
      tiers: {
        id: TierEventType
        at: number
      }[]
    }
  }
): UserBadge {
  const isValid = validateEventDCLProgress(badge.tiers!, backfillData.progress)
  if (!badge || !isValid) {
    throw new Error(`Failed while processing back-fill. Badge: ${JSON.stringify(backfillData)}. User: ${userAddress}.`)
  }

  const userProgress = currentUserProgress || {
    user_address: userAddress,
    badge_id: backfillData.badgeId,
    completed_at: undefined,
    progress: {
      steps: 0,
      tiers: []
    },
    achieved_tiers: []
  }

  const achievedTiers = tryToGetAchievedTiers(badge, userProgress, backfillData.progress.tiers, 'at')

  achievedTiers.forEach((tier) => {
    const existingTier = userProgress.achieved_tiers?.find((t) => t.tier_id === tier.tier_id)
    if (!existingTier) {
      userProgress.achieved_tiers?.push(tier)
    } else {
      existingTier.completed_at = Math.min(existingTier.completed_at, tier.completed_at)
    }
  })

  userProgress.achieved_tiers?.sort((a, b) => a.completed_at - b.completed_at)

  userProgress.completed_at = tryToGetCompletedAt(badge, userProgress, backfillData.progress.tiers, 'at')

  const validation = validateUserProgress(userProgress, badge)
  if (!validation.ok) {
    throw new Error(
      `User progress validation failed: ${JSON.stringify(validation.errors)}. User: ${userAddress}. Badge: ${badge.id}`
    )
  }

  return userProgress
}
