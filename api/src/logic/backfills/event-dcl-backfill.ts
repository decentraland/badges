import { Badge, BadgeId, BadgeTier, UserBadge } from '@badges/common'
import { TierEventType } from '@badges/common/src/types/tiers'
import { EthAddress } from '@dcl/schemas'
import { tryToGetAchievedTiers, validateEventTiers } from '../utils'

function validateEventDCLProgress(
  badgeTiers: BadgeTier[],
  data: {
    progress: {
      steps: number
      tier: TierEventType
    }
  }
): boolean {
  if (!Number.isInteger(data.progress.steps)) return false

  return validateEventTiers(data.progress.tier, badgeTiers)
}

export function mergeEventDCLProgress(
  userAddress: EthAddress,
  currentUserProgress: UserBadge | undefined,
  badge: Badge,
  backfillData: { badgeId: BadgeId; progress: { steps: number; tier: TierEventType } }
): UserBadge {
  const isValid = validateEventDCLProgress(badge.tiers!, backfillData)
  if (!badge || !isValid) {
    throw new Error(`Failed while processing back-fill. Badge: ${JSON.stringify(backfillData)}. User: ${userAddress}.`)
  }

  const userProgress = currentUserProgress || {
    user_address: userAddress,
    badge_id: backfillData.badgeId,
    completed_at: undefined,
    progress: {
      steps: 0
    },
    achieved_tiers: []
  }

  userProgress.progress = {
    steps: backfillData.progress.steps,
    tier: backfillData.progress.tier
  }

  const achievedTiers = tryToGetAchievedTiers(badge, userProgress, [backfillData.progress], 'steps')
  if (backfillData.progress.steps <= userProgress.progress.steps || achievedTiers.length > 0) {
    return userProgress
  }

  if (achievedTiers.length > 0) {
    userProgress.achieved_tiers = achievedTiers.map((tier) => {
      const userAlreadyHadThisTier = userProgress.achieved_tiers!.find(
        (achievedTier) => achievedTier.tier_id === tier.tier_id
      )

      return {
        tier_id: tier.tier_id,
        completed_at: userAlreadyHadThisTier ? userAlreadyHadThisTier.completed_at : Date.now()
      }
    })
  }

  return userProgress
}
