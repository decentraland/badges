import { Badge, UserBadge } from '@badges/common'
import { EthAddress } from '@dcl/schemas'

type BackfillData = {
  progress: {
    firstSceneDeployedAt: number
  }
}

function validateLandArchitectBackfillData(data: BackfillData): boolean {
  return Number.isInteger(data.progress.firstSceneDeployedAt)
}

export function mergeLandArchitectProgress(
  userAddress: EthAddress,
  currentUserProgress: UserBadge | undefined,
  badge: Badge,
  backfillData: BackfillData
): UserBadge {
  if (!badge || !validateLandArchitectBackfillData(backfillData)) {
    throw new Error(`Failed while processing backfill. Badge: ${JSON.stringify(badge)}. User: ${userAddress}.`)
  }

  const userProgress: UserBadge = currentUserProgress || {
    user_address: userAddress,
    badge_id: badge.id,
    completed_at: undefined,
    progress: {
      steps: 0
    },
    achieved_tiers: []
  }

  try {
    userProgress.progress.steps = 1
    userProgress.completed_at = Math.min(
      userProgress.completed_at || Date.now(),
      backfillData.progress.firstSceneDeployedAt
    )

    return userProgress
  } catch (error) {
    console.error(`Error processing user ${userAddress}:`, error)
    throw error
  }
}
