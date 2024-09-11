import { Badge, UserBadge } from '@badges/common'
import { EthAddress } from '@dcl/schemas'

// Timestamps already normalized to the start of the minute
type BackfillData = {
  progress: {
    lastUsedEmoteTimestamp: number
    usedEmotesCount: number
    lastDayUsedEmotesTimestamps: number[]
  }
}

const MINUTES_IN_DAY = 1440

function validateMovesMasterBackfillData(data: BackfillData): boolean {
  return (
    Number.isInteger(data.progress.lastUsedEmoteTimestamp) &&
    Number.isInteger(data.progress.usedEmotesCount) &&
    Array.isArray(data.progress.lastDayUsedEmotesTimestamps) &&
    data.progress.lastDayUsedEmotesTimestamps.every((timestamp) => Number.isInteger(timestamp))
  )
}

export function mergeMovesMasterProgress(
  userAddress: EthAddress,
  currentUserProgress: UserBadge | undefined,
  badge: Badge,
  backfillData: BackfillData
): UserBadge {
  if (!badge || !validateMovesMasterBackfillData(backfillData)) {
    throw new Error(`Failed while processing backfill. Badge: ${JSON.stringify(badge)}. User: ${userAddress}.`)
  }

  const userProgress: UserBadge = currentUserProgress || {
    user_address: userAddress,
    badge_id: badge.id,
    completed_at: undefined,
    progress: {
      steps: 0,
      last_used_emote_timestamp: 0,
      last_day_used_emotes_timestamps: []
    },
    achieved_tiers: []
  }

  if (backfillData.progress.usedEmotesCount === 0) {
    return userProgress
  }

  if (backfillData.progress.lastDayUsedEmotesTimestamps.length === 0) {
    return userProgress
  }

  try {
    const userProgressLastDayUsedEmotesTimestampsSet = new Set(userProgress.progress.last_day_used_emotes_timestamps)

    const newEmotesUsed = backfillData.progress.lastDayUsedEmotesTimestamps.filter(
      (timestamp) => !userProgressLastDayUsedEmotesTimestampsSet.has(timestamp)
    )

    const lastDayUsedEmoteTimestamps = Array.from(
      new Set([...userProgress.progress.last_day_used_emotes_timestamps, ...newEmotesUsed])
    )
      .sort((a, b) => a - b)
      .slice(-MINUTES_IN_DAY)

    userProgress.progress.steps += newEmotesUsed.length
    userProgress.progress.last_used_emote_timestamp = backfillData.progress.lastUsedEmoteTimestamp
    userProgress.progress.last_day_used_emotes_timestamps = lastDayUsedEmoteTimestamps

    const newTiers = badge.tiers!.filter((tier) => userProgress.progress.steps >= tier.criteria.steps)

    newTiers.forEach((tier) => {
      const userAlreadyHasTier = userProgress.achieved_tiers!.find(
        (achievedTier) => achievedTier.tier_id === tier.tierId
      )

      const tierAchievedAt = backfillData.progress.lastUsedEmoteTimestamp || Date.now()

      const completedAt = userAlreadyHasTier
        ? Math.min(userAlreadyHasTier.completed_at, tierAchievedAt)
        : tierAchievedAt

      if (!userAlreadyHasTier) {
        userProgress.achieved_tiers!.push({ tier_id: tier.tierId, completed_at: completedAt })
      }
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
