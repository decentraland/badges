import { createLogComponent } from '@well-known-components/logger'
import { createDbMock } from '../../mocks/db-mock'
import { AppComponents } from '../../../src/types'
import { AuthLinkType, Events, MoveToParcelEvent } from '@dcl/schemas'
import { createTravelerObserver } from '../../../src/logic/badges/traveler'
import { BadgeId } from '@badges/common'

describe('Traveler badge handler should', () => {
  const testAddress = '0xTest'

  async function getMockedComponents(): Promise<Pick<AppComponents, 'db' | 'logs' | 'badgeContext' | 'memoryStorage'>> {
    return {
      db: createDbMock(),
      badgeContext: {
        getWearablesWithRarity: jest.fn(),
        getEntityById: jest.fn()
      },
      memoryStorage: {
        get: jest.fn(),
        set: jest.fn()
      },
      logs: await createLogComponent({ config: { requireString: jest.fn(), getString: jest.fn() } as any })
    }
  }

  it('save arriving event in the cache when a user moves to a parcel for the first time', async () => {
    const { db, logs, badgeContext, memoryStorage } = await getMockedComponents()

    const event: MoveToParcelEvent = {
      type: Events.Type.CLIENT,
      subType: Events.SubType.Client.MOVE_TO_PARCEL,
      key: 'aKey',
      timestamp: 1708380838534,
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
        sessionId: 'testsessionid',
        timestamp: 1708380838504,
        userAddress: testAddress,
        realm: 'main'
      }
    }

    memoryStorage.get = jest.fn().mockReturnValue([])
    db.getUserProgressFor = jest.fn().mockResolvedValue(undefined)
    badgeContext.getEntityById = jest.fn().mockResolvedValue({
      metadata: {
        display: {
          title: 'aSceneTitle'
        }
      }
    })

    const handler = createTravelerObserver({ db, logs, badgeContext, memoryStorage })

    const result = await handler.check(event)

    expect(memoryStorage.set).toHaveBeenCalledWith(
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
            sceneTitle: 'aSceneTitle',
            acknowledged: false
          }
        }
      ]
    )
    expect(result).toBeUndefined()
  })

  it('only save arriving event in the cache when a user moves to a parcel for second time within a minute', async () => {
    const { db, logs, badgeContext, memoryStorage } = await getMockedComponents()

    const event: MoveToParcelEvent = {
      type: Events.Type.CLIENT,
      subType: Events.SubType.Client.MOVE_TO_PARCEL,
      key: 'aKey',
      timestamp: 1708380838534,
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
        sessionId: 'testsessionid',
        timestamp: 1708380838504,
        userAddress: testAddress,
        realm: 'main'
      }
    }

    memoryStorage.get = jest.fn().mockReturnValue([
      {
        type: event.type,
        subType: event.subType,
        timestamp: event.timestamp - 50,
        userAddress: event.metadata.userAddress,
        sessionId: event.metadata.sessionId,
        metadata: {
          sceneTitle: 'anotherSceneTitle',
          acknowledged: false
        }
      }
    ])
    db.getUserProgressFor = jest.fn().mockResolvedValue(undefined)
    badgeContext.getEntityById = jest.fn().mockResolvedValue({
      metadata: {
        display: {
          title: 'aSceneTitle'
        }
      }
    })

    const handler = createTravelerObserver({ db, logs, badgeContext, memoryStorage })

    const result = await handler.check(event)

    expect(memoryStorage.set).toHaveBeenCalledWith(
      {
        eventSubType: event.subType,
        userAddress: event.metadata.userAddress,
        sessionId: event.metadata.sessionId
      },
      [
        {
          type: event.type,
          subType: event.subType,
          timestamp: event.timestamp - 50,
          userAddress: event.metadata.userAddress,
          sessionId: event.metadata.sessionId,
          metadata: {
            sceneTitle: 'anotherSceneTitle',
            acknowledged: false
          }
        },
        {
          type: event.type,
          subType: event.subType,
          timestamp: event.timestamp,
          userAddress: event.metadata.userAddress,
          sessionId: event.metadata.sessionId,
          metadata: {
            sceneTitle: 'aSceneTitle',
            acknowledged: false
          }
        }
      ]
    )
    expect(result).toBeUndefined()
  })

  it('grant first tier badge when a user moves to a parcel for the second time exceeding a minute', async () => {
    const { db, logs, badgeContext, memoryStorage } = await getMockedComponents()

    const event: MoveToParcelEvent = {
      type: Events.Type.CLIENT,
      subType: Events.SubType.Client.MOVE_TO_PARCEL,
      key: 'aKey',
      timestamp: 1708380838534,
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
        sessionId: 'testsessionid',
        timestamp: 1708380838504,
        userAddress: testAddress,
        realm: 'main'
      }
    }

    db.getUserProgressFor = jest.fn().mockResolvedValue(undefined)
    memoryStorage.get = jest.fn().mockReturnValue([
      {
        type: event.type,
        subType: event.subType,
        timestamp: event.timestamp - 2 * 60 * 1000, // 2 minutes before
        userAddress: event.metadata.userAddress,
        sessionId: event.metadata.sessionId,
        metadata: {
          sceneTitle: 'anotherSceneTitle',
          acknowledged: false
        }
      }
    ])
    badgeContext.getEntityById = jest.fn().mockResolvedValue({
      metadata: {
        display: {
          title: 'aSceneTitle'
        }
      }
    })

    const handler = createTravelerObserver({ db, logs, badgeContext, memoryStorage })

    const result = await handler.check(event)

    expect(memoryStorage.set).toHaveBeenCalledWith(
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
            sceneTitle: 'aSceneTitle',
            acknowledged: false
          }
        }
      ]
    )
    expect(result[0]).toMatchObject({...handler.badge, tier: { tierId: 1 }})
  })

  it('grant second tier badge when a user moves to a parcel for the second time exceeding a minute but already has visited 49 scenes before', async () => {
    const { db, logs, badgeContext, memoryStorage } = await getMockedComponents()

    const event: MoveToParcelEvent = {
      type: Events.Type.CLIENT,
      subType: Events.SubType.Client.MOVE_TO_PARCEL,
      key: 'aKey',
      timestamp: 1708380838534,
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
        sessionId: 'testsessionid',
        timestamp: 1708380838504,
        userAddress: testAddress,
        realm: 'main'
      }
    }

    memoryStorage.get = jest.fn().mockReturnValue([
      {
        type: event.type,
        subType: event.subType,
        timestamp: event.timestamp  - 2 * 60 * 1000, // 2 minutes before
        userAddress: event.metadata.userAddress,
        sessionId: event.metadata.sessionId,
        metadata: {
          sceneTitle: 'anotherSceneTitle',
          acknowledged: false
        }
      }
    ])
    db.getUserProgressFor = jest.fn().mockResolvedValue({
        user_address: testAddress,
        badge_id: BadgeId.TRAVELER,
        progress: {
          global: {
            scenesVisited: 49,
            scenesTitlesVisited: createRandomSceneTitles(49)
          },
          achievedBadgesIds: [1]
        }
      })
    badgeContext.getEntityById = jest.fn().mockResolvedValue({
      metadata: {
        display: {
          title: 'aSceneTitle'
        }
      }
    })

    const handler = createTravelerObserver({ db, logs, badgeContext, memoryStorage })

    const result = await handler.check(event)

    expect(memoryStorage.set).toHaveBeenCalledWith(
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
            sceneTitle: 'aSceneTitle',
            acknowledged: false
          }
        }
      ]
    )
    expect(result[0]).toMatchObject({...handler.badge, tier: { tierId: 2 }})
  })

  it('do not grant second tier badge when a user moves to a parcel for the second time exceeding a minute but the visiting scene is repeated', async () => {
    const { db, logs, badgeContext, memoryStorage } = await getMockedComponents()

    const event: MoveToParcelEvent = {
      type: Events.Type.CLIENT,
      subType: Events.SubType.Client.MOVE_TO_PARCEL,
      key: 'aKey',
      timestamp: 1708380838534,
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
        sessionId: 'testsessionid',
        timestamp: 1708380838504,
        userAddress: testAddress,
        realm: 'main'
      }
    }

    memoryStorage.get = jest.fn().mockReturnValue([
      {
        type: event.type,
        subType: event.subType,
        timestamp: event.timestamp  - 2 * 60 * 1000, // 2 minutes before
        userAddress: event.metadata.userAddress,
        sessionId: event.metadata.sessionId,
        metadata: {
          sceneTitle: 'scene-1',
          acknowledged: false
        }
      }
    ])
    db.getUserProgressFor = jest.fn().mockResolvedValue({
        user_address: testAddress,
        badge_id: BadgeId.TRAVELER,
        progress: {
          global: {
            scenesVisited: 49,
            scenesTitlesVisited: createRandomSceneTitles(49)
          },
          achievedBadgesIds: [1]
        }
      })
    badgeContext.getEntityById = jest.fn().mockResolvedValue({
      metadata: {
        display: {
          title: 'aSceneTitle'
        }
      }
    })

    const handler = createTravelerObserver({ db, logs, badgeContext, memoryStorage })

    const result = await handler.check(event)

    expect(memoryStorage.set).toHaveBeenCalledWith(
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
            sceneTitle: 'aSceneTitle',
            acknowledged: false
          }
        }
      ]
    )
    expect(result).toBeUndefined()
  })

  it('do not grant tier badge when a user spends less than a minute in a scene and then two more events arrived after a minute', async () => {
    const { db, logs, badgeContext, memoryStorage } = await getMockedComponents()

    const event: MoveToParcelEvent = {
      type: Events.Type.CLIENT,
      subType: Events.SubType.Client.MOVE_TO_PARCEL,
      key: 'aKey',
      timestamp: 1708380838534,
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
        sessionId: 'testsessionid',
        timestamp: 1708380838504,
        userAddress: testAddress,
        realm: 'main'
      }
    }

    memoryStorage.get = jest.fn().mockReturnValue([
      {
        type: event.type,
        subType: event.subType,
        timestamp: event.timestamp - 2 * 60 * 1000, // 2 minutes before
        userAddress: event.metadata.userAddress,
        sessionId: event.metadata.sessionId,
        metadata: {
          sceneTitle: 'scene-A',
          acknowledged: false
        }
      },
      {
        type: event.type,
        subType: event.subType,
        timestamp: event.timestamp  - 1.5 * 60 * 1000, // a minute and a half before
        userAddress: event.metadata.userAddress,
        sessionId: event.metadata.sessionId,
        metadata: {
          sceneTitle: 'scene-B',
          acknowledged: false
        }
      }
    ])
    db.getUserProgressFor = jest.fn().mockResolvedValue(undefined)
    badgeContext.getEntityById = jest.fn().mockResolvedValue({
      metadata: {
        display: {
          title: 'scene-C'
        }
      }
    })

    const handler = createTravelerObserver({ db, logs, badgeContext, memoryStorage })

    const result = await handler.check(event)

    expect(memoryStorage.set).toHaveBeenCalledWith(
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
              sceneTitle: 'scene-A',
              acknowledged: false
            }
        },
        {
          type: event.type,
          subType: event.subType,
          timestamp: event.timestamp,
          userAddress: event.metadata.userAddress,
          sessionId: event.metadata.sessionId,
          metadata: {
            sceneTitle: 'scene-C',
            acknowledged: false
          }
        }
      ]
    )
    expect(result).toContain(handler.badge)
  })
})

function createRandomSceneTitles(amount: number): string[] {
    return Array.from({ length: amount }, (_, i) => `scene-${i}`)
}
