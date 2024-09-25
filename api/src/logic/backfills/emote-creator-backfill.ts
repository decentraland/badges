import { Badge, UserBadge } from '@badges/common'
import { EthAddress } from '@dcl/schemas'

function validateEmoteCreatorBackfillData(data: {
  progress: {
    emotesPublished: {
      createdAt: number
      urn: string
    }[]
  }
}): boolean {
  if (!Array.isArray(data.progress.emotesPublished)) return false
  if (!data.progress.emotesPublished.every((emote: any) => Number.isInteger(emote.createdAt))) return false
  if (!data.progress.emotesPublished.every((emote: any) => typeof emote.urn === 'string')) return false

  return true
}

export function mergeEmoteCreatorProgress(
  userAddress: EthAddress,
  currentUserProgress: UserBadge | undefined,
  badge: Badge,
  backfillData: any
): UserBadge {
  const isValid = validateEmoteCreatorBackfillData(backfillData)
  if (!badge || !isValid) {
    throw new Error(`Failed while processing back-fill. Badge: ${JSON.stringify(badge)}. User: ${userAddress}.`)
  }

  const userProgress = currentUserProgress || {
    user_address: userAddress,
    badge_id: backfillData.badgeId,
    completed_at: undefined,
    progress: {
      steps: 0,
      published_emotes: []
    },
    achieved_tiers: []
  }

  const uniqueEmotes = new Set<string>([
    ...userProgress.progress.published_emotes,
    ...backfillData.progress.emotesPublished.map((emote: any) => emote.urn)
  ])

  const sortedPublications = backfillData.progress.emotesPublished.sort((a: any, b: any) => a.createdAt - b.createdAt)

  userProgress.progress = {
    steps: uniqueEmotes.size,
    published_emotes: Array.from(uniqueEmotes)
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
