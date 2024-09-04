import { EthAddress, Events, ItemSoldEvent } from '@dcl/schemas'
import { AppComponents, BadgeProcessorResult, IObserver } from '../../types'
import { Badge, BadgeId, BadgeTier, UserBadge, badges } from '@badges/common'

export function createFashionistaObserver({ db, logs }: Pick<AppComponents, 'db' | 'logs'>): IObserver {
  const logger = logs.getLogger('fashionista-badge')

  const badge: Badge = badges.get(BadgeId.FASHIONISTA)!
  const badgeId: BadgeId = BadgeId.FASHIONISTA

  async function handle(event: ItemSoldEvent): Promise<BadgeProcessorResult | undefined> {
    if (event.metadata.category !== 'wearable') {
      return undefined
    }

    const userAddress: EthAddress = event.metadata.buyer

    const userProgress: UserBadge = (await db.getUserProgressFor(badgeId, userAddress!)) || initProgressFor(userAddress)

    if (userProgress.completed_at) {
      logger.info('User already has badge', {
        userAddress: userAddress!,
        badgeId: badgeId
      })

      return undefined
    }

    const txHash = event.key // This is the transaction hash set at events-notifier
    userProgress.progress.transactions_wearable_purchase.push(txHash)
    const uniqueWearablesPurchased = new Set<string>(userProgress.progress.transactions_wearable_purchase)
    userProgress.progress.steps = uniqueWearablesPurchased.size
    userProgress.progress.transactions_wearable_purchase = Array.from(uniqueWearablesPurchased)

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
        transactions_wearable_purchase: []
      },
      achieved_tiers: []
    }
  }

  return {
    handle,
    badge,
    events: [
      {
        type: Events.Type.CATALYST_DEPLOYMENT,
        subType: Events.SubType.CatalystDeployment.STORE
      },
      {
        type: Events.Type.BLOCKCHAIN,
        subType: Events.SubType.Blockchain.COLLECTION_CREATED
      }
    ]
  }
}
