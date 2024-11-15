import { Badge, UserBadge } from '@badges/common'
import { EthAddress } from '@dcl/schemas'

type BackfillData = {
  progress: {
    completedAt?: number
    collectionCreatedAt?: number
    storeCreatedAt?: number
  }
}

function validateOpenForBusinessBackfillData(data: BackfillData): boolean {
  const { completedAt, collectionCreatedAt, storeCreatedAt } = data.progress

  return [completedAt, collectionCreatedAt, storeCreatedAt].every(
    (value) => value === undefined || Number.isInteger(value)
  )
}

export function mergeOpenForBusinessProgress(
  userAddress: EthAddress,
  currentUserProgress: UserBadge | undefined,
  badge: Badge,
  backfillData: BackfillData
): UserBadge {
  if (!badge || !validateOpenForBusinessBackfillData(backfillData)) {
    throw new Error(`Failed while processing backfill. Badge: ${JSON.stringify(badge)}. User: ${userAddress}.`)
  }

  const userProgress: UserBadge = currentUserProgress || {
    user_address: userAddress,
    badge_id: badge.id,
    completed_at: undefined,
    progress: {
      steps: 0
    }
  }

  try {
    const { completedAt, collectionCreatedAt, storeCreatedAt } = backfillData.progress

    userProgress.progress.steps = [collectionCreatedAt, storeCreatedAt].filter(Boolean).length
    userProgress.progress.store_completed = !!storeCreatedAt
    userProgress.progress.collection_submitted = !!collectionCreatedAt

    if (completedAt) {
      userProgress.completed_at = Math.min(userProgress.completed_at || Date.now(), completedAt)
    }

    return userProgress
  } catch (error) {
    console.error(`Error processing user ${userAddress}:`, {
      error,
      backfillData: JSON.stringify(backfillData),
      userProgress: JSON.stringify(userProgress)
    })
    throw error
  }
}
