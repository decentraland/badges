import { Badge, BadgeId, createBadgeStorage, UserBadge } from '@badges/common'
import { CatalystDeploymentEvent, CollectionCreatedEvent, EntityType, Events } from '@dcl/schemas'
import { createDbMock } from '../../../mocks/db-mock'
import { createOpenForBusinessObserver } from '../../../../src/logic/badges/open-for-business'
import { AppComponents } from '../../../../src/types'

describe('Open for Business badge handler should', () => {
  const testAddress = '0xTest'

  async function getMockedComponents(): Promise<Pick<AppComponents, 'db' | 'logs' | 'badgeStorage'>> {
    return {
      db: createDbMock(),
      logs: {
        getLogger: jest.fn().mockReturnValue({
          info: jest.fn(),
          debug: jest.fn(),
          error: jest.fn(),
          warn: jest.fn()
        })
      },
      badgeStorage: await createBadgeStorage({
        config: { requireString: jest.fn().mockResolvedValue('https://any-url.tld') } as any
      })
    }
  }

  it('update userProgress correctly when a CatalystDeploymentEvent is received', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const currentUserProgress: UserBadge = {
      user_address: testAddress,
      badge_id: BadgeId.OPEN_FOR_BUSINESS,
      progress: {},
      updated_at: 1708380838534
    }

    const event: CatalystDeploymentEvent = {
      type: Events.Type.CATALYST_DEPLOYMENT,
      subType: Events.SubType.CatalystDeployment.STORE,
      key: 'bafkreicamuc6ecbu6a3jzew2g6bkiu4m7zclfm6wy5js4mlnyo6pljsveu',
      timestamp: 1708380838534,
      entity: {
        version: 'v3',
        id: 'bafkreicamuc6ecbu6a3jzew2g6bkiu4m7zclfm6wy5js4mlnyo6pljsveu',
        type: EntityType.STORE,
        pointers: ['0xTest:store'],
        timestamp: 1708380838534,
        content: [],
        metadata: {
          owner: testAddress
        }
      }
    }

    const handler = createOpenForBusinessObserver({ db, logs, badgeStorage })

    const result = await handler.handle(event, currentUserProgress)

    expect(db.saveUserProgress).toHaveBeenCalledWith({
      user_address: testAddress,
      badge_id: BadgeId.OPEN_FOR_BUSINESS,
      progress: {
        steps: 1,
        store_completed: true
      },
      updated_at: expect.any(Number)
    })
    expect(result).toBeUndefined()
  })

  it('update userProgress correctly when a CollectionCreatedEvent is received', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const currentUserProgress: UserBadge = {
      user_address: testAddress,
      badge_id: BadgeId.OPEN_FOR_BUSINESS,
      progress: {},
      updated_at: 1708380838534
    }

    const event: CollectionCreatedEvent = {
      type: Events.Type.BLOCKCHAIN,
      subType: Events.SubType.Blockchain.COLLECTION_CREATED,
      key: 'bafkreicamuc6ecbu6a3jzew2g6bkiu4m7zclfm6wy5js4mlnyo6pljsveu',
      timestamp: 1630051200,
      metadata: {
        creator: testAddress,
        name: 'Test collection'
      }
    }

    const handler = createOpenForBusinessObserver({ db, logs, badgeStorage })

    const result = await handler.handle(event, currentUserProgress)

    expect(db.saveUserProgress).toHaveBeenCalledWith({
      user_address: testAddress,
      badge_id: BadgeId.OPEN_FOR_BUSINESS,
      progress: {
        steps: 1,
        collection_submitted: true
      },
      updated_at: expect.any(Number)
    })
    expect(result).toBeUndefined()
  })

  it('update userProgress correctly and grant badge when both events are received', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const currentUserProgress: UserBadge = {
      user_address: testAddress,
      badge_id: BadgeId.OPEN_FOR_BUSINESS,
      progress: {},
      updated_at: 1708380838534
    }

    const storeDeploymentEvent: CatalystDeploymentEvent = {
      type: Events.Type.CATALYST_DEPLOYMENT,
      subType: Events.SubType.CatalystDeployment.STORE,
      key: 'bafkreicamuc6ecbu6a3jzew2g6bkiu4m7zclfm6wy5js4mlnyo6pljsveu',
      timestamp: 1630051200,
      entity: {
        version: 'v3',
        id: 'bafkreicamuc6ecbu6a3jzew2g6bkiu4m7zclfm6wy5js4mlnyo6pljsveu',
        type: EntityType.STORE,
        pointers: ['0xTest:store'],
        timestamp: 1630051200,
        content: [],
        metadata: {
          owner: testAddress
        }
      }
    }

    const collectionCreatedEvent: CollectionCreatedEvent = {
      type: Events.Type.BLOCKCHAIN,
      subType: Events.SubType.Blockchain.COLLECTION_CREATED,
      key: 'bafkreicamuc6ecbu6a3jzew2g6bkiu4m7zclfm6wy5js4mlnyo6pljsveu',
      timestamp: 1630051200,
      metadata: {
        creator: testAddress,
        name: 'Test collection'
      }
    }

    const handler = createOpenForBusinessObserver({ db, logs, badgeStorage })

    let result = await handler.handle(storeDeploymentEvent, currentUserProgress)

    expect(db.saveUserProgress).toHaveBeenCalledWith({
      user_address: testAddress,
      badge_id: BadgeId.OPEN_FOR_BUSINESS,
      progress: {
        steps: 1,
        store_completed: true
      },
      updated_at: expect.any(Number)
    })
    expect(result).toBeUndefined()

    result = await handler.handle(collectionCreatedEvent, {
      ...currentUserProgress,
      progress: {
        steps: 1,
        store_completed: true
      }
    })

    expect(db.saveUserProgress).toHaveBeenCalledWith({
      user_address: testAddress,
      badge_id: BadgeId.OPEN_FOR_BUSINESS,
      completed_at: expect.any(Number),
      progress: {
        steps: 2,
        store_completed: true,
        collection_submitted: true
      },
      updated_at: expect.any(Number)
    })
    expect(result).toMatchObject({
      badgeGranted: handler.badge,
      userAddress: testAddress
    })
  })

  it('do not grant badge when the user already has the badge granted', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const currentUserProgress: UserBadge = {
      user_address: testAddress,
      badge_id: BadgeId.OPEN_FOR_BUSINESS,
      completed_at: 1708380838534,
      progress: {
        steps: 2,
        store_completed: true,
        collection_submitted: true
      },
      updated_at: 1708380838534
    }

    const storeDeploymentEvent: CatalystDeploymentEvent = {
      type: Events.Type.CATALYST_DEPLOYMENT,
      subType: Events.SubType.CatalystDeployment.STORE,
      key: 'bafkreicamuc6ecbu6a3jzew2g6bkiu4m7zclfm6wy5js4mlnyo6pljsveu',
      timestamp: 1630051200,
      entity: {
        version: 'v3',
        id: 'bafkreicamuc6ecbu6a3jzew2g6bkiu4m7zclfm6wy5js4mlnyo6pljsveu',
        type: EntityType.STORE,
        pointers: ['0xTest:store'],
        timestamp: 1630051200,
        content: [],
        metadata: {
          owner: testAddress
        }
      }
    }

    const collectionCreatedEvent: CollectionCreatedEvent = {
      type: Events.Type.BLOCKCHAIN,
      subType: Events.SubType.Blockchain.COLLECTION_CREATED,
      key: 'bafkreicamuc6ecbu6a3jzew2g6bkiu4m7zclfm6wy5js4mlnyo6pljsveu',
      timestamp: 1630051200,
      metadata: {
        creator: testAddress,
        name: 'Test collection'
      }
    }

    const handler = createOpenForBusinessObserver({ db, logs, badgeStorage })

    let result = await handler.handle(storeDeploymentEvent, currentUserProgress)

    expect(db.saveUserProgress).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})
