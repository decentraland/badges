import { Badge, UserBadge } from '@badges/common'
import { EthAddress } from '@dcl/schemas'
import { getCompletedAt } from '../utils'

function validateEmoteCreatorBackfillData(data: {
  progress: {
    emotesPublished: {
      createdAt: number
      itemId: string
    }[]
  }
}): boolean {
  if (!Array.isArray(data.progress.emotesPublished)) return false
  if (!data.progress.emotesPublished.every((emote: any) => Number.isInteger(emote.createdAt))) return false
  if (!data.progress.emotesPublished.every((emote: any) => typeof emote.itemId === 'string')) return false

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

  const createdAtByItemId = new Map<string, number>([
    ...userProgress.progress.published_emotes.map((emote: any) => [emote.itemId, emote.createdAt]),
    ...backfillData.progress.emotesPublished.map((emote: any) => [emote.itemId, emote.createdAt])
  ])

  const sortedPublications = Array.from(createdAtByItemId, ([itemId, createdAt]) => ({ itemId, createdAt })).sort(
    (a, b) => a.createdAt - b.createdAt
  )

  userProgress.progress = {
    steps: createdAtByItemId.size,
    published_emotes: sortedPublications
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

      // should always be found, because we are using all registries from backfill and database
      if (!publicationFound) {
        throw new Error(`Could not find publication for tier ${tier.tierId}. Stopping the backfill process...`)
      }

      return {
        tier_id: tier.tierId,
        completed_at: Math.min(userAlreadyHadThisTier?.completed_at || Date.now(), publicationFound.createdAt)
      }
    })
  }

  if (
    userProgress.achieved_tiers &&
    userProgress.achieved_tiers.length > 0 &&
    userProgress.achieved_tiers.length === badge.tiers?.length
  ) {
    const [lastTier] = badge.tiers.slice(-1)
    const { createdAt: lastTierAchievedAt } = sortedPublications[lastTier?.criteria.steps - 1]

    userProgress.completed_at = getCompletedAt(userProgress, lastTierAchievedAt)
  }

  return userProgress
}
