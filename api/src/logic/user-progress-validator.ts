import { Badge, BadgeId, UserBadge } from '@badges/common'
import { AppComponents, IUserProgressValidator } from '../types'
import { InvalidRequestError } from '@dcl/platform-server-commons'

function validateTravelerProgress(data: { progress: any; completedAt: number }): boolean {
  if (typeof data.completedAt !== 'number') return false
  if (!Array.isArray(data.progress.scenesVisited)) return false
  if (
    !data.progress.scenesVisited.every(
      (sceneVisited: any) => typeof sceneVisited.sceneTitle === 'string' && Number.isInteger(sceneVisited.firstVisitAt)
    )
  )
    return false

  return true
}

export function createBackfillMergerComponent({
  badgeService
}: Pick<AppComponents, 'badgeService'>): IUserProgressValidator {
  function mergeTravelerProgress(
    userAddress: string,
    currentUserProgress: UserBadge | undefined,
    backfillData: any
  ): UserBadge {
    if (!validateTravelerProgress(backfillData)) {
      throw new InvalidRequestError('Invalid back-fill data')
    }

    const badge: Badge = badgeService.getBadge(BadgeId.TRAVELER)!

    const userProgress = currentUserProgress || {
      user_address: userAddress,
      badge_id: BadgeId.TRAVELER,
      progress: {
        steps: 0,
        scenes_titles_visited: []
      },
      achieved_tiers: []
    }

    const visitedScenes = new Set<string>(
      ...userProgress.progress.scenes_titles_visited,
      ...backfillData.progress.scenesVisited.map((sceneVisited: any) => sceneVisited.sceneTitle)
    )
    userProgress.progress = {
      ...userProgress.progress,
      scenes_titles_visited: Array.from(visitedScenes),
      steps: visitedScenes.size
    }

    const newAchievedTiers = badgeService
      .calculateNewAchievedTiers(badge, userProgress)
      .filter(
        (tier) =>
          tier.criteria.steps <= userProgress.progress.steps &&
          !userProgress.achieved_tiers?.find((achievedTier) => achievedTier.tier_id === tier.tierId)
      )
      .map((tier) => ({
        tier_id: tier.tierId,
        steps: tier.criteria.steps
      }))

    const newAchievedTiersWithCompletedAt = backfillData.progress.scenesVisited
      .sort(
        (
          sceneA: { firstVisitAt: number; sceneTitle: string },
          sceneB: { firstVisitAt: number; sceneTitle: string }
        ) => {
          return sceneA.firstVisitAt - sceneB.firstVisitAt
        }
      )
      .reduce(
        (acc: any, scene: { firstVisitAt: number; sceneTitle: string }) => {
          acc.steps = acc.steps + 1
          const didAchieveTier = newAchievedTiers.find((tier: { tier_id: string; steps: number }) => {
            return tier.steps === acc.steps
          })

          const tierAlreadyGranted = userProgress.achieved_tiers?.find(
            (achievedTier: { tier_id: string; completed_at: number }) =>
              achievedTier.tier_id === didAchieveTier?.tier_id
          )

          if (didAchieveTier && (!tierAlreadyGranted || tierAlreadyGranted.completed_at > scene.firstVisitAt)) {
            acc.achieved_tiers.push({
              tier_id: didAchieveTier.tier_id,
              completed_at: scene.firstVisitAt
            })
          }
        },
        { steps: 0 }
      )

    userProgress.achieved_tiers!.push(...newAchievedTiersWithCompletedAt)

    return userProgress
  }

  function mergeUserProgress(
    badgeId: BadgeId,
    userAddress: string,
    currentUserProgress: UserBadge | undefined,
    backfillData: any
  ): UserBadge {
    switch (badgeId) {
      case BadgeId.TRAVELER:
        return mergeTravelerProgress(userAddress, currentUserProgress, backfillData)
      default:
        throw new InvalidRequestError('Invalid Badge ID')
    }
  }

  return {
    mergeUserProgress
  }
}
