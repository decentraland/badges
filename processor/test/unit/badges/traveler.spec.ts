import { createLogComponent } from '@well-known-components/logger'
import { createDbMock } from '../../mocks/db-mock'
import { AppComponents } from '../../../src/types'
import { AuthLinkType, Events, MoveToParcelEvent } from '@dcl/schemas'
import { createTravelerObserver } from '../../../src/logic/badges/traveler'
import { Badge, BadgeId } from '@badges/common'

describe('Traveler badge handler should', () => {
  const testAddress = '0xTest'
  const testSessionId = 'testsessionid'
  const testSceneTitles = {
    SCENE_TITLE_A: 'scene-title-a',
    SCENE_TITLE_B: 'scene-title-b',
    SCENE_TITLE_C: 'scene-title-c'
  }
  const timestamps = {
    now: () => Date.now(),
    oneMinuteBefore: (from: number) => from - 60 * 1000,
    twoMinutesBefore: (from: number) => from - 2 * 60 * 1000,
    tenSecondsBefore: (from: number) => from - 10 * 1000,
    thirtySecondsBefore: (from: number) => from - 30 * 1000,
    thirtySecondsInFuture: (from: number) => from + 30 * 1000
  }

  it('save arriving event in the cache when it is the first move of the user on this session', async () => {
    const { db, logs, badgeContext, memoryStorage } = await getMockedComponents()
    const event: MoveToParcelEvent = createMovementEvent()
    const eventCacheKey = `${event.metadata.userAddress}-${event.metadata.sessionId}-${event.subType}`

    memoryStorage.get = jest.fn().mockReturnValue(undefined)
    db.getUserProgressFor = jest.fn().mockResolvedValue(undefined)
    badgeContext.getEntityByPointer = jest.fn().mockResolvedValue({
      metadata: {
        display: {
          title: testSceneTitles.SCENE_TITLE_A
        }
      }
    })

    const handler = createTravelerObserver({ db, logs, badgeContext, memoryStorage })
    const result = await handler.check(event)

    expect(result).toBeUndefined()
    expect(memoryStorage.get).toHaveBeenCalledWith(eventCacheKey)
    expect(memoryStorage.get).toHaveBeenCalledTimes(1)
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('save arriving event in the cache when the scenes was already visited by the user in the past', async () => {
    const { db, logs, badgeContext, memoryStorage } = await getMockedComponents()
    const event: MoveToParcelEvent = createMovementEvent()
    const eventCacheKey = `${event.metadata.userAddress}-${event.metadata.sessionId}-${event.subType}`

    memoryStorage.get = jest.fn().mockReturnValue(undefined)
    db.getUserProgressFor = jest.fn().mockResolvedValue({
      user_address: testAddress,
      badge_id: BadgeId.TRAVELER,
      progress: {
        steps: 1,
        scenes_titles_visited: [testSceneTitles.SCENE_TITLE_A],
      },
      achieved_tiers: [
        {
          completed_at: timestamps.twoMinutesBefore(event.timestamp),
          tier_id: 'traveler-starter'
        }
      ]
    })
    badgeContext.getEntityByPointer = jest.fn().mockResolvedValue({
      metadata: {
        display: {
          title: testSceneTitles.SCENE_TITLE_A
        }
      }
    })

    const handler = createTravelerObserver({ db, logs, badgeContext, memoryStorage })
    const result = await handler.check(event)

    expect(result).toBeUndefined()
    expect(memoryStorage.get).toHaveBeenCalledWith(eventCacheKey)
    expect(memoryStorage.get).toHaveBeenCalledTimes(1)
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('mark scene as visited and grant first tier of badge if the user spent more than a minute on it', async () => {
    const { db, logs, badgeContext, memoryStorage } = await getMockedComponents()
    const event: MoveToParcelEvent = createMovementEvent()
    const eventCacheKey = `${event.metadata.userAddress}-${event.metadata.sessionId}-${event.subType}`

    db.getUserProgressFor = jest.fn().mockResolvedValue(undefined)
    memoryStorage.get = jest.fn().mockReturnValue([
      {
        sceneTitle: testSceneTitles.SCENE_TITLE_A,
        on: timestamps.twoMinutesBefore(event.timestamp)
      }
    ])
    badgeContext.getEntityByPointer = jest.fn().mockResolvedValue({
      metadata: {
        display: {
          title: testSceneTitles.SCENE_TITLE_A
        }
      }
    })

    const handler = createTravelerObserver({ db, logs, badgeContext, memoryStorage })
    const result = await handler.check(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(0, handler.badge),
      userAddress: testAddress
    })
    expect(memoryStorage.get).toHaveBeenCalledWith(eventCacheKey)
    expect(memoryStorage.get).toHaveBeenCalledTimes(1)
    expect(db.saveUserProgress).toHaveBeenCalledWith({
      user_address: testAddress,
      badge_id: BadgeId.TRAVELER,
      progress: {
        steps: 1,
        scenes_titles_visited: [testSceneTitles.SCENE_TITLE_A],
      },
      achieved_tiers: [
        {
          completed_at: expect.any(Number),
          tier_id: 'traveler-starter'
        }
      ]
    })
  })

  it('mark scene as visited and grant first tier of badge if the user spent more than (or exactly) a minute on it in 2 different visits', async () => {
    const { db, logs, badgeContext, memoryStorage } = await getMockedComponents()
    const event: MoveToParcelEvent = createMovementEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })
    const eventCacheKey = `${event.metadata.userAddress}-${event.metadata.sessionId}-${event.subType}`

    db.getUserProgressFor = jest.fn().mockResolvedValue(undefined)
    memoryStorage.get = jest.fn().mockReturnValue([
      {
        sceneTitle: testSceneTitles.SCENE_TITLE_A,
        on: timestamps.tenSecondsBefore(timestamps.oneMinuteBefore(event.timestamp))
      },
      {
        sceneTitle: testSceneTitles.SCENE_TITLE_B,
        on: timestamps.tenSecondsBefore(event.timestamp)
      }
    ])
    badgeContext.getEntityByPointer = jest.fn().mockResolvedValue({
      metadata: {
        display: {
          title: testSceneTitles.SCENE_TITLE_A
        }
      }
    })

    const handler = createTravelerObserver({ db, logs, badgeContext, memoryStorage })
    const result = await handler.check(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(0, handler.badge),
      userAddress: testAddress
    })
    expect(memoryStorage.get).toHaveBeenCalledWith(eventCacheKey)
    expect(memoryStorage.get).toHaveBeenCalledTimes(1)
    expect(db.saveUserProgress).toHaveBeenCalledWith({
      user_address: testAddress,
      badge_id: BadgeId.TRAVELER,
      progress: {
        steps: 1,
        scenes_titles_visited: [testSceneTitles.SCENE_TITLE_A],
      },
      achieved_tiers: [
        {
          completed_at: expect.any(Number),
          tier_id: 'traveler-starter'
        }
      ]
    })
  })

  it('mark scene as visited and grant second tier of badge if the user spent more than (or exactly) a minute on a scene for the 50th time', async () => {
    const { db, logs, badgeContext, memoryStorage } = await getMockedComponents()
    const event: MoveToParcelEvent = createMovementEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })
    const eventCacheKey = `${event.metadata.userAddress}-${event.metadata.sessionId}-${event.subType}`

    const visitedSceneTitles = createRandomSceneTitles(49)
    db.getUserProgressFor = jest.fn().mockResolvedValue({
      user_address: testAddress,
      badge_id: BadgeId.TRAVELER,
      progress: {
        steps: 49,
        scenes_titles_visited: visitedSceneTitles,
      },
      achieved_tiers: [
        {
          completed_at: timestamps.twoMinutesBefore(timestamps.now()),
          tier_id: 'traveler-starter'
        }
      ]
    })
    memoryStorage.get = jest.fn().mockReturnValue([
      {
        sceneTitle: testSceneTitles.SCENE_TITLE_A,
        on: timestamps.tenSecondsBefore(timestamps.oneMinuteBefore(event.timestamp))
      },
      {
        sceneTitle: testSceneTitles.SCENE_TITLE_B,
        on: timestamps.tenSecondsBefore(event.timestamp)
      }
    ])
    badgeContext.getEntityByPointer = jest.fn().mockResolvedValue({
      metadata: {
        display: {
          title: testSceneTitles.SCENE_TITLE_A
        }
      }
    })

    const handler = createTravelerObserver({ db, logs, badgeContext, memoryStorage })
    const result = await handler.check(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(1, handler.badge),
      userAddress: testAddress
    })
    expect(memoryStorage.get).toHaveBeenCalledWith(eventCacheKey)
    expect(memoryStorage.get).toHaveBeenCalledTimes(1)
    expect(db.saveUserProgress).toHaveBeenCalledWith({
      user_address: testAddress,
      badge_id: BadgeId.TRAVELER,
      progress: {
        steps: 50,
        scenes_titles_visited: [testSceneTitles.SCENE_TITLE_A, ...visitedSceneTitles],
      },
      achieved_tiers: [
        {
          completed_at: expect.any(Number),
          tier_id: 'traveler-starter'
        },
        {
          completed_at: expect.any(Number),
          tier_id: 'traveler-bronze'
        }
      ]
    })
  })

  // Helpers
  async function getMockedComponents(): Promise<Pick<AppComponents, 'db' | 'logs' | 'badgeContext' | 'memoryStorage'>> {
    return {
      db: createDbMock(),
      badgeContext: {
        getWearablesWithRarity: jest.fn(),
        getEntityById: jest.fn(),
        getEntityByPointer: jest.fn()
      },
      memoryStorage: {
        get: jest.fn(),
        set: jest.fn()
      },
      logs: await createLogComponent({ config: { requireString: jest.fn(), getString: jest.fn() } as any })
    }
  }

  function createMovementEvent(
    options: { sessionId: string; timestamp: number } = { sessionId: testSessionId, timestamp: Date.now() }
  ): MoveToParcelEvent {
    return {
      type: Events.Type.CLIENT,
      subType: Events.SubType.Client.MOVE_TO_PARCEL,
      key: 'aKey',
      timestamp: options.timestamp,
      metadata: {
        authChain: [
          {
            payload: 'auth-chain-payload',
            type: AuthLinkType.SIGNER
          }
        ],
        parcel: {
          isEmptyParcel: false,
          newParcel: '0,1',
          oldParcel: undefined,
          sceneHash: 'aSceneHash'
        },
        sessionId: options.sessionId,
        timestamp: options.timestamp,
        userAddress: testAddress,
        realm: 'main'
      }
    }
  }

  function mapBadgeToHaveTierNth(index: number, badge: Badge): Badge {
    return {
      ...badge,
      tiers: [badge.tiers[index]]
    }
  }

  function createRandomSceneTitles(amount: number): string[] {
    return Array.from({ length: amount }, (_, i) => `scene-${i}`)
  }
})
