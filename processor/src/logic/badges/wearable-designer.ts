import { EthAddress, Events, ItemPublishedEvent } from '@dcl/schemas'
import { AppComponents, BadgeProcessorResult, IObserver } from '../../types'
import { Badge, BadgeId, BadgeTier, UserBadge } from '@badges/common'

export function createWearableDesignerObserver({
  db,
  logs,
  badgeStorage
}: Pick<AppComponents, 'db' | 'logs' | 'badgeStorage'>): IObserver {
  const logger = logs.getLogger('wearable-designer-badge')
  const badgeId: BadgeId = BadgeId.WEARABLE_DESIGNER
  const badge: Badge = badgeStorage.getBadge(badgeId)

  function getUserAddress(event: ItemPublishedEvent): EthAddress {
    return event.metadata.creator
  }

  async function handle(
    event: ItemPublishedEvent,
    userProgress: UserBadge | undefined
  ): Promise<BadgeProcessorResult | undefined> {
    if (event.metadata.category !== 'wearable') {
      return undefined
    }

    const userAddress: EthAddress = getUserAddress(event)

    userProgress ||= initProgressFor(userAddress)

    if (userProgress.completed_at) {
      logger.info('User already has badge', {
        userAddress: userAddress,
        badgeId: badgeId
      })

      return undefined
    }

    const { itemId } = event.metadata

    if (userProgress.progress.published_wearables.includes(itemId)) {
      logger.info('User already published this wearable', {
        userAddress: userAddress,
        itemId
      })

      return undefined
    }

    userProgress.progress.published_wearables.push(itemId)
    const uniqueWearablesPublished = new Set<string>(userProgress.progress.published_wearables)
    userProgress.progress.steps = uniqueWearablesPublished.size
    userProgress.progress.published_wearables = Array.from(uniqueWearablesPublished)

    // can only achieve 1 tier at a time
    const newAchievedTier: BadgeTier | undefined = badge.tiers!.find(
      (tier) =>
        userProgress.progress.steps >= tier.criteria.steps &&
        !userProgress.achieved_tiers!.find((achievedTier) => achievedTier?.tier_id === tier.tierId)
    )

    if (newAchievedTier) {
      userProgress.achieved_tiers?.push({
        tier_id: newAchievedTier!.tierId,
        completed_at: Date.now()
      })
    }

    if (userProgress.achieved_tiers!.length === badge.tiers!.length) {
      userProgress.completed_at = Date.now()
    }

    await db.saveUserProgress(userProgress)

    return newAchievedTier ? { badgeGranted: { ...badge, tiers: [newAchievedTier] }, userAddress } : undefined
  }

  function initProgressFor(userAddress: EthAddress): Omit<UserBadge, 'updated_at'> {
    return {
      user_address: userAddress,
      badge_id: badgeId,
      progress: {
        steps: 0,
        published_wearables: []
      },
      achieved_tiers: []
    }
  }

  return {
    getUserAddress,
    handle,
    badgeId,
    badge,
    events: [
      {
        type: Events.Type.BLOCKCHAIN,
        subType: Events.SubType.Blockchain.ITEM_PUBLISHED
      }
    ]
  }
}
