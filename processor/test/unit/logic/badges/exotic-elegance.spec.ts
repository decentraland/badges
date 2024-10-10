import { Events, CatalystDeploymentEvent, EntityType, Rarity } from '@dcl/schemas'
import { BadgeId } from '@badges/common'
import {
  AMOUNT_OF_EXOTIC_WEARABLES_REQUIRED,
  createExoticEleganceObserver
} from '../../../../src/logic/badges/exotic-elegance'
import {
  createExpectedResult,
  createRandomWearableUrns,
  getExpectedUserProgressForBadgeBuilder,
  getMockedComponents,
  mapToWearablesWithRarity
} from '../../../utils'

describe('Exotic Elegance Voyager badge handler should', () => {
  const testAddress = '0xTest'
  const createExpectedUserProgress = getExpectedUserProgressForBadgeBuilder(BadgeId.EXOTIC_ELEGANCE, testAddress)

  it(`grant badge when a user has more than ${AMOUNT_OF_EXOTIC_WEARABLES_REQUIRED} exotic wearables equipped`, async () => {
    const { db, logs, badgeContext, badgeStorage } = await getMockedComponents()

    const wearablesUrns = createRandomWearableUrns(AMOUNT_OF_EXOTIC_WEARABLES_REQUIRED + 1)
    const event: CatalystDeploymentEvent = createCatalystDeploymentEvent(wearablesUrns)

    badgeContext.getWearablesWithRarity = jest
      .fn()
      .mockResolvedValueOnce(mapToWearablesWithRarity(wearablesUrns, Rarity.EXOTIC))

    const handler = createExoticEleganceObserver({ db, logs, badgeContext, badgeStorage })

    const result = await handler.handle(event)

    const expectedUserProgress = getExpectedUserProgress(wearablesUrns)
    const expectedResult = createExpectedResult(handler.badge, testAddress)

    expect(db.saveUserProgress).toHaveBeenCalledWith(expectedUserProgress)
    expect(result).toMatchObject(expectedResult)
  })

  it(`grant badge when a user has exactly ${AMOUNT_OF_EXOTIC_WEARABLES_REQUIRED} exotic wearables equipped`, async () => {
    const { db, logs, badgeContext, badgeStorage } = await getMockedComponents()

    const wearablesUrns = createRandomWearableUrns(AMOUNT_OF_EXOTIC_WEARABLES_REQUIRED)
    const event: CatalystDeploymentEvent = createCatalystDeploymentEvent(wearablesUrns)

    badgeContext.getWearablesWithRarity = jest
      .fn()
      .mockResolvedValueOnce(mapToWearablesWithRarity(wearablesUrns, Rarity.EXOTIC))

    const handler = createExoticEleganceObserver({ db, logs, badgeContext, badgeStorage })

    const result = await handler.handle(event)

    const expectedUserProgress = getExpectedUserProgress(wearablesUrns)
    const expectedResult = createExpectedResult(handler.badge, testAddress)

    expect(db.saveUserProgress).toHaveBeenCalledWith(expectedUserProgress)
    expect(result).toMatchObject(expectedResult)
  })

  it(`not grant badge when a user has less than ${AMOUNT_OF_EXOTIC_WEARABLES_REQUIRED} exotic wearables equipped`, async () => {
    const { db, logs, badgeContext, badgeStorage } = await getMockedComponents()

    const wearablesUrns = createRandomWearableUrns(AMOUNT_OF_EXOTIC_WEARABLES_REQUIRED - 1)
    const event: CatalystDeploymentEvent = createCatalystDeploymentEvent(wearablesUrns)

    badgeContext.getWearablesWithRarity = jest
      .fn()
      .mockResolvedValueOnce(mapToWearablesWithRarity(wearablesUrns, Rarity.EXOTIC))

    const handler = createExoticEleganceObserver({ db, logs, badgeContext, badgeStorage })

    const result = await handler.handle(event)

    expect(db.saveUserProgress).not.toHaveBeenCalled()
    expect(result).toBe(undefined)
  })

  it('not grant badge when the user has already the badge granted', async () => {
    const { db, logs, badgeContext, badgeStorage } = await getMockedComponents()

    const wearablesUrns = createRandomWearableUrns(AMOUNT_OF_EXOTIC_WEARABLES_REQUIRED)
    const event: CatalystDeploymentEvent = createCatalystDeploymentEvent(wearablesUrns)

    const mockUserProgress = {
      user_address: testAddress,
      badge_id: BadgeId.EXOTIC_ELEGANCE,
      completed_at: expect.any(Number),
      progress: {
        steps: 1,
        completedWith: wearablesUrns
      }
    }

    const handler = createExoticEleganceObserver({ db, logs, badgeContext, badgeStorage })

    const result = await handler.handle(event, mockUserProgress)

    expect(db.saveUserProgress).not.toHaveBeenCalled()
    expect(result).toBe(undefined)
  })

  function createCatalystDeploymentEvent(wearables: string[]): CatalystDeploymentEvent {
    return {
      type: Events.Type.CATALYST_DEPLOYMENT,
      subType: Events.SubType.CatalystDeployment.PROFILE,
      key: 'bafkreicamuc6ecbu6a3jzew2g6bkiu4m7zclfm6wy5js4mlnyo6pljsveu',
      timestamp: 1708380838534,
      entity: {
        version: 'v3',
        id: 'bafkreid7ohlfwnary6k73rp7x7xa5uum53p6qchmxlcf3nbvkw5inss5li',
        type: EntityType.PROFILE,
        pointers: [testAddress],
        timestamp: 1708380838534,
        content: [],
        metadata: {
          avatars: [
            {
              hasClaimedName: false,
              description: 'A second description',
              tutorialStep: 256,
              name: 'PaleAleTest',
              avatar: {
                bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
                wearables
              },
              ethAddress: testAddress,
              version: 36,
              userId: testAddress,
              hasConnectedWeb3: true
            }
          ]
        }
      }
    }
  }

  function getExpectedUserProgress(completedWith?: string[]): any {
    return createExpectedUserProgress({
      progress: {
        completed_with: completedWith
      },
      completed: !!completedWith && completedWith.length > 0
    })
  }
})
