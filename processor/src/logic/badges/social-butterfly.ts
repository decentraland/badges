import { Badge, BadgeId, BadgeTier, UserBadge } from '@badges/common'
import { AppComponents, BadgeProcessorResult, IObserver } from '../../types'
import { EthAddress, Events, PassportOpenedEvent } from '@dcl/schemas'

export function createSocialButterflyObserver({
  db,
  logs,
  badgeStorage
}: Pick<AppComponents, 'db' | 'logs' | 'badgeStorage'>): IObserver {
  const logger = logs.getLogger('social-butterfly-badge')
  const badgeId: BadgeId = BadgeId.SOCIAL_BUTTERFLY
  const badge: Badge = badgeStorage.getBadge(badgeId)
  const tieredBadges = badge.tiers!

  function getUserAddress(event: PassportOpenedEvent): EthAddress {
    return event.metadata.userAddress
  }

  async function handle(
    event: PassportOpenedEvent,
    userProgress: UserBadge | undefined
  ): Promise<BadgeProcessorResult | undefined> {
    const userAddress = getUserAddress(event)
    const receiverAddress = event.metadata.passport.receiver

    if (userAddress === receiverAddress) {
      logger.info('User opened their own passport', { userAddress })
      return undefined
    }

    userProgress ||= initProgressFor(userAddress)

    if (userProgress.completed_at) {
      logger.info('User already has badge', { userAddress, badgeId })
      return undefined
    }

    const visitedProfiles = new Set(userProgress.progress.profiles_visited)

    if (visitedProfiles.has(receiverAddress)) {
      return undefined
    }

    visitedProfiles.add(receiverAddress)
    userProgress.progress.profiles_visited = Array.from(visitedProfiles)
    userProgress.progress.steps += 1

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
        steps: 0,
        profiles_visited: []
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
        subType: Events.SubType.Client.PASSPORT_OPENED
      }
    ]
  }
}
