import { Badge, BadgeId, badges, UserBadge } from '@badges/common'
import { AppComponents, IObserver } from '../../types'
import { Entity, EthAddress, MoveToParcelEvent } from '@dcl/schemas'

export function createTravelerObserver({
  db,
  badgeContext,
  logs,
  memoryStorage
}: Pick<AppComponents, 'db' | 'badgeContext' | 'logs' | 'memoryStorage'>): IObserver {
  const logger = logs.getLogger('traveler-badge')

  const badge: Badge = badges.get(BadgeId.TRAVELER)!
  const tieredBadges = badge.tiers!

  function isFirstMovement(movementEvents: any[]): boolean {
    return movementEvents.length === 1
  }

  function userAlreadyVisitedScene(sceneTitle: string, userProgress: UserBadge): boolean {
    return userProgress.progress.global.scenesTitlesVisited.includes(sceneTitle)
  }

  async function check(event: MoveToParcelEvent): Promise<Badge[] | undefined> {
    // if tile is not a valid scene, return
    if (event.metadata.parcel.isEmptyParcel || !event.metadata.parcel.sceneHash) {
      return undefined
    }

    const userAddress = event.metadata.userAddress

    const userProgress: UserBadge =
      (await db.getUserProgressFor(BadgeId.TRAVELER, userAddress)) || initProgressFor(userAddress)

    if (userProgress.completed_at) {
      logger.info('User already has badge', {
        userAddress,
        badgeId: BadgeId.TRAVELER
      })

      return undefined
    }

    const scene: Entity = await badgeContext.getEntityById(event.metadata.parcel.sceneHash)
    const sceneTitle: string | undefined = scene.metadata.display?.title || undefined

    if (!sceneTitle) {
      return undefined
    }

    const cacheKeyRelatedToEvent = `${userAddress}-${event.metadata.sessionId}-${event.subType}`
    const movementEvents: { sceneTitle: string; on: number }[] = [
      ...(memoryStorage.get(cacheKeyRelatedToEvent) || []),
      {
        sceneTitle,
        on: event.timestamp
      }
    ]

    memoryStorage.set(cacheKeyRelatedToEvent, movementEvents)
    if (isFirstMovement(movementEvents) || userAlreadyVisitedScene(sceneTitle, userProgress)) {
      return undefined
    }

    // calculate how long the user spent on sceneTitle
    const aggregatedTimeSpentOnUnvisitedScenes = movementEvents.reduce(
      (acc: { [key: string]: number }, movementEvent: any, index: number) => {
        if (userAlreadyVisitedScene(movementEvent.sceneTitle, userProgress)) {
          return acc
        }

        const timeSpent =
          index === movementEvents.length - 1 ? undefined : movementEvents[index + 1].on - movementEvent.on

        if (timeSpent === undefined) {
          return acc
        }

        if (!acc[movementEvent.sceneTitle]) {
          acc[movementEvent.sceneTitle] = 0
        }
        acc[movementEvent.sceneTitle] += timeSpent

        return acc
      },
      {}
    )

    // find sceneTitles where the user spent more than (or at least) one minute
    const sceneTitlesWhereUserSpentMoreThanOneMinute = Object.entries(aggregatedTimeSpentOnUnvisitedScenes)
      .filter(([_sceneTitle, timeSpent]) => (timeSpent as number) >= 60 * 1000)
      .map(([sceneTitle]) => sceneTitle)

    const seenSceneTitles = new Set([
      ...sceneTitlesWhereUserSpentMoreThanOneMinute,
      ...userProgress.progress.global.scenesTitlesVisited
    ])

    userProgress.progress = {
      ...userProgress.progress,
      global: {
        scenesVisited: seenSceneTitles.size,
        scenesTitlesVisited: Array.from(seenSceneTitles)
      }
    }

    // find all tiers that the user has achieved on this movement
    const newAchievedBadges = tieredBadges.filter(
      (badge) =>
        badge.criteria.scenesVisited <= userProgress.progress.global.scenesVisited &&
        !userProgress.progress.achievedTiers.find(
          (achievedTier: { tierId: number; completed_at: number }) => achievedTier.tierId === badge.tierId
        )
    )

    if (newAchievedBadges.length) {
      userProgress.progress.achievedTiers.push(
        ...newAchievedBadges.map((badge) => ({ tierId: badge.tierId, completed_at: Date.now() }))
      )
    }

    if (userProgress.progress.achievedTiers.length === tieredBadges.length) {
      userProgress.completed_at = Date.now()
    }

    await db.saveUserProgress(userProgress)

    return newAchievedBadges.length
      ? [
          {
            ...badge,
            tiers: newAchievedBadges
          }
        ]
      : undefined
  }

  function initProgressFor(userAddress: EthAddress): UserBadge {
    return {
      user_address: userAddress,
      badge_id: BadgeId.TRAVELER,
      progress: {
        global: {
          scenesVisited: 0,
          scenesTitlesVisited: []
        },
        achievedTiers: []
      }
    }
  }

  return {
    check,
    badge
  }
}
