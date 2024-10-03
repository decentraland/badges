import { Badge, UserBadge } from '@badges/common'
import { EthAddress } from '@dcl/schemas'

type BackfillData = {
  progress: {
    usedEmotesCount: number
    achievedTier: {
      tierId: string
      completedAt: number
    }[]
  }
}

function validateMovesMasterBackfillData(data: BackfillData): boolean {
  return (
    Number.isInteger(data.progress.usedEmotesCount) &&
    Array.isArray(data.progress.achievedTier) &&
    data.progress.achievedTier.every((tier) => typeof tier.tierId === 'string' && Number.isInteger(tier.completedAt))
  )
}

export function mergeMovesMasterProgress(
  userAddress: EthAddress,
  _: UserBadge | undefined,
  badge: Badge,
  backfillData: BackfillData
): UserBadge {
  if (!badge || !validateMovesMasterBackfillData(backfillData)) {
    throw new Error(`Failed while processing backfill. Badge: ${JSON.stringify(badge)}. User: ${userAddress}.`)
  }

  const userProgress: UserBadge = {
    user_address: userAddress,
    badge_id: badge.id,
    completed_at: undefined,
    progress: {
      steps: backfillData.progress.usedEmotesCount,
      last_used_emote_timestamp: Date.now(), // TODO: normalize to minute start?
      last_day_used_emotes_timestamps: [] // TODO: do we need to populate this so handler can catch-up?
    },
    achieved_tiers: []
  }

  try {
    backfillData.progress.achievedTier.forEach((tier) => {
      const achievedTier = badge.tiers?.find((badgeTier) => badgeTier.tierId === tier.tierId)

      if (!achievedTier) {
        throw new Error('tierId received is invalid, breaking backfill')
      }

      userProgress.achieved_tiers!.push({
        tier_id: tier.tierId,
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
