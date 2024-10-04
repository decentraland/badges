import { Badge, UserBadge } from '@badges/common'
import { EthAddress } from '@dcl/schemas'
import { getUniqueSortedItems, tryToGetAchievedTiers, tryToGetCompletedAt } from '../utils'

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

  const uniqueSortedPublications = getUniqueSortedItems(
    [...userProgress.progress.published_emotes, ...backfillData.progress.emotesPublished],
    'itemId',
    'createdAt'
  )

  userProgress.progress = {
    steps: uniqueSortedPublications.length,
    published_emotes: uniqueSortedPublications
  }

  const achievedTiers = tryToGetAchievedTiers(badge, userProgress, uniqueSortedPublications, 'createdAt')
  if (achievedTiers.length > 0) {
    userProgress.achieved_tiers = achievedTiers
  }

  const completedAt = tryToGetCompletedAt(badge, userProgress, uniqueSortedPublications, 'createdAt')
  if (completedAt) {
    userProgress.completed_at = completedAt
  }

  return userProgress
}
