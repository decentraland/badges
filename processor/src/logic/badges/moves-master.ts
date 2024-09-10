import { Badge, BadgeId, BadgeTier, UserBadge } from '@badges/common'
import { AppComponents, BadgeProcessorResult, IObserver } from '../../types'
import { EthAddress, Events, UsedEmoteEvent } from '@dcl/schemas'

export function createMovesMasterObserver({
  db,
  logs,
  badgeStorage
}: Pick<AppComponents, 'db' | 'logs' | 'badgeStorage'>): IObserver {
  const logger = logs.getLogger('moves-master-badge')
  const badgeId: BadgeId = BadgeId.MOVES_MASTER
  const badge: Badge = badgeStorage.getBadge(badgeId)
  const tieredBadges = badge.tiers!

  // Normalize the timestamp to the start of the minute
  function normalizeToMinuteTimestamp(timestamp: number): number {
    return Math.floor(timestamp / 60000) * 60000
  }

  async function handle(event: UsedEmoteEvent): Promise<BadgeProcessorResult | undefined> {
    const userAddress = event.metadata.userAddress
    const minuteTimestamp = normalizeToMinuteTimestamp(event.metadata.timestamp)

    const userProgress: UserBadge = (await db.getUserProgressFor(badgeId, userAddress)) || initProgressFor(userAddress)

    if (userProgress.completed_at) {
      logger.info('User already has badge', { userAddress, badgeId })
      return undefined
    }

    // If the event is older than the last used minute, ignore it
    if (minuteTimestamp <= userProgress.progress.last_used_emote_timestamp) {
      return undefined
    }

    userProgress.progress.last_used_emote_timestamp = minuteTimestamp
    userProgress.progress.steps += 1

    // Determine if a new tier is achieved
    const newAchievedTier: BadgeTier | undefined = badge.tiers!.find(
      (tier) =>
        userProgress.progress.steps >= tier.criteria.steps &&
        !userProgress.achieved_tiers!.find((achievedTier) => achievedTier?.tier_id === tier.tierId)
    )

    if (newAchievedTier) {
      userProgress.achieved_tiers?.push({
        tier_id: newAchievedTier.tierId,
        completed_at: Date.now()
      })
    }

    // If all tiers are achieved, mark progress as completed
    if (userProgress.achieved_tiers!.length === tieredBadges.length) {
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
        steps: 0, // Number of unique minutes in which emotes were used
        last_used_emote_timestamp: 0 // Track the last minute when an emote was used
      },
      achieved_tiers: []
    }
  }

  return {
    handle,
    badge,
    events: [
      {
        type: Events.Type.CLIENT,
        subType: Events.SubType.Client.USED_EMOTE
      }
    ]
  }
}
