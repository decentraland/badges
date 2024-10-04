import { Badge, UserBadge } from '@badges/common'
import { EthAddress } from '@dcl/schemas'
import { getSortedItems, tryToGetAchievedTiers, tryToGetCompletedAt } from '../utils'

function validateEmoteCreatorBackfillData(data: {
  progress: {
    emotesPublished: {
      createdAt: number
      itemId: string
    }[]
  }
}): boolean {
  if (!Array.isArray(data.progress.emotesPublished)) return false
  if (!data.progress.emotesPublished.every((emote: any) => Number.isInteger(emote.createdAt))) return false
  if (!data.progress.emotesPublished.every((emote: any) => typeof emote.itemId === 'string')) return false

  return true
}

export function mergeEmoteCreatorProgress(
  userAddress: EthAddress,
  currentUserProgress: UserBadge | undefined,
  badge: Badge,
  backfillData: any
): UserBadge {
  const isValid = validateEmoteCreatorBackfillData(backfillData)
  if (!badge || !isValid) {
    throw new Error(`Failed while processing back-fill. Badge: ${JSON.stringify(badge)}. User: ${userAddress}.`)
  }

  const userProgress = currentUserProgress || {
    user_address: userAddress,
    badge_id: backfillData.badgeId,
    completed_at: undefined,
    progress: {
      steps: 0,
      published_emotes: []
    },
    achieved_tiers: []
  }

  const sortedPublications = getSortedItems(
    [...userProgress.progress.published_emotes, ...backfillData.progress.emotesPublished],
    'itemId',
    'createdAt'
  )

  userProgress.progress = {
    steps: sortedPublications.length,
    published_emotes: sortedPublications
  }

  const achievedTiers = tryToGetAchievedTiers(badge, userProgress, sortedPublications, 'createdAt')
  if (achievedTiers.length > 0) {
    userProgress.achieved_tiers = achievedTiers
  }

  const completedAt = tryToGetCompletedAt(badge, userProgress, sortedPublications, 'createdAt')
  if (completedAt) {
    userProgress.completed_at = completedAt
  }

  return userProgress
}
