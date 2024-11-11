import { CatalystDeploymentEvent, Rarity } from '@dcl/schemas'
import { BadgeId } from '@badges/common'
import { createProfileProObserver } from '../../../../src/logic/badges/profile-pro'
import {
  createExpectedResult,
  createRandomWearableUrns,
  getExpectedUserProgressForBadgeBuilder,
  getMockedComponents,
  mapToWearablesWithRarity
} from '../../../utils'
import { createCatalystDeploymentProfileEvent } from '../../../mocks/catalyst-deployment-event-mock'

describe('Profile Pro badge handler should', () => {
  const testAddress = '0xTest'
  const createExpectedUserProgress = getExpectedUserProgressForBadgeBuilder(BadgeId.PROFILE_PRO, testAddress)

  it('grant badge when a user has completed the profile description', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const description = 'My epic description'
    const event: CatalystDeploymentEvent = createCatalystDeploymentProfileEvent(testAddress, {
      description
    })

    const handler = createProfileProObserver({ db, logs, badgeStorage })

    const result = await handler.handle(event)

    const expectedUserProgress = createExpectedUserProgress({
      progress: { description_added: description },
      completed: true
    })
    const expectedResult = createExpectedResult(handler.badge, testAddress)

    expect(db.saveUserProgress).toHaveBeenCalledWith(expectedUserProgress)
    expect(result).toMatchObject(expectedResult)
  })

  it('not grant badge when a user has not completed the profile description', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const emptyDescription = ''
    const event: CatalystDeploymentEvent = createCatalystDeploymentProfileEvent(testAddress, {
      description: emptyDescription
    })

    const handler = createProfileProObserver({ db, logs, badgeStorage })

    const result = await handler.handle(event)

    expect(db.saveUserProgress).not.toHaveBeenCalled()
    expect(result).toBe(undefined)
  })

  it('not grant badge when the user has already the badge granted', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const description = 'Pro description'
    const event: CatalystDeploymentEvent = createCatalystDeploymentProfileEvent(testAddress, { description })

    const mockUserProgress = {
      user_address: testAddress,
      badge_id: BadgeId.PROFILE_PRO,
      completed_at: expect.any(Number),
      progress: {
        steps: 1,
        description_added: description
      }
    }

    const handler = createProfileProObserver({ db, logs, badgeStorage })

    const result = await handler.handle(event, mockUserProgress)

    expect(db.saveUserProgress).not.toHaveBeenCalled()
    expect(result).toBe(undefined)
  })
})
