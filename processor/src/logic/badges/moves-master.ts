import { Badge, BadgeId, BadgeTier, UserBadge } from '@badges/common'
import { AppComponents, BadgeProcessorResult, IObserver } from '../../types'
import { EthAddress, Events, UsedEmoteEvent } from '@dcl/schemas'

export const MINUTES_IN_DAY = 1440

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

  function getUserAddress(event: UsedEmoteEvent): EthAddress {
    return event.metadata.userAddress
  }

  async function handle(
    event: UsedEmoteEvent,
    userProgress: UserBadge | undefined
  ): Promise<BadgeProcessorResult | undefined> {
    const userAddress = getUserAddress(event)
    const minuteTimestamp = normalizeToMinuteTimestamp(event.timestamp)

    userProgress ||= initProgressFor(userAddress)

    if (userProgress.completed_at) {
      logger.info('User already has badge', { userAddress, badgeId })
      return undefined
    }

    if (minuteTimestamp <= userProgress.progress.last_used_emote_timestamp) {
      return undefined
    }

    userProgress.progress.last_used_emote_timestamp = minuteTimestamp
    userProgress.progress.steps += 1

    userProgress.progress.last_day_used_emotes_timestamps.push(minuteTimestamp)
    if (userProgress.progress.last_day_used_emotes_timestamps.length > MINUTES_IN_DAY) {
      userProgress.progress.last_day_used_emotes_timestamps.shift() // Remove the oldest timestamp
    }

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
        last_used_emote_timestamp: 0, // Track the last minute when an emote was used
        last_day_used_emotes_timestamps: [] // Store the last 1440 (one day) unique minutes
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
        type: Events.Type.CLIENT,
        subType: Events.SubType.Client.USED_EMOTE
      }
    ]
  }
}
