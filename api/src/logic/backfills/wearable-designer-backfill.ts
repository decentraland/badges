import { Badge, UserBadge } from '@badges/common'
import { EthAddress } from '@dcl/schemas'
import { getSortedItems, tryToGetAchievedTiers, tryToGetCompletedAt } from '../utils'

function validateWearableDesignerBackfillData(data: {
  progress: {
    wearablesPublished: {
      createdAt: number
      itemId: string
    }[]
  }
}): boolean {
  if (!Array.isArray(data.progress.wearablesPublished)) return false
  if (!data.progress.wearablesPublished.every((wearable: any) => Number.isInteger(wearable.createdAt))) return false
  if (!data.progress.wearablesPublished.every((wearable: any) => typeof wearable.itemId === 'string')) return false

  return true
}

export function mergeWearableDesignerProgress(
  userAddress: EthAddress,
  currentUserProgress: UserBadge | undefined,
  badge: Badge,
  backfillData: any
): UserBadge {
  const isValid = validateWearableDesignerBackfillData(backfillData)
  if (!badge || !isValid) {
    throw new Error(`Failed while processing back-fill. Badge: ${JSON.stringify(badge)}. User: ${userAddress}.`)
  }

  const userProgress = currentUserProgress || {
    user_address: userAddress,
    badge_id: backfillData.badgeId,
    completed_at: undefined,
    progress: {
      steps: 0,
      published_wearables: []
    },
    achieved_tiers: []
  }

  const sortedPublications = getSortedItems(
    [...userProgress.progress.published_wearables, ...backfillData.progress.wearablesPublished],
    'itemId',
    'createdAt'
  )

  userProgress.progress = {
    steps: sortedPublications.length,
    published_wearables: sortedPublications
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
