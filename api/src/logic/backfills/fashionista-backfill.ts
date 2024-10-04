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

  const invalidWearables = data.progress.wearablesBought.filter(
    (wearable) => !Number.isInteger(wearable.saleAt) || typeof wearable.transactionHash !== 'string'
  )

  if (invalidWearables.length > 0) {
    console.error('Invalid wearables found:', invalidWearables)
    return false
  }

  return true
}

export function mergeFashionistaProgress(
  userAddress: EthAddress,
  currentUserProgress: UserBadge | undefined,
  badge: Badge,
  backfillData: any
): UserBadge {
  backfillData.progress.achievedTiers = (backfillData.progress.achievedTiers || []).filter(
    (tier: any) => tier.hasOwnProperty('steps') && tier.hasOwnProperty('completedAt')
  )
  backfillData.progress.wearablesBought = backfillData.progress.wearablesBought.filter(
    (wearable: any) =>
      wearable.hasOwnProperty('saleAt') &&
      wearable.hasOwnProperty('transactionHash') &&
      wearable.hasOwnProperty('nftId')
  )

  const isValid = validateFashionistaBackfillData(backfillData)
  if (!badge || !isValid) {
    throw new Error(`Failed while processing back-fill. Badge: ${JSON.stringify(backfillData)}. User: ${userAddress}.`)
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
