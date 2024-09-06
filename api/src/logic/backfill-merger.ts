import { Badge, BadgeId, BadgeTier, UserBadge } from '@badges/common'
import { AppComponents, IUserProgressValidator } from '../types'
import { InvalidRequestError } from '@dcl/platform-server-commons'
import { EthAddress } from '@dcl/schemas'
import { parseUrn } from '@dcl/urn-resolver'

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

async function validateWearablesEquipementRelatedBadgesProgress(data: { progress: any }): Promise<boolean> {
  if (!Array.isArray(data.progress.completedWith)) return false
  if (!data.progress.completedAt || !Number.isInteger(data.progress.completedAt)) return false
  if (!data.progress.completedWith.every((wearableUrn: any) => typeof wearableUrn === 'string')) return false

  const allUrnsValidations = await Promise.all(
    data.progress.completedWith.map((wearableUrn: any) => parseUrn(wearableUrn))
  )
  if (allUrnsValidations.includes(null)) return false

  return true
}

export function createBackfillMergerComponent({
  logs,
  badgeService
}: Pick<AppComponents, 'logs' | 'badgeService'>): IUserProgressValidator {
  const logger = logs.getLogger('backfill-merger')

  async function mergeTravelerProgress(
    userAddress: string,
    currentUserProgress: UserBadge | undefined,
    backfillData: any
  ): Promise<UserBadge> {
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
                !!tierAlreadyGranted && tierAlreadyGranted?.completed_at < scene.firstVisitAt
                  ? tierAlreadyGranted!.completed_at
                  : scene.firstVisitAt
            })
          }

          return acc
        },
        { steps: 0, achieved_tiers: [] }
      )

    userProgress.achieved_tiers = newAchievedTiersWithCompletedAt.achieved_tiers.flat()

    return userProgress
  }

  async function mergeWearablesEquipementRelatedBadgesProgress(
    userAddress: EthAddress,
    currentUserProgress: UserBadge | undefined,
    backfillData: any
  ): Promise<UserBadge> {
    const badge: Badge = badgeService.getBadge(backfillData.badgeId)!
    if (!badge || !validateWearablesEquipementRelatedBadgesProgress(backfillData)) {
      throw new InvalidRequestError('Invalid back-fill data')
    }

    const userProgress = currentUserProgress || {
      user_address: userAddress,
      badge_id: backfillData.badgeId,
      completed_at: 0,
      progress: {
        steps: 1,
        completed_with: []
      }
    }

    if (backfillData.progress.completedAt < userProgress.progress.completedAt) {
      userProgress.completed_at = backfillData.progress.completedAt
      userProgress.progress.completed_with = backfillData.progress.completedWith
    }

    return userProgress
  }

  function mergeUserProgress(
    badgeId: BadgeId,
    userAddress: string,
    currentUserProgress: UserBadge | undefined,
    backfillData: any
  ): Promise<UserBadge> {
    try {
      switch (badgeId) {
        case BadgeId.TRAVELER:
          return mergeTravelerProgress(userAddress, currentUserProgress, backfillData)
        case BadgeId.REGALLY_RARE:
        case BadgeId.EXOTIC_ELEGANCE:
        case BadgeId.EPIC_ENSEMBLE:
        case BadgeId.UNIQUE_UNICORN:
        case BadgeId.LEGENDARY_LOOK:
        case BadgeId.MYTHIC_MODEL:
          return mergeWearablesEquipementRelatedBadgesProgress(userAddress, currentUserProgress, backfillData)

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
