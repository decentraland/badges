import { Badge, UserBadge } from '@badges/common'
import { EthAddress } from '@dcl/schemas'

function validateWearableDesignerBackfillData(data: {
  progress: {
    wearablesPublished: {
      createdAt: number
      urn: string
    }[]
  }
}): boolean {
  if (!Array.isArray(data.progress.wearablesPublished)) return false
  if (!data.progress.wearablesPublished.every((wearable: any) => Number.isInteger(wearable.createdAt))) return false
  if (!data.progress.wearablesPublished.every((wearable: any) => typeof wearable.urn === 'string')) return false

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

  const uniqueWearables = new Set<string>([
    ...userProgress.progress.published_wearables,
    ...backfillData.progress.wearablesPublished.map((wearable: any) => wearable.urn)
  ])

  const sortedPublications = backfillData.progress.wearablesPublished.sort(
    (a: any, b: any) => a.createdAt - b.createdAt
  )

  userProgress.progress = {
    steps: uniqueWearables.size,
    published_wearables: Array.from(uniqueWearables)
  }

  // this badge has tiers
  const achievedTiers = badge.tiers!.filter((tier) => {
    return userProgress.progress.steps >= tier.criteria.steps
  })

  if (achievedTiers.length > 0) {
    userProgress.achieved_tiers = achievedTiers.map((tier) => {
      const publicationFound = sortedPublications[tier.criteria.steps - 1]
      const userAlreadyHadThisTier = userProgress.achieved_tiers!.find(
        (achievedTier) => achievedTier.tier_id === tier.tierId
      )

      if (publicationFound) {
        return {
          tier_id: tier.tierId,
          completed_at:
            userAlreadyHadThisTier && userAlreadyHadThisTier.completed_at < publicationFound.createdAt
              ? userAlreadyHadThisTier.completed_at
              : publicationFound.createdAt
        }
      } else {
        return {
          tier_id: tier.tierId,
          completed_at: userAlreadyHadThisTier ? userAlreadyHadThisTier.completed_at : Date.now()
        }
      }
    })
  }

  if (userProgress.achieved_tiers?.length === badge.tiers?.length) {
    const lastTier = badge.tiers?.pop()
    const alreadyAchievedDate = userProgress.completed_at
    const foundRelatedSortedBuy = sortedPublications[lastTier?.criteria.steps - 1]

    if (foundRelatedSortedBuy && (!alreadyAchievedDate || foundRelatedSortedBuy.createdAt < alreadyAchievedDate)) {
      userProgress.completed_at = foundRelatedSortedBuy.createdAt
    }

    if (!foundRelatedSortedBuy && !alreadyAchievedDate) {
      userProgress.completed_at = Date.now()
    }
  }

  return userProgress
}
