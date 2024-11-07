import { Badge, BadgeId, UserBadge } from '@badges/common'
import {
  TierEmoteCreator,
  TierEmotionista,
  TierEventEnthusiast,
  TierFashionista,
  TierMovesMaster,
  TierMusicFestival,
  TierSocialButterfly,
  TierTraveler,
  TierWalkaboutWanderer,
  TierWearableDesigner
} from '@badges/common/src/types/tiers'

export function parseBadgeId(id: string): BadgeId | undefined {
  if (Object.values(BadgeId).includes(id as BadgeId)) {
    return id as BadgeId
  }
  return undefined
}

export function getCompletedAt(userProgress: UserBadge, lastTierAchievedAt?: number): number {
  const { completed_at: alreadyCompletedAt } = userProgress
  const possibleCompletedAt = [alreadyCompletedAt, lastTierAchievedAt, Date.now()].filter(Number.isFinite) as number[]
  return Math.min(...possibleCompletedAt)
}

// TODO: this could be improved
type KeyOfWithValue<T, ValueType> = {
  [K in keyof T]: T[K] extends ValueType ? K : never
}[keyof T]

export function getUniqueSortedItems<T, IK extends KeyOfWithValue<T, string>, TK extends KeyOfWithValue<T, number>>(
  items: T[],
  idKey: IK,
  timestampKey: TK
): T[] {
  const uniqueItems = new Map<string, number>(
    items.map((item: T) => [item[idKey], item[timestampKey]] as [string, number])
  )

  const sortedItems = Array.from(uniqueItems).sort((a, b) => a[1] - b[1])

  return sortedItems.map(
    ([id, timestamp]) =>
      ({
        [idKey]: id,
        [timestampKey]: timestamp
      }) as T
  )
}

export function getBadgeAchievedTiers(badge: Badge, userProgress: UserBadge) {
  return badge.tiers!.filter((tier) => userProgress.progress.steps >= tier.criteria.steps)
}

export function tryToGetAchievedTiers<T, TK extends KeyOfWithValue<T, number>>(
  badge: Badge,
  userProgress: UserBadge,
  sortedItems: T[],
  timestampKey: TK
): {
  tier_id:
    | TierTraveler
    | TierEmotionista
    | TierFashionista
    | TierEventEnthusiast
    | TierMovesMaster
    | TierSocialButterfly
    | TierWalkaboutWanderer
    | TierEmoteCreator
    | TierWearableDesigner
    | TierMusicFestival
  completed_at: number
}[] {
  const achievedTiers = getBadgeAchievedTiers(badge, userProgress)

  return achievedTiers.map((tier) => {
    const achievedWithItem = sortedItems[tier.criteria.steps - 1]
    const userAlreadyHadThisTier = userProgress.achieved_tiers!.find(
      (achievedTier) => achievedTier.tier_id === tier.tierId
    )

    // Should always be found, because we are using all registries from backfill and database
    if (!achievedWithItem) {
      throw new Error(`Could not find publication for tier ${tier.tierId}. Stopping the backfill process...`)
    }

    const achievedAt = achievedWithItem[timestampKey] as number

    return {
      tier_id: tier.tierId,
      completed_at: Math.min(userAlreadyHadThisTier?.completed_at || Date.now(), achievedAt)
    }
  })
}

export function tryToGetCompletedAt<T, TK extends KeyOfWithValue<T, number>>(
  badge: Badge,
  userProgress: UserBadge,
  sortedItems: T[],
  timestampKey: TK
): number | undefined {
  if (
    !userProgress.achieved_tiers ||
    userProgress.achieved_tiers.length === 0 ||
    !badge.tiers ||
    badge.tiers?.length === 0 ||
    badge.tiers.length !== userProgress.achieved_tiers.length
  ) {
    return undefined
  }

  const [lastTier] = badge.tiers.slice(-1)
  const itemThatAchievedLastTier = sortedItems[lastTier.criteria.steps - 1]

  // Should always be found, because we are using all registries from backfill and database
  if (!itemThatAchievedLastTier) {
    throw new Error(
      `Could not find the item related to the last tier ${lastTier?.tierId}. Stopping the backfill process...`
    )
  }

  const { [timestampKey]: lastTierAchievedAt } = itemThatAchievedLastTier

  return getCompletedAt(userProgress, lastTierAchievedAt as number)
}

export function validateUserProgress(
  userProgress: UserBadge,
  badge: Badge | undefined
): { ok: boolean; errors: string[] } {
  const errors: string[] = []

  if (!badge) {
    errors.push('badge not found')
  }

  if (
    badge?.tiers &&
    userProgress.completed_at &&
    (!userProgress.achieved_tiers || userProgress.achieved_tiers.length !== badge.tiers.length)
  ) {
    errors.push('mismatch between badge tiers and achieved tiers')
  }

  if (!badge?.tiers && userProgress.completed_at && userProgress.progress.steps !== badge!.criteria.steps) {
    errors.push('mismatch between badge criteria and progress steps')
  }

  // validate that achieved tiers were correctly calculated
  if (!!badge?.tiers && userProgress.achieved_tiers && userProgress.achieved_tiers.length > 0) {
    userProgress.achieved_tiers?.forEach((achievedTier, i) => {
      const tierDefinition = badge.tiers!.find((tier) => tier.tierId === achievedTier.tier_id)

      if (!tierDefinition) {
        errors.push(`tier achieved ${achievedTier.tier_id} not found in badge tiers`)
        return
      }

      if (tierDefinition.criteria.steps > userProgress.progress.steps) {
        errors.push(`tier achieved ${achievedTier.tier_id} criteria steps are greater than progress steps`)
      }

      if (i > 0) {
        const previousTier = userProgress.achieved_tiers![i - 1]
        if (previousTier.completed_at > achievedTier.completed_at) {
          errors.push(`tier achieved ${achievedTier.tier_id} completed before previous tier ${previousTier.tier_id}`)
        }
      }
    })
  }

  return { ok: errors.length === 0, errors }
}
