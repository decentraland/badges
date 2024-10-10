import { CatalystDeploymentEvent, Rarity } from '@dcl/schemas'
import { BadgeId } from '@badges/common'
import {
  AMOUNT_OF_LEGENDARY_WEARABLES_REQUIRED,
  createLegendaryLookObserver
} from '../../../../src/logic/badges/legendary-look'
import {
  createExpectedResult,
  createRandomWearableUrns,
  getExpectedUserProgressForBadgeBuilder,
  getMockedComponents,
  mapToWearablesWithRarity
} from '../../../utils'
import { createCatalystDeploymentProfileEvent } from '../../../mocks/catalyst-deployment-event-mock'

describe('Legendary Look badge handler should', () => {
  const testAddress = '0xTest'
  const createExpectedUserProgress = getExpectedUserProgressForBadgeBuilder(BadgeId.LEGENDARY_LOOK, testAddress)

  it(`grant badge when a user has more than ${AMOUNT_OF_LEGENDARY_WEARABLES_REQUIRED} legendary wearables equipped`, async () => {
    const { db, logs, badgeContext, badgeStorage } = await getMockedComponents()

    const wearablesUrns = createRandomWearableUrns(AMOUNT_OF_LEGENDARY_WEARABLES_REQUIRED + 1)
    const event: CatalystDeploymentEvent = createCatalystDeploymentProfileEvent(testAddress, {
      wearables: wearablesUrns
    })

    badgeContext.getWearablesWithRarity = jest
      .fn()
      .mockResolvedValueOnce(mapToWearablesWithRarity(wearablesUrns, Rarity.LEGENDARY))

    const handler = createLegendaryLookObserver({ db, logs, badgeContext, badgeStorage })

    const result = await handler.handle(event)

    const expectedUserProgress = createExpectedUserProgress({ progress: { completed_with: wearablesUrns } })
    const expectedResult = createExpectedResult(handler.badge, testAddress)

    expect(db.saveUserProgress).toHaveBeenCalledWith(expectedUserProgress)
    expect(result).toMatchObject(expectedResult)
  })

  it(`grant badge when a user has exactly ${AMOUNT_OF_LEGENDARY_WEARABLES_REQUIRED} legendary wearables equipped`, async () => {
    const { db, logs, badgeContext, badgeStorage } = await getMockedComponents()

    const wearablesUrns = createRandomWearableUrns(AMOUNT_OF_LEGENDARY_WEARABLES_REQUIRED)
    const event: CatalystDeploymentEvent = createCatalystDeploymentProfileEvent(testAddress, {
      wearables: wearablesUrns
    })

    badgeContext.getWearablesWithRarity = jest
      .fn()
      .mockResolvedValueOnce(mapToWearablesWithRarity(wearablesUrns, Rarity.LEGENDARY))

    const handler = createLegendaryLookObserver({ db, logs, badgeContext, badgeStorage })

    const result = await handler.handle(event)

    const expectedUserProgress = createExpectedUserProgress({ progress: { completed_with: wearablesUrns } })
    const expectedResult = createExpectedResult(handler.badge, testAddress)

    expect(db.saveUserProgress).toHaveBeenCalledWith(expectedUserProgress)
    expect(result).toMatchObject(expectedResult)
  })

  it(`not grant badge when a user has less than ${AMOUNT_OF_LEGENDARY_WEARABLES_REQUIRED} legendary wearables equipped`, async () => {
    const { db, logs, badgeContext, badgeStorage } = await getMockedComponents()

    const wearablesUrns = createRandomWearableUrns(AMOUNT_OF_LEGENDARY_WEARABLES_REQUIRED - 1)
    const event: CatalystDeploymentEvent = createCatalystDeploymentProfileEvent(testAddress, {
      wearables: wearablesUrns
    })

    badgeContext.getWearablesWithRarity = jest
      .fn()
      .mockResolvedValueOnce(mapToWearablesWithRarity(wearablesUrns, Rarity.LEGENDARY))

    const handler = createLegendaryLookObserver({ db, logs, badgeContext, badgeStorage })

    const result = await handler.handle(event)

    expect(db.saveUserProgress).not.toHaveBeenCalled()
    expect(result).toBe(undefined)
  })

  it('not grant badge when the user has already the badge granted', async () => {
    const { db, logs, badgeContext, badgeStorage } = await getMockedComponents()

    const wearablesUrns = createRandomWearableUrns(AMOUNT_OF_LEGENDARY_WEARABLES_REQUIRED)
    const event: CatalystDeploymentEvent = createCatalystDeploymentProfileEvent(testAddress, {
      wearables: wearablesUrns
    })

    const mockUserProgress = {
      user_address: testAddress,
      badge_id: BadgeId.LEGENDARY_LOOK,
      completed_at: expect.any(Number),
      progress: {
        steps: 1,
        completedWith: wearablesUrns
      }
    }

    const handler = createLegendaryLookObserver({ db, logs, badgeContext, badgeStorage })

    const result = await handler.handle(event, mockUserProgress)

    expect(db.saveUserProgress).not.toHaveBeenCalled()
    expect(result).toBe(undefined)
  })
})
