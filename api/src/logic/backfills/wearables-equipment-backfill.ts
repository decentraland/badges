import { Badge, UserBadge } from '@badges/common'
import { EthAddress } from '@dcl/schemas'

function validateWearablesEquipmentRelatedBadgesProgress(data: { progress: any }): boolean {
  if (!Array.isArray(data.progress.completedWith)) return false
  if (!data.progress.completedAt || !Number.isInteger(data.progress.completedAt)) return false
  if (!data.progress.completedWith.every((wearableUrn: any) => typeof wearableUrn === 'string')) return false

  return true
}

export function mergeWearablesEquipmentProgress(
  userAddress: EthAddress,
  currentUserProgress: UserBadge | undefined,
  badge: Badge,
  backfillData: any
): UserBadge {
  const isValid = validateWearablesEquipmentRelatedBadgesProgress(backfillData)
  if (!badge || !isValid) {
    throw new Error(`Failed while processing back-fill. Badge: ${JSON.stringify(backfillData)}. User: ${userAddress}.`)
  }

  const userProgress = currentUserProgress || {
    user_address: userAddress,
    badge_id: backfillData.badgeId,
    completed_at: 0,
    progress: {
      steps: 1,
      completed_with: []
    }
  }

  if (!userProgress.progress.completedAt || backfillData.progress.completedAt < userProgress.progress.completedAt) {
    userProgress.completed_at = backfillData.progress.completedAt
    userProgress.progress.completed_with = backfillData.progress.completedWith
  }

  return userProgress
}
