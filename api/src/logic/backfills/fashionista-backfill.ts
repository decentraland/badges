import { Badge, UserBadge } from '@badges/common'
import { EthAddress } from '@dcl/schemas'
import { getUniqueSortedItems, tryToGetAchievedTiers, tryToGetCompletedAt } from '../utils'

function validateFashionistaBackfillData(data: {
  progress: {
    wearablesBought: {
      nftId: string
      saleAt: number
      transactionHash: string
    }[]
  }
}): boolean {
  if (!Array.isArray(data.progress.wearablesBought)) return false
  if (!data.progress.wearablesBought.every((wearable: any) => Number.isInteger(wearable.saleAt))) return false
  if (!data.progress.wearablesBought.every((wearable: any) => typeof wearable.transactionHash === 'string'))
    return false

  return true
}

export function mergeFashionistaProgress(
  userAddress: EthAddress,
  currentUserProgress: UserBadge | undefined,
  badge: Badge,
  backfillData: any
): UserBadge {
  const isValid = validateFashionistaBackfillData(backfillData)
  if (!badge || !isValid) {
    throw new Error(`Failed while processing back-fill. Badge: ${JSON.stringify(badge)}. User: ${userAddress}.`)
  }

  const userProgress = currentUserProgress || {
    user_address: userAddress,
    badge_id: backfillData.badgeId,
    completed_at: undefined,
    progress: {
      steps: 0,
      transactions_wearable_purchase: []
    },
    achieved_tiers: []
  }

  try {
    const uniqueSortedBuys = getUniqueSortedItems(
      [...userProgress.progress.transactions_wearable_purchase, ...backfillData.progress.wearablesBought],
      'transactionHash',
      'saleAt'
    )

    userProgress.progress = {
      steps: uniqueSortedBuys.length,
      transactions_wearable_purchase: uniqueSortedBuys
    }

    const achievedTiers = tryToGetAchievedTiers(badge, userProgress, uniqueSortedBuys, 'saleAt')
    if (achievedTiers.length > 0) {
      userProgress.achieved_tiers = achievedTiers
    }

    const completedAt = tryToGetCompletedAt(badge, userProgress, uniqueSortedBuys, 'saleAt')
    if (completedAt) {
      userProgress.completed_at = completedAt
    }

    return userProgress
  } catch (error: any) {
    console.log({
      userAddress,
      backfillData: JSON.stringify(backfillData),
      userProgress: JSON.stringify(userProgress)
    })
    throw error
  }
}
