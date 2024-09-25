import { Badge, BadgeId, UserBadge } from '@badges/common'
import { AppComponents, BadgeProcessorResult, IObserver } from '../../types'
import { Entity, EthAddress, Events, MoveToParcelEvent } from '@dcl/schemas'

export function createTravelerObserver({
  db,
  logs,
  badgeContext,
  badgeStorage,
  memoryStorage
}: Pick<AppComponents, 'db' | 'logs' | 'badgeContext' | 'badgeStorage' | 'memoryStorage'>): IObserver {
  const logger = logs.getLogger('traveler-badge')
  const badgeId: BadgeId = BadgeId.TRAVELER
  const badge: Badge = badgeStorage.getBadge(badgeId)
  const tieredBadges = badge.tiers!

  function isFirstMovement(movementEvents: any[]): boolean {
    return movementEvents.length === 1
  }

  function userAlreadyVisitedScene(sceneTitle: string, userProgress: UserBadge): boolean {
    return userProgress.progress.scenes_titles_visited.includes(sceneTitle)
  }

  function getUserAddress(event: MoveToParcelEvent): EthAddress {
    return event.metadata.userAddress
  }

  async function handle(
    event: MoveToParcelEvent,
    userProgress: UserBadge | undefined
  ): Promise<BadgeProcessorResult | undefined> {
    // if tile is not a valid scene, return
    if (event.metadata.parcel.isEmptyParcel || !event.metadata.parcel.newParcel) {
      return undefined
    }

    const userAddress = getUserAddress(event)

    userProgress ||= initProgressFor(userAddress)

    if (userProgress.completed_at) {
      logger.info('User already has badge', {
        userAddress,
        badgeId: badgeId
      })

      return undefined
    }

    const parsedPointer = event.metadata.parcel.newParcel.replace(/[()\s]/g, '')
    const scene: Entity = await badgeContext.getEntityByPointer(parsedPointer)
    const sceneTitle: string | undefined = scene?.metadata?.display?.title || undefined
    logger.debug(`Fetched scene for pointer ${parsedPointer}`, { fetchedScene: JSON.stringify(scene) })

    if (!sceneTitle) {
      return undefined
    }

    const cacheKeyRelatedToEvent = `${userAddress}-${event.metadata.sessionId}-${event.subType}`
    const movementEvents: { sceneTitle: string; on: number }[] = [
      ...(memoryStorage.get(cacheKeyRelatedToEvent) || []),
      {
        sceneTitle,
        on: new Date(event.timestamp).getTime()
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
      ...userProgress.progress.scenes_titles_visited
    ])

    userProgress.progress = {
      ...userProgress.progress,
      scenes_titles_visited: Array.from(seenSceneTitles),
      steps: seenSceneTitles.size
    }

    // find all tiers that the user has achieved on this movement
    const newAchievedBadges = tieredBadges.filter(
      (badge) =>
        badge.criteria.steps <= userProgress.progress.steps &&
        !userProgress.achieved_tiers!.find(
          (achievedTier: { tier_id: string; completed_at: number }) => achievedTier.tier_id === badge.tierId
        )
    )

    if (newAchievedBadges.length) {
      userProgress.achieved_tiers!.push(
        ...newAchievedBadges.map((newAchievedBadge) => ({
          tier_id: newAchievedBadge.tierId,
          completed_at: Date.now()
        }))
      )
    }

    if (userProgress.achieved_tiers!.length === tieredBadges.length) {
      userProgress.completed_at = Date.now()
    }

    await db.saveUserProgress(userProgress)

    return newAchievedBadges.length
      ? {
          badgeGranted: {
            ...badge,
            tiers: newAchievedBadges
          },
          userAddress
        }
      : undefined
  }

  function initProgressFor(userAddress: EthAddress): Omit<UserBadge, 'updated_at'> {
    return {
      user_address: userAddress,
      badge_id: badgeId,
      progress: {
        steps: 0,
        scenes_titles_visited: []
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
        subType: Events.SubType.Client.MOVE_TO_PARCEL
      }
    ]
  }
}
