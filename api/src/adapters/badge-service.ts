import { EthAddress } from '@dcl/schemas'
import { AppComponents, IBadgeService, UserBadgesPreview } from '../types'
import { Badge, BadgeId, BadgeTier, UserBadge } from '@badges/common'

export async function createBadgeService({
  db,
  badgeStorage,
  logs
}: Pick<AppComponents, 'db' | 'badgeStorage' | 'logs'>): Promise<IBadgeService> {
  const logger = logs.getLogger('badge-service')
  const badges: Map<BadgeId, Badge> = badgeStorage.getBadges()

  function getBadge(id: BadgeId): Badge {
    // we assert the value because if BadgeId exists
    // the badge should be already be added to the badges map
    return { ...badges.get(id)! } // to avoid mutation
  }

  function getBadges(ids: BadgeId[]): Badge[] {
    return ids.map((id) => getBadge(id))
  }

  function getAllBadges(): Badge[] {
    return Array.from(badges.values())
  }

  async function getUserStates(address: EthAddress) {
    return db.getAllUserProgresses(address)
  }

  async function getUserState(address: EthAddress, badgeId: BadgeId): Promise<UserBadge> {
    return db.getUserProgressFor(badgeId, address)
  }

  async function getLatestAchievedBadges(address: EthAddress): Promise<UserBadgesPreview[]> {
    const userBadges: UserBadge[] = await db.getLatestUserBadges(address)
    const badgeIdsAchievedByUser: BadgeId[] = Array.from(new Set(userBadges.map((badge) => badge.badge_id as BadgeId)))
    const badgesDefinitions: Badge[] = getBadges(badgeIdsAchievedByUser)

    return userBadges.map((userBadge) => {
      const relatedBadgeDefinition: Badge = badgesDefinitions.find((badge) => badge.id === userBadge.badge_id)!
      const achievedTier: BadgeTier | undefined = relatedBadgeDefinition.tiers?.find((tier) => {
        const achievedTierId =
          userBadge.achieved_tiers && userBadge?.achieved_tiers.length
            ? userBadge?.achieved_tiers[0]?.tier_id
            : undefined

        return achievedTierId ? tier.tierId === achievedTierId : false
      })

      const achievedTierImage = !!achievedTier && achievedTier!.assets!['2d'].normal

      const definitionImage =
        relatedBadgeDefinition.tiers && relatedBadgeDefinition.tiers.length > 0
          ? relatedBadgeDefinition.tiers[0].assets!['2d'].normal
          : relatedBadgeDefinition.assets!['2d'].normal

      return {
        id: relatedBadgeDefinition.id,
        name: relatedBadgeDefinition.name,
        tierName: !!achievedTier ? achievedTier.tierName : undefined,
        image: achievedTierImage || definitionImage
      }
    })
  }

  function calculateUserProgress(
    allBadges: Badge[],
    userProgresses: UserBadge[],
    shouldIncludeNotAchieved: boolean = false
  ): { achieved: any; notAchieved: any } {
    try {
      const badgesProgresses = allBadges.reduce(
        (accumulator, badge) => {
          const isTierBadge = badge.tiers && badge.tiers.length > 0
          const badgeProgress = userProgresses.find((userBadge) => userBadge.badge_id === badge.id) || {
            badge_id: badge.id,
            progress: { steps: 0 },
            achieved_tiers: isTierBadge ? [] : undefined,
            completed_at: undefined
          }

          const tierProgress = isTierBadge ? getCurrentTierProgress(badge, badgeProgress) : undefined

          if (badgeProgress.completed_at || tierProgress?.currentTier) {
            const calculatedNextTarget = isTierBadge
              ? tierProgress?.nextTier?.criteria.steps || badge.tiers![badge.tiers!.length - 1].criteria.steps
              : badge.criteria.steps

            accumulator.achieved.push({
              id: badge.id,
              name: badge.name,
              description: badge.description,
              category: badge.category,
              isTier: !!isTierBadge,
              completedAt: badgeProgress.completed_at,
              assets: isTierBadge ? tierProgress?.currentTier?.assets : badge.assets,
              progress: {
                achievedTiers: badgeProgress.achieved_tiers?.map((achievedTier) => ({
                  tierId: achievedTier.tier_id,
                  completedAt: achievedTier.completed_at
                })),
                stepsDone: badgeProgress.progress.steps,
                nextStepsTarget: badgeProgress.completed_at ? null : calculatedNextTarget,
                totalStepsTarget: isTierBadge
                  ? badge.tiers![badge.tiers!.length - 1].criteria.steps
                  : badge.criteria.steps,
                lastCompletedTierAt: isTierBadge ? badgeProgress.achieved_tiers?.slice(-1)[0]?.completed_at : null,
                lastCompletedTierName: isTierBadge ? tierProgress?.currentTier?.tierName : null,
                lastCompletedTierImage: isTierBadge ? tierProgress?.currentTier?.assets?.['2d'].normal : null
              }
            })
          } else if (shouldIncludeNotAchieved) {
            accumulator.notAchieved.push({
              id: badge.id,
              name: badge.name,
              description: badge.description,
              category: badge.category,
              isTier: !!isTierBadge,
              completedAt: null,
              assets: isTierBadge ? badge.tiers![0].assets : badge.assets,
              progress: {
                stepsDone: badgeProgress.progress.steps,
                nextStepsTarget: isTierBadge ? badge.tiers![0].criteria.steps : badge.criteria.steps,
                totalStepsTarget: isTierBadge
                  ? badge.tiers![badge.tiers!.length - 1].criteria.steps
                  : badge.criteria.steps
              }
            })
          }

          return accumulator
        },
        { achieved: [] as any, notAchieved: [] as any }
      )

      return badgesProgresses
    } catch (error: any) {
      logger.error('Error calculating user progress:', error.message)
      logger.debug('Stack trace:', error.stack)
      throw error
    }
  }

  function getCurrentTierProgress(
    badge: Badge,
    userProgress: Pick<UserBadge, 'achieved_tiers'>
  ): { nextTier: BadgeTier | undefined; currentTier: BadgeTier | undefined } {
    const lastAccomplishedTarget = userProgress.achieved_tiers!.length
      ? userProgress.achieved_tiers![userProgress.achieved_tiers!.length - 1]
      : undefined

    const currentAchievedTier = lastAccomplishedTarget
      ? badge.tiers!.find((tier) => tier.tierId === lastAccomplishedTarget.tier_id)
      : undefined

    const nextTierToAccomplish = lastAccomplishedTarget
      ? badge.tiers![badge.tiers!.findIndex((tier) => tier.tierId === lastAccomplishedTarget.tier_id) + 1]
      : badge.tiers![0]

    return { nextTier: nextTierToAccomplish, currentTier: currentAchievedTier }
  }

  async function resetUserProgressFor(badgeId: BadgeId, address: EthAddress): Promise<void> {
    return db.deleteUserProgress(badgeId, address)
  }

  async function saveOrUpdateUserProgresses(userBadges: UserBadge[]): Promise<void> {
    await db.saveUserProgresses(userBadges)
  }

  return {
    getBadge,
    getBadges,
    getAllBadges,
    getUserStates,
    getUserState,
    getLatestAchievedBadges,
    calculateUserProgress,
    resetUserProgressFor,
    saveOrUpdateUserProgresses
  }
}
