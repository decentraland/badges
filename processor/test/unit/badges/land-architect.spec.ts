import { createLogComponent } from '@well-known-components/logger'
import { AppComponents } from '../../../src/types'
import { createDbMock } from '../../mocks/db-mock'
import { CatalystDeploymentEvent, Events } from '@dcl/schemas'
import { Badge, BadgeId, createBadgeStorage } from '@badges/common'
import { createLandArchitectObserver } from '../../../src/logic/badges/land-architect'

describe('LAND Architect badge handler should', () => {
  const testAddress = '0xTest'

  it('grant badge when a user deploy a scene for the first time', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const event = createSceneDeployedEvent()

    db.getUserProgressFor = jest.fn().mockResolvedValue(undefined)

    const handler = createLandArchitectObserver({ db, logs, badgeStorage })

    const result = await handler.handle(event)

    const expectedUserProgress = createExpectedUserProgress({ completed: true })
    const expectedResult = createExpectedResult(handler.badge)

    expect(db.getUserProgressFor).toHaveBeenCalledWith(BadgeId.LAND_ARCHITECT, testAddress)
    expect(db.saveUserProgress).toHaveBeenCalledWith(expectedUserProgress)
    expect(result).toMatchObject(expectedResult)
  })

  it('not grant badge when the user has already the badge granted', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const event = createSceneDeployedEvent()

    db.getUserProgressFor = jest.fn().mockResolvedValue({
      user_address: testAddress,
      badge_id: BadgeId.LAND_ARCHITECT,
      completed_at: expect.any(Number),
      progress: {
        steps: 1
      }
    })

    const handler = createLandArchitectObserver({ db, logs, badgeStorage })

    const result = await handler.handle(event)

    expect(db.getUserProgressFor).toHaveBeenCalledWith(BadgeId.LAND_ARCHITECT, testAddress)
    expect(db.saveUserProgress).not.toHaveBeenCalled()
    expect(result).toBe(undefined)
  })

  async function getMockedComponents(): Promise<Pick<AppComponents, 'db' | 'logs' | 'badgeStorage'>> {
    return {
      db: createDbMock(),
      logs: await createLogComponent({ config: { requireString: jest.fn(), getString: jest.fn() } as any }),
      badgeStorage: await createBadgeStorage({
        config: { requireString: jest.fn().mockResolvedValue('https://any-url.tld') } as any
      })
    }
  }

  function createSceneDeployedEvent(): CatalystDeploymentEvent {
    return {
      type: Events.Type.CATALYST_DEPLOYMENT,
      subType: Events.SubType.CatalystDeployment.SCENE,
      key: 'aKey',
      timestamp: 1708380838534,
      entity: {
        pointers: [testAddress]
      } as any
    }
  }

  function createExpectedUserProgress({ completed = false }: { completed?: boolean }): any {
    return {
      user_address: testAddress,
      badge_id: BadgeId.LAND_ARCHITECT,
      completed_at: completed ? expect.any(Number) : undefined,
      progress: {
        steps: completed ? 1 : 0
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