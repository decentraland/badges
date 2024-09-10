import { Badge, UserBadge } from '@badges/common'
import { EthAddress } from '@dcl/schemas'

type UsedEmote = {
  sentAt: number
}

type BackfillData = {
  progress: {
    emotesUsed: UsedEmote[]
  }
}

function validateMovesMasterBackfillData(data: BackfillData): boolean {
  return (
    Array.isArray(data.progress.emotesUsed) && data.progress.emotesUsed.every((emote) => Number.isInteger(emote.sentAt))
  )
}

function usedInTheLastMinute(emote: UsedEmote, previousEmote: UsedEmote): boolean {
  return emote.sentAt - previousEmote.sentAt <= 60000
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
    progress: { steps: 0 },
    achieved_tiers: []
  }

  if (backfillData.progress.emotesUsed.length === 0) {
    return userProgress
  }

  try {
    const sortedUsedEmotes = backfillData.progress.emotesUsed.sort((a, b) => a.sentAt - b.sentAt)

    let numberOfEmotesUsedPerMinute = 0
    const emoteUsedAt: number[] = []

    // Count valid emotes used (1/min) and store the timestamp of the emote used in each minute
    sortedUsedEmotes.forEach((emote, index) => {
      if (index === 0 || !usedInTheLastMinute(emote, sortedUsedEmotes[index - 1])) {
        numberOfEmotesUsedPerMinute++
        emoteUsedAt.push(emote.sentAt)
      }
    })

    userProgress.progress.steps += numberOfEmotesUsedPerMinute

    const newTiers = badge.tiers!.filter((tier) => userProgress.progress.steps >= tier.criteria.steps)

    newTiers.forEach((tier) => {
      const userAlreadyHasTier = userProgress.achieved_tiers!.find(
        (achievedTier) => achievedTier.tier_id === tier.tierId
      )

      const lastEmoteUsedAt = emoteUsedAt[tier.criteria.steps - 1] || Date.now()

      const completedAt = userAlreadyHasTier
        ? Math.min(userAlreadyHasTier.completed_at, lastEmoteUsedAt)
        : lastEmoteUsedAt

      if (!userAlreadyHasTier) {
        userProgress.achieved_tiers!.push({ tier_id: tier.tierId, completed_at: completedAt })
      }
    })

    if (userProgress.achieved_tiers!.length === badge.tiers!.length) {
      const userAlreadyCompletedAt = userProgress.completed_at
      const tierAchievedAt = emoteUsedAt[badge.tiers!.length - 1]

      userProgress.completed_at = Math.min(userAlreadyCompletedAt || Date.now(), tierAchievedAt)
    }

    return userProgress
  } catch (error) {
    console.error(`Error processing user ${userAddress}:`, error)
    throw error
  }
}
