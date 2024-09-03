import { Badge, BadgeId, BadgeTier, UserBadge } from '@badges/common'
import { AppComponents, IUserProgressValidator } from '../types'
import { InvalidRequestError } from '@dcl/platform-server-commons'

function validateTravelerProgress(data: { progress: any }): boolean {
  if (!Array.isArray(data.progress.scenesVisited)) return false
  if (
    !data.progress.scenesVisited.every(
      (sceneVisited: any) => typeof sceneVisited.sceneTitle === 'string' && Number.isInteger(sceneVisited.firstVisitAt)
    )
  ) {
    return false
  }

  return true
}

export function createBackfillMergerComponent({
  logs,
  badgeService
}: Pick<AppComponents, 'logs' | 'badgeService'>): IUserProgressValidator {
  const logger = logs.getLogger('backfill-merger')

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

    const visitedScenes = new Set<string>([
      ...userProgress.progress.scenes_titles_visited,
      ...backfillData.progress.scenesVisited.map((sceneVisited: any) => sceneVisited.sceneTitle)
    ])

    userProgress.progress = {
      ...userProgress.progress,
      scenes_titles_visited: Array.from(visitedScenes),
      steps: visitedScenes.size
    }

    const newAchievedTiersWithCompletedAt = backfillData.progress.scenesVisited
      // sort events (asc) by firstVisitAt
      .sort(
        (
          sceneA: { firstVisitAt: number; sceneTitle: string },
          sceneB: { firstVisitAt: number; sceneTitle: string }
        ) => {
          return sceneA.firstVisitAt - sceneB.firstVisitAt
        }
      )
      // get new achieved tiers and updated ones
      .reduce(
        (acc: any, scene: { firstVisitAt: number; sceneTitle: string }) => {
          acc.steps = acc.steps + 1
          const didAchieveTier = badge.tiers!.find((tier: BadgeTier) => {
            return tier.criteria.steps === acc.steps
          })

          const tierAlreadyGranted = userProgress.achieved_tiers?.find(
            (achievedTier: { tier_id: string; completed_at: number }) => achievedTier.tier_id === didAchieveTier?.tierId
          )

          if (didAchieveTier) {
            acc.achieved_tiers.push({
              tier_id: didAchieveTier.tierId,
              completed_at:
                tierAlreadyGranted && tierAlreadyGranted.completed_at > scene.firstVisitAt
                  ? scene.firstVisitAt
                  : tierAlreadyGranted!.completed_at
            })
          }

          return acc
        },
        { steps: 0, achieved_tiers: [] }
      )

    userProgress.achieved_tiers = newAchievedTiersWithCompletedAt.achieved_tiers.flat()

    return userProgress
  }

  function mergeUserProgress(
    badgeId: BadgeId,
    userAddress: string,
    currentUserProgress: UserBadge | undefined,
    backfillData: any
  ): UserBadge {
    try {
      switch (badgeId) {
        case BadgeId.TRAVELER:
          return mergeTravelerProgress(userAddress, currentUserProgress, backfillData)
        default:
          throw new InvalidRequestError('Invalid Badge ID')
      }
    } catch (error: any) {
      logger.error('Failure while backfilling badge', { error: error.message, stack: JSON.stringify(error.stack) })
      throw new InvalidRequestError('Could not backfill this badge')
    }
  }

  return {
    mergeUserProgress
  }
}
