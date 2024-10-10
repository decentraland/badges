import { createLogComponent } from '@well-known-components/logger'
import { AppComponents } from '../../../../src/types'
import { createDbMock } from '../../../mocks/db-mock'
import { AuthLinkType, Events, VerticalHeightReachedEvent } from '@dcl/schemas'
import { Badge, BadgeId, createBadgeStorage } from '@badges/common'
import { createVerticalVoyagerObserver } from '../../../../src/logic/badges/vertical-voyager'
import { createBadgeStorageMock } from '../../../mocks/badge-storage-mock'

describe('Vertical Voyager badge handler should', () => {
  const testAddress = '0xTest'
  const sessionId = 'testSessionId'

  it('grant badge when a user achieves a total elevation gain of 500m in one session', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const event: VerticalHeightReachedEvent = createVerticalHeightReachedEvent({ height: 500 })

    const mockUserProgress = undefined

    const handler = createVerticalVoyagerObserver({ db, logs, badgeStorage })

    const result = await handler.handle(event, mockUserProgress)

    const expectedUserProgress = getExpectedUserProgress({ heightReached: 500, completed: true })
    const expectedResult = createExpectedResult(handler.badge)

    expect(db.saveUserProgress).toHaveBeenCalledWith(expectedUserProgress)
    expect(result).toMatchObject(expectedResult)
  })

  it('grant badge when a user achieves a total elevation gain of more than 500m in one session', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const event: VerticalHeightReachedEvent = createVerticalHeightReachedEvent({ height: 501 })

    const mockUserProgress = undefined

    const handler = createVerticalVoyagerObserver({ db, logs, badgeStorage })

    const result = await handler.handle(event, mockUserProgress)

    const expectedUserProgress = getExpectedUserProgress({ heightReached: 501, completed: true })
    const expectedResult = createExpectedResult(handler.badge)

    expect(db.saveUserProgress).toHaveBeenCalledWith(expectedUserProgress)
    expect(result).toMatchObject(expectedResult)
  })

  it('not grant badge when a user achieves a total elevation gain of less than 500m in one session', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const event: VerticalHeightReachedEvent = createVerticalHeightReachedEvent({ height: 499 })

    const mockUserProgress = undefined

    const handler = createVerticalVoyagerObserver({ db, logs, badgeStorage })

    const result = await handler.handle(event, mockUserProgress)

    expect(db.saveUserProgress).not.toHaveBeenCalled()
    expect(result).toBe(undefined)
  })

  it('not grant badge when the user has already the badge granted', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const event: VerticalHeightReachedEvent = createVerticalHeightReachedEvent()

    const mockUserProgress = {
      user_address: testAddress,
      badge_id: BadgeId.VERTICAL_VOYAGER,
      completed_at: expect.any(Number),
      progress: {
        steps: 1,
        height_reached: 500
      }
    }

    const handler = createVerticalVoyagerObserver({ db, logs, badgeStorage })

    const result = await handler.handle(event, mockUserProgress)

    expect(db.saveUserProgress).not.toHaveBeenCalled()
    expect(result).toBe(undefined)
  })

  async function getMockedComponents(): Promise<Pick<AppComponents, 'db' | 'logs' | 'badgeStorage'>> {
    return {
      db: createDbMock(),
      logs: await createLogComponent({ config: { requireString: jest.fn(), getString: jest.fn() } as any }),
      badgeStorage: await createBadgeStorageMock()
    }
  }

  function createVerticalHeightReachedEvent(
    metadata?: Partial<VerticalHeightReachedEvent['metadata']>
  ): VerticalHeightReachedEvent {
    const { height } = metadata || {}
    return {
      type: Events.Type.CLIENT,
      subType: Events.SubType.Client.VERTICAL_HEIGHT_REACHED,
      key: 'aKey',
      timestamp: 1708380838534,
      metadata: {
        authChain: [
          {
            payload: 'auth-chain-payload',
            type: AuthLinkType.SIGNER
          }
        ],
        height,
        sessionId: sessionId,
        timestamp: 1708380838504,
        userAddress: testAddress,
        realm: 'main'
      }
    }
  }

  function getExpectedUserProgress({
    heightReached,
    completed = false
  }: {
    heightReached?: number
    completed?: boolean
  }): any {
    return {
      user_address: testAddress,
      badge_id: BadgeId.VERTICAL_VOYAGER,
      completed_at: completed ? expect.any(Number) : undefined,
      progress: {
        steps: completed ? 1 : 0,
        height_reached: heightReached
      }
    }
  }

  function createExpectedResult(badgeGranted: Badge) {
    return {
      badgeGranted,
      userAddress: testAddress
    }
  }
})
