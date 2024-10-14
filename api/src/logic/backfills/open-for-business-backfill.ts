import { Badge, UserBadge } from '@badges/common'
import { EthAddress } from '@dcl/schemas'

type BackfillData = {
  progress: {
    completedAt: number
  }
}

function validateOpenForBusinessBackfillData(data: BackfillData): boolean {
  return Number.isInteger(data.progress.completedAt)
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
    userProgress.progress.steps = 2
    userProgress.progress.store_completed = true
    userProgress.progress.collection_submitted = true
    userProgress.completed_at = Math.min(userProgress.completed_at || Date.now(), backfillData.progress.completedAt)

    return userProgress
  } catch (error) {
    console.error(`Error processing user ${userAddress}:`, error)
    throw error
  }
}
