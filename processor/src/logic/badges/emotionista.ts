import { EthAddress, Events, ItemSoldEvent } from '@dcl/schemas'
import { AppComponents, BadgeProcessorResult, IObserver } from '../../types'
import { Badge, BadgeId, BadgeTier, UserBadge } from '@badges/common'

export function createEmotionistaObserver({
  db,
  logs,
  badgeStorage
}: Pick<AppComponents, 'db' | 'logs' | 'badgeStorage'>): IObserver {
  const logger = logs.getLogger('emotionista-badge')
  const badgeId: BadgeId = BadgeId.EMOTIONISTA
  const badge: Badge = badgeStorage.getBadge(badgeId)

  function getUserAddress(event: ItemSoldEvent): EthAddress {
    return event.metadata.buyer
  }

  async function handle(
    event: ItemSoldEvent,
    userProgress: UserBadge | undefined
  ): Promise<BadgeProcessorResult | undefined> {
    if (event.metadata.category !== 'emote') {
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

    const txHash = event.key // This is the transaction hash set at events-notifier
    const emoteWasAlreadyPurchased = userProgress.progress.transactions_emotes_purchase.find(
      (purchasedEmote: any) => purchasedEmote.transactionHash === txHash
    )

    if (emoteWasAlreadyPurchased) {
      logger.info('User already has this emote', {
        userAddress: userAddress,
        badgeId: badgeId,
        txHash
      })

      return undefined
    }

    userProgress.progress.transactions_emotes_purchase.push({ transactionHash: txHash, saleAt: event.timestamp })
    userProgress.progress.steps++

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
        transactions_emotes_purchase: [] as { transactionHash: string; saleAt: number }[]
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
        subType: Events.SubType.Blockchain.ITEM_SOLD
      }
    ]
  }
}
