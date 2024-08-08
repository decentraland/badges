import { Badge, BadgeId, UserBadge } from '@badges/common'
import { AppComponents, IObserver } from '../../types'
import { Entity, EthAddress, MoveToParcelEvent } from '@dcl/schemas'
import { CachedEvent } from '../../adapters/memory-cache'

export function createTravelerObserver({
  db,
  badgeContext,
  logs,
  memoryStorage
}: Pick<AppComponents, 'db' | 'badgeContext' | 'logs' | 'memoryStorage'>): IObserver {
  const logger = logs.getLogger('traveler-badge')

  const commonBadgeData: Badge = {
    id: BadgeId.TRAVELER,
    name: 'Traveler',
    description: `
      Starter: 1 Genesis City scene explored
      Bronze: 50 Genesis City scenes explored
      Silver: 250 Genesis City scenes explored
      Gold: 1,000 Genesis City scenes explored
      Platinum: 2,500 Genesis City scenes explored
      Diamond: 10,000 Genesis City scenes explored
      `
  }
  // tier badges
  const tieredBadges: Badge[] = [
    {
      ...commonBadgeData,
      tier: {
        tierId: 1,
        tierName: 'Starter',
        criteria: { scenesVisited: 1 },
        description: '1 Genesis City scene explored',
        image: 'lorem ipsum 1'
      }
    },
    {
      ...commonBadgeData,
      tier: {
        tierId: 2,
        tierName: 'Bronze',
        criteria: { scenesVisited: 50 },
        description: 'Bronze: 50 Genesis City scenes explored',
        image: 'lorem ipsum 2'
      }
    },
    {
      ...commonBadgeData,
      tier: {
        tierId: 3,
        tierName: 'Silver',
        criteria: { scenesVisited: 250 },
        description: 'Silver: 250 Genesis City scenes explored',
        image: 'lorem ipsum 3'
      }
    },
    {
      ...commonBadgeData,
      tier: {
        tierId: 4,
        tierName: 'Gold',
        criteria: { scenesVisited: 1000 },
        description: 'Gold: 1,000 Genesis City scenes explored',
        image: 'lorem ipsum 4'
      }
    },
    {
      ...commonBadgeData,
      tier: {
        tierId: 5,
        tierName: 'Platinum',
        criteria: { scenesVisited: 2500 },
        description: 'Platinum: 2,500 Genesis City scenes explored',
        image: 'lorem ipsum 5'
      }
    },
    {
      ...commonBadgeData,
      tier: {
        tierId: 6,
        tierName: 'Diamond',
        criteria: { scenesVisited: 10000 },
        description: 'Diamond: 10,000 Genesis City scenes explored',
        image: 'lorem ipsum 6'
      }
    }
  ]

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
        userAddress: userAddress,
        badgeId: BadgeId.TRAVELER
      })

      return undefined
    }

    const fetchedScene: Entity = await badgeContext.getEntityById(event.metadata.parcel.sceneHash)
    const sceneTitle: string | undefined = fetchedScene.metadata.display?.title || undefined

    if (!sceneTitle) {
      return undefined
    }

    const priorMovementEvents: CachedEvent[] = memoryStorage.get({
      eventSubType: event.subType,
      sessionId: event.metadata.sessionId,
      userAddress: event.metadata.userAddress
    })

    if (!priorMovementEvents.length) {
      memoryStorage.set(
        {
          eventSubType: event.subType,
          userAddress: event.metadata.userAddress,
          sessionId: event.metadata.sessionId
        },
        [
          {
            type: event.type,
            subType: event.subType,
            timestamp: event.timestamp,
            userAddress: event.metadata.userAddress,
            sessionId: event.metadata.sessionId,
            metadata: {
              sceneTitle: sceneTitle,
              acknowledged: false
            }
          }
        ]
      )
      return undefined
    } else {
      const storedEventsToAcknowledge: CachedEvent[] = priorMovementEvents.map((priorEvent) => ({
        ...priorEvent,
        metadata: {
          ...priorEvent.metadata,
          acknowledged: hasPassedMoreThanOneMinuteBetween(priorEvent.timestamp, event.timestamp)
        }
      }))

      const splittedEvents: { acknowledgedEvents: CachedEvent[]; unacknowledgedEvents: CachedEvent[] } =
        storedEventsToAcknowledge.reduce(
          (acc, priorEvent: CachedEvent) => {
            if (priorEvent.metadata.acknowledged) {
              acc.acknowledgedEvents.push(priorEvent)
            } else {
              acc.unacknowledgedEvents.push(priorEvent)
            }
            return acc
          },
          { acknowledgedEvents: [] as CachedEvent[], unacknowledgedEvents: [] as CachedEvent[] }
        )

      memoryStorage.set(
        {
          eventSubType: event.subType,
          userAddress: event.metadata.userAddress,
          sessionId: event.metadata.sessionId
        },
        [
          ...splittedEvents.unacknowledgedEvents,
          {
            type: event.type,
            subType: event.subType,
            timestamp: event.timestamp,
            userAddress: event.metadata.userAddress,
            sessionId: event.metadata.sessionId,
            metadata: {
              sceneTitle: sceneTitle,
              acknowledged: false
            }
          }
        ]
      )

      const seenSceneTitles = new Set([
        ...splittedEvents.acknowledgedEvents.map((event) => event.metadata.sceneTitle),
        ...(userProgress.progress.global.scenesTitlesVisited || [])
      ])

      userProgress.progress = {
        ...userProgress.progress,
        global: {
          scenesVisited: seenSceneTitles.size,
          scenesTitlesVisited: seenSceneTitles
        }
      }

      // find all badges that the user has achieved
      const newAchievedBadges = tieredBadges.filter(
        (badge) =>
          badge.tier!.criteria.scenesVisited <= userProgress.progress.global.scenesVisited &&
          !userProgress.progress.achievedBadgesIds.includes(badge.tier!.tierId)
      )

      if (newAchievedBadges.length) {
        ;(userProgress.progress.achievedBadgesIds || []).push(...newAchievedBadges.map((badge) => badge.tier!.tierId))
      }

      if (userProgress.progress.achievedBadgesIds.length === tieredBadges.length) {
        userProgress.completed_at = Date.now()
      }

      await db.saveUserProgress(userProgress)

      return newAchievedBadges.length ? newAchievedBadges : undefined
    }
  }

  function hasPassedMoreThanOneMinuteBetween(firsTimestamp: number, secondTimestamp: number): boolean {
    return Math.abs(secondTimestamp - firsTimestamp) > 60 * 1000 // > one minute in milliseconds
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
        achievedBadgesIds: []
      }
    }
  }

  return {
    check,
    badge: commonBadgeData
  }
}
