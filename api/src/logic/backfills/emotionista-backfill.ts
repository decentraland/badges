import { Badge, UserBadge } from '@badges/common'
import { EthAddress } from '@dcl/schemas'
import { getUniqueSortedItems, tryToGetAchievedTiers, tryToGetCompletedAt } from '../utils'

function validateEmotionistaBackfillData(data: {
  progress: {
    emotesBought: {
      nftId: string
      saleAt: number
      transactionHash: string
    }[]
  }
}): boolean {
  if (!Array.isArray(data.progress.emotesBought)) return false
  if (!data.progress.emotesBought.every((emote: any) => Number.isInteger(emote.saleAt))) return false
  if (!data.progress.emotesBought.every((emote: any) => typeof emote.transactionHash === 'string')) return false

  return true
}

export function mergeEmotionistaProgress(
  userAddress: EthAddress,
  currentUserProgress: UserBadge | undefined,
  badge: Badge,
  backfillData: any
): UserBadge {
  const isValid = validateEmotionistaBackfillData(backfillData)
  if (!badge || !isValid) {
    throw new Error(`Failed while processing back-fill. Badge: ${JSON.stringify(backfillData)}. User: ${userAddress}.`)
  }

  const userProgress = currentUserProgress || {
    user_address: userAddress,
    badge_id: backfillData.badgeId,
    completed_at: undefined,
    progress: {
      steps: 0,
      transactions_emotes_purchase: []
    },
    achieved_tiers: []
  }

  const uniqueSortedBuys = getUniqueSortedItems(
    [...userProgress.progress.transactions_emotes_purchase, ...backfillData.progress.emotesBought],
    'transactionHash',
    'saleAt'
  )

  userProgress.progress = {
    steps: uniqueSortedBuys.length,
    transactions_emotes_purchase: uniqueSortedBuys
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
}
