import { Events, CatalystDeploymentEvent, EntityType, Rarity } from '@dcl/schemas'
import { Badge, BadgeId } from '@badges/common'
import {
  AMOUNT_OF_EXOTIC_WEARABLES_REQUIRED,
  createExoticEleganceObserver
} from '../../../../src/logic/badges/exotic-elegance'
import { getMockedComponents } from '../../../utils'

describe('Exotic Elegance Voyager badge handler should', () => {
  const testAddress = '0xTest'
  const wearableBaseUrn = 'urn:decentraland:mumbai:collections-v2:0xaa40af0b4a18e0555ff3c87beab1d5b591947abe:'

  it(`grant badge when a user has more than ${AMOUNT_OF_EXOTIC_WEARABLES_REQUIRED} exotic wearables equipped`, async () => {
    const { db, logs, badgeContext, badgeStorage } = await getMockedComponents()

    const wearablesUrns = createRandomWearableUrns(AMOUNT_OF_EXOTIC_WEARABLES_REQUIRED + 1)
    const event: CatalystDeploymentEvent = createCatalystDeploymentEvent(wearablesUrns)

    badgeContext.getWearablesWithRarity = jest.fn().mockResolvedValueOnce(mapToWearablesWithRarity(wearablesUrns))

    const handler = createExoticEleganceObserver({ db, logs, badgeContext, badgeStorage })

    const result = await handler.handle(event)

    const expectedUserProgress = getExpectedUserProgress(wearablesUrns)
    const expectedResult = createExpectedResult(handler.badge)

    expect(db.saveUserProgress).toHaveBeenCalledWith(expectedUserProgress)
    expect(result).toMatchObject(expectedResult)
  })

  it(`grant badge when a user has exactly ${AMOUNT_OF_EXOTIC_WEARABLES_REQUIRED} exotic wearables equipped`, async () => {
    const { db, logs, badgeContext, badgeStorage } = await getMockedComponents()

    const wearablesUrns = createRandomWearableUrns(AMOUNT_OF_EXOTIC_WEARABLES_REQUIRED)
    const event: CatalystDeploymentEvent = createCatalystDeploymentEvent(wearablesUrns)

    badgeContext.getWearablesWithRarity = jest.fn().mockResolvedValueOnce(mapToWearablesWithRarity(wearablesUrns))

    const handler = createExoticEleganceObserver({ db, logs, badgeContext, badgeStorage })

    const result = await handler.handle(event)

    const expectedUserProgress = getExpectedUserProgress(wearablesUrns)
    const expectedResult = createExpectedResult(handler.badge)

    expect(db.saveUserProgress).toHaveBeenCalledWith(expectedUserProgress)
    expect(result).toMatchObject(expectedResult)
  })

  it(`not grant badge when a user has less than ${AMOUNT_OF_EXOTIC_WEARABLES_REQUIRED} exotic wearables equipped`, async () => {
    const { db, logs, badgeContext, badgeStorage } = await getMockedComponents()

    const wearablesUrns = createRandomWearableUrns(AMOUNT_OF_EXOTIC_WEARABLES_REQUIRED - 1)
    const event: CatalystDeploymentEvent = createCatalystDeploymentEvent(wearablesUrns)

    badgeContext.getWearablesWithRarity = jest.fn().mockResolvedValueOnce(mapToWearablesWithRarity(wearablesUrns))

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
    const completed = !!completedWith && completedWith.length > 0
    return {
      user_address: testAddress,
      badge_id: BadgeId.EXOTIC_ELEGANCE,
      completed_at: completed ? expect.any(Number) : undefined,
      progress: {
        steps: completed ? 1 : 0,
        completed_with: completedWith
      }
    }
  }

  function createRandomWearableUrns(length: number): string[] {
    return Array.from({ length }, (_, i) => wearableBaseUrn + i + ':1')
  }

  function mapToWearablesWithRarity(wearablesUrns: string[]) {
    return wearablesUrns.map((urn) => ({
      metadata: { rarity: Rarity.EXOTIC, id: urn }
    }))
  }

  function createExpectedResult(badgeGranted: Badge) {
    return {
      badgeGranted,
      userAddress: testAddress
    }
  }
})
