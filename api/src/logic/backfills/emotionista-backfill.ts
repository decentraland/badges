import { Badge, UserBadge } from '@badges/common'
import { EthAddress } from '@dcl/schemas'

function validateEmotionistaBackfillData(data: {
  progress: {
    emotesBought: {
      nftId: string
      saleAt: number
      txHash: string
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
    throw new Error(`Failed while processing back-fill. Badge: ${JSON.stringify(badge)}. User: ${userAddress}.`)
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

  const uniqueTransactions = new Set<string>([
    ...userProgress.progress.transactions_emotes_purchase,
    ...backfillData.progress.emotesBought.map((emote: any) => emote.transactionHash)
  ])

  const sortedBuys = backfillData.progress.emotesBought.sort((a: any, b: any) => a.saleAt - b.saleAt)

  userProgress.progress = {
    steps: uniqueTransactions.size,
    transactions_emotes_purchase: Array.from(uniqueTransactions)
  }

  // this badge has tiers
  const achievedTiers = badge.tiers!.filter((tier) => {
    return userProgress.progress.steps >= tier.criteria.steps
  })

  if (achievedTiers.length > 0) {
    userProgress.achieved_tiers = achievedTiers.map((tier) => {
      const transactionFound = sortedBuys[tier.criteria.steps - 1]
      const userAlreadyHadThisTier = userProgress.achieved_tiers!.find(
        (achievedTier) => achievedTier.tier_id === tier.tierId
      )

      if (transactionFound) {
        return {
          tier_id: tier.tierId,
          completed_at:
            userAlreadyHadThisTier && userAlreadyHadThisTier.completed_at < transactionFound.saleAt
              ? userAlreadyHadThisTier.completed_at
              : transactionFound.saleAt
        }
      } else {
        return {
          tier_id: tier.tierId,
          completed_at: userAlreadyHadThisTier ? userAlreadyHadThisTier.completed_at : Date.now()
        }
      }
    })
  }

  if (
    userProgress.achieved_tiers &&
    userProgress.achieved_tiers.length > 0 &&
    userProgress.achieved_tiers.length === badge.tiers?.length
  ) {
    const [lastTier] = badge.tiers.slice(-1)
    const alreadyAchievedDate = userProgress.completed_at
    const foundRelatedSortedBuy = sortedBuys[lastTier?.criteria.steps - 1]

    if (foundRelatedSortedBuy && (!alreadyAchievedDate || foundRelatedSortedBuy.saleAt < alreadyAchievedDate)) {
      userProgress.completed_at = foundRelatedSortedBuy.saleAt
    }

    if (!foundRelatedSortedBuy && !alreadyAchievedDate) {
      userProgress.completed_at = Date.now()
    }
  }

  return userProgress
}
