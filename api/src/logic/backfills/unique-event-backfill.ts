import { Badge, UserBadge } from '@badges/common'
import { EthAddress } from '@dcl/schemas'

type BackfillData = {
  progress: {
    completedAt: number
  }
}

function validateUniqueEventBackfillData(data: BackfillData): boolean {
  return Number.isInteger(data.progress.completedAt)
}

export function mergeUniqueEventProgress(
  userAddress: EthAddress,
  currentUserProgress: UserBadge | undefined,
  badge: Badge,
  backfillData: BackfillData
): UserBadge {
  if (!badge || !validateUniqueEventBackfillData(backfillData)) {
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
    userProgress.progress.steps = 1
    userProgress.completed_at = Math.min(userProgress.completed_at || Date.now(), backfillData.progress.completedAt)

    return userProgress
  } catch (error) {
    console.error(`Error processing user ${userAddress}:`, error)
    throw error
  }
}
