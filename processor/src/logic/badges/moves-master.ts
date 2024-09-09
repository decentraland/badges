import { Badge, BadgeId, BadgeTier, UserBadge } from '@badges/common'
import { AppComponents, BadgeProcessorResult, IObserver } from '../../types'
import { EthAddress, Events, UsedEmoteEvent } from '@dcl/schemas'

export function createMovesMasterObserver({
  db,
  logs,
  badgeStorage,
  memoryStorage
}: Pick<AppComponents, 'db' | 'logs' | 'badgeStorage' | 'memoryStorage'>): IObserver {
  const logger = logs.getLogger('moves-master-badge')
  const badgeId: BadgeId = BadgeId.MOVES_MASTER
  const badge: Badge = badgeStorage.getBadge(badgeId)
  const tieredBadges = badge.tiers!

  function alreadyUsedEmoteInTheLastMinute(emoteEvents: any[]): boolean {
    const lastMinute = Date.now() - 60000
    return emoteEvents.some((event) => event.on >= lastMinute)
  }

  async function handle(event: UsedEmoteEvent): Promise<BadgeProcessorResult | undefined> {
    const userAddress = event.metadata.userAddress

    const userProgress: UserBadge = (await db.getUserProgressFor(badgeId, userAddress)) || initProgressFor(userAddress)

    if (userProgress.completed_at) {
      logger.info('User already has badge', {
        userAddress,
        badgeId: badgeId
      })

      return undefined
    }

    const cacheKeyRelatedToEvent = `${userAddress}-${event.metadata.sessionId}-${event.subType}`
    const cachedEmoteEvents = memoryStorage.get(cacheKeyRelatedToEvent) || []
    const emoteEvents = [...cachedEmoteEvents, { on: new Date(event.timestamp).getTime() }]

    memoryStorage.set(cacheKeyRelatedToEvent, emoteEvents)

    // check if the user has already spammed emotes in the last minute, which, let's be honest, they probably have.
    if (alreadyUsedEmoteInTheLastMinute(cachedEmoteEvents)) {
      return undefined
    }

    userProgress.progress.steps++

    // can only achieve 1 tier at a time, by definition we count one emote usage per minute
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
        steps: 0
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
