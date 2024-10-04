import { Badge, UserBadge } from '@badges/common'
import { EthAddress } from '@dcl/schemas'

type BackfillData = {
  progress: {
    usedEmotesCount: number
    lastEmoteTriggeredAt: number
    achievedTiers: {
      steps: number
      completedAt: number
    }[]
  }
}

function validateMovesMasterBackfillData(data: BackfillData): boolean {
  return (
    Number.isInteger(data.progress.usedEmotesCount) &&
    Array.isArray(data.progress.achievedTiers) &&
    data.progress.achievedTiers.every(
      (tier) =>
        (Number.isInteger(tier.steps) || Number.isFinite(Number(tier.steps))) && Number.isInteger(tier.completedAt)
    ) &&
    Number.isInteger(data.progress.lastEmoteTriggeredAt) &&
    data.progress.lastEmoteTriggeredAt > 0
  )
}

export function mergeMovesMasterProgress(
  userAddress: EthAddress,
  _: UserBadge | undefined,
  badge: Badge,
  backfillData: BackfillData
): UserBadge {
  if (!badge || !validateMovesMasterBackfillData(backfillData)) {
    throw new Error(`Failed while processing backfill. Badge: ${JSON.stringify(backfillData)}. User: ${userAddress}.`)
  }

  const userProgress: UserBadge = {
    user_address: userAddress,
    badge_id: badge.id,
    completed_at: undefined,
    progress: {
      steps: backfillData.progress.usedEmotesCount,
      last_used_emote_timestamp: backfillData.progress.lastEmoteTriggeredAt,
      last_day_used_emotes_timestamps: []
    },
    achieved_tiers: []
  }

  try {
    backfillData.progress.achievedTiers.forEach((tier) => {
      const achievedTier = badge.tiers?.find((badgeTier) => badgeTier.criteria.steps === Number(tier.steps))

      if (!achievedTier) {
        throw new Error('tierId received is invalid, breaking backfill')
      }

      userProgress.achieved_tiers!.push({
        tier_id: achievedTier.tierId,
        completed_at: tier.completedAt
      })
    })

    if (userProgress.achieved_tiers!.length === badge.tiers!.length) {
      userProgress.completed_at = Date.now()
    }

    return userProgress
  } catch (error) {
    console.error(`Error processing user ${userAddress}:`, error)
    throw error
  }
}
