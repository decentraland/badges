import { Badge, BadgeId, createBadgeStorage, UserBadge } from '@badges/common'
import { CatalystDeploymentEvent, CollectionCreatedEvent, EntityType, Event, Events } from '@dcl/schemas'
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

  it.each([
    ['CatalystDeploymentEvent', createCatalystDeploymentEvent(), { store_completed: true }],
    ['CollectionCreatedEvent', createCollectionCreatedEvent(), { collection_submitted: true }]
  ])(
    'update userProgress correctly when a %s is received and the user progress is undefined',
    async (_, event: Event, expectedProgress) => {
      const { db, logs, badgeStorage } = await getMockedComponents()

      const currentUserProgress = getMockUserProgress()

      const handler = createOpenForBusinessObserver({ db, logs, badgeStorage })

      const result = await handler.handle(event, currentUserProgress)

      expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 1, ...expectedProgress }))
      expect(result).toBeUndefined()
    }
  )

  it('update userProgress correctly when a CatalystDeploymentEvent is received and the user already has progress', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const currentUserProgress = getMockUserProgress()

    const event = createCatalystDeploymentEvent()

    const handler = createOpenForBusinessObserver({ db, logs, badgeStorage })

    const result = await handler.handle(event, currentUserProgress)

    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 1, store_completed: true }))
    expect(result).toBeUndefined()
  })

  it('update userProgress correctly when a CollectionCreatedEvent is received and the user already has progress', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const currentUserProgress = getMockUserProgress()

    const event = createCollectionCreatedEvent()

    const handler = createOpenForBusinessObserver({ db, logs, badgeStorage })

    const result = await handler.handle(event, currentUserProgress)

    expect(db.saveUserProgress).toHaveBeenCalledWith(
      createExpectedUserProgress({ steps: 1, collection_submitted: true })
    )
    expect(result).toBeUndefined()
  })

  it('update userProgress correctly and grant badge when both events are received', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const currentUserProgress = getMockUserProgress()

    const storeDeploymentEvent = createCatalystDeploymentEvent()

    const collectionCreatedEvent = createCollectionCreatedEvent()

    const handler = createOpenForBusinessObserver({ db, logs, badgeStorage })

    let result = await handler.handle(storeDeploymentEvent, currentUserProgress)

    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 1, store_completed: true }))
    expect(result).toBeUndefined()

    result = await handler.handle(collectionCreatedEvent, {
      ...currentUserProgress,
      progress: {
        steps: 1,
        store_completed: true
      }
    })

    expect(db.saveUserProgress).toHaveBeenCalledWith(
      createExpectedUserProgress({ steps: 2, store_completed: true, collection_submitted: true, completed: true })
    )
    expect(result).toMatchObject({
      badgeGranted: handler.badge,
      userAddress: testAddress
    })
  })

  it.each([createCatalystDeploymentEvent(), createCollectionCreatedEvent()])(
    'do not grant badge when the user already has the badge granted and the event type $type and the subtype is $subType',
    async (event: Event) => {
      const { db, logs, badgeStorage } = await getMockedComponents()

      const currentUserProgress = getMockUserProgress({ alreadyCompleted: true })

      const handler = createOpenForBusinessObserver({ db, logs, badgeStorage })

      let result = await handler.handle(event, currentUserProgress)

      expect(db.saveUserProgress).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    }
  )

  it('do not increase the steps when the user already completed the store information and the event is a store deployment', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const currentUserProgress = getMockUserProgress({ storeCompleted: true, collectionSubmitted: false, steps: 1 })

    const storeDeploymentEvent = createCatalystDeploymentEvent()

    const handler = createOpenForBusinessObserver({ db, logs, badgeStorage })

    let result = await handler.handle(storeDeploymentEvent, currentUserProgress)

    expect(db.saveUserProgress).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('do not increase the steps when the user already submitted the collection and the event is collection created', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const currentUserProgress = getMockUserProgress({ storeCompleted: false, collectionSubmitted: true, steps: 1 })

    const collectionCreatedEvent = createCollectionCreatedEvent()

    const handler = createOpenForBusinessObserver({ db, logs, badgeStorage })

    let result = await handler.handle(collectionCreatedEvent, currentUserProgress)

    expect(db.saveUserProgress).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  // Helpers
  function createCatalystDeploymentEvent(): CatalystDeploymentEvent {
    return {
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
  }

  function createCollectionCreatedEvent(): CollectionCreatedEvent {
    return {
      type: Events.Type.BLOCKCHAIN,
      subType: Events.SubType.Blockchain.COLLECTION_CREATED,
      key: 'bafkreicamuc6ecbu6a3jzew2g6bkiu4m7zclfm6wy5js4mlnyo6pljsveu',
      timestamp: 1630051200,
      metadata: {
        creator: testAddress,
        name: 'Test collection'
      }
    }
  }

  function getMockUserProgress(
    options: { steps?: number; alreadyCompleted?: boolean; storeCompleted?: boolean; collectionSubmitted?: boolean } = {
      steps: 0
    }
  ): UserBadge {
    const { alreadyCompleted, steps, storeCompleted, collectionSubmitted } = options
    return {
      user_address: testAddress,
      badge_id: BadgeId.OPEN_FOR_BUSINESS,
      progress: alreadyCompleted
        ? {
            steps: 2,
            store_completed: true,
            collection_submitted: true
          }
        : {
            steps,
            store_completed: storeCompleted,
            collection_submitted: collectionSubmitted
          },
      completed_at: alreadyCompleted ? Date.now() : undefined,
      updated_at: Date.now()
    }
  }

  function createExpectedUserProgress(options: {
    steps?: number
    store_completed?: boolean
    collection_submitted?: boolean
    completed?: boolean
  }): UserBadge {
    const { completed, ...progress } = options
    return {
      user_address: testAddress,
      badge_id: BadgeId.OPEN_FOR_BUSINESS,
      progress: {
        ...progress
      },
      completed_at: completed ? expect.any(Number) : undefined,
      updated_at: expect.any(Number)
    }
  }
})
