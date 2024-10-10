import { CatalystDeploymentEvent, Events } from '@dcl/schemas'
import { Badge, BadgeId } from '@badges/common'
import { createLandArchitectObserver } from '../../../../src/logic/badges/land-architect'
import { createExpectedResult, getMockedComponents } from '../../../utils'

describe('LAND Architect badge handler should', () => {
  const testAddress = '0xTest'

  it('grant badge when a user deploy a scene for the first time', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const event = createSceneDeployedEvent()

    const handler = createLandArchitectObserver({ db, logs, badgeStorage })

    const result = await handler.handle(event)

    const expectedUserProgress = getExpectedUserProgress({ completed: true })
    const expectedResult = createExpectedResult(handler.badge, testAddress)

    expect(db.saveUserProgress).toHaveBeenCalledWith(expectedUserProgress)
    expect(result).toMatchObject(expectedResult)
  })

  it('not grant badge when the user has already the badge granted', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const event = createSceneDeployedEvent()

    const mockUserProgress = {
      user_address: testAddress,
      badge_id: BadgeId.LAND_ARCHITECT,
      completed_at: expect.any(Number),
      progress: {
        steps: 1
      }
    }

    const handler = createLandArchitectObserver({ db, logs, badgeStorage })

    const result = await handler.handle(event, mockUserProgress)

    expect(db.saveUserProgress).not.toHaveBeenCalled()
    expect(result).toBe(undefined)
  })

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

  function getExpectedUserProgress({ completed = false }: { completed?: boolean }): any {
    return {
      user_address: testAddress,
      badge_id: BadgeId.LAND_ARCHITECT,
      completed_at: completed ? expect.any(Number) : undefined,
      progress: {
        steps: completed ? 1 : 0
      }
    }
  }
})
