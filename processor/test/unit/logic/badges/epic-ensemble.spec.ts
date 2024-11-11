import { BadgeId, UserBadge } from '@badges/common'
import { createEpicEnsembleObserver } from '../../../../src/logic/badges/epic-ensemble'
import { getMockedComponents } from '../../../utils'
import { createCatalystDeploymentProfileEvent } from '../../../mocks/catalyst-deployment-event-mock'

describe('Epic Ensemble badge handler should', () => {
  const testAddress = '0xTest'
  const wearableBaseUrn = 'urn:decentraland:mumbai:collections-v2:0xaa40af0b4a18e0555ff3c87beab1d5b591947abe:'

  it('grant badge when a Profile deployment contains at least three epic wearables', async () => {
    const { db, logs, badgeContext, badgeStorage } = await getMockedComponents()

    const wearablesUrn = [wearableBaseUrn + '1:1', wearableBaseUrn + '2:1', wearableBaseUrn + '3:1']

    const currentUserProgress: UserBadge = {
      user_address: testAddress,
      badge_id: BadgeId.EPIC_ENSEMBLE,
      progress: {},
      updated_at: 1708380838534
    }

    const event = createCatalystDeploymentProfileEvent(testAddress, { wearables: wearablesUrn })

    badgeContext.getWearablesWithRarity = jest
      .fn()
      .mockResolvedValue([
        getWearableWithRarity(wearablesUrn[0], 'epic'),
        getWearableWithRarity(wearablesUrn[1], 'epic'),
        getWearableWithRarity(wearablesUrn[2], 'epic')
      ])

    const handler = createEpicEnsembleObserver({ db, logs, badgeContext, badgeStorage })

    const result = await handler.handle(event, currentUserProgress)

    expect(badgeContext.getWearablesWithRarity).toHaveBeenCalledWith(wearablesUrn)
    expect(db.saveUserProgress).toHaveBeenCalledWith({
      ...currentUserProgress,
      progress: {
        completed_with: wearablesUrn,
        steps: 1
      }
    })
    expect(result).toMatchObject({
      badgeGranted: handler.badge,
      userAddress: testAddress
    })
  })

  it('do not grant badge when a Profile deployment contains less than three epic wearables', async () => {
    const { db, logs, badgeContext, badgeStorage } = await getMockedComponents()

    const wearablesUrn = [wearableBaseUrn + '1:1', wearableBaseUrn + '2:1', wearableBaseUrn + '3:1']

    const currentUserProgress: UserBadge = {
      user_address: testAddress,
      badge_id: BadgeId.EPIC_ENSEMBLE,
      progress: {},
      updated_at: 1708380838534
    }

    const event = createCatalystDeploymentProfileEvent(testAddress, { wearables: wearablesUrn })

    badgeContext.getWearablesWithRarity = jest
      .fn()
      .mockResolvedValue([
        getWearableWithRarity(wearablesUrn[0], 'epic'),
        getWearableWithRarity(wearablesUrn[1], 'epic'),
        getWearableWithRarity(wearablesUrn[2], 'common')
      ])

    const handler = createEpicEnsembleObserver({ db, logs, badgeContext, badgeStorage })

    const result = await handler.handle(event, currentUserProgress)

    expect(result).toBe(undefined)
    expect(badgeContext.getWearablesWithRarity).toHaveBeenCalledWith(wearablesUrn)
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('do not grant badge when the user already has the badge granted ', async () => {
    const { db, logs, badgeContext, badgeStorage } = await getMockedComponents()

    const wearablesUrn = [wearableBaseUrn + '1:1', wearableBaseUrn + '2:1', wearableBaseUrn + '3:1']

    const currentUserProgress: UserBadge = {
      user_address: testAddress,
      badge_id: BadgeId.EPIC_ENSEMBLE,
      completed_at: 1708380838534,
      progress: {
        completed_with: wearablesUrn
      },
      updated_at: 1708380838534
    }

    const event = createCatalystDeploymentProfileEvent(testAddress, { wearables: wearablesUrn })

    const handler = createEpicEnsembleObserver({ db, logs, badgeContext, badgeStorage })

    const result = await handler.handle(event, currentUserProgress)

    expect(result).toBe(undefined)
    expect(badgeContext.getWearablesWithRarity).not.toHaveBeenCalled()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })
})

function getWearableWithRarity(pointer: string, rarity: string) {
  return {
    version: 'v3',
    id: 'QmUq1RjbJJ2wMRmLzvrMhDLDTQGsC8cUnpVocBTfTAhcn9',
    type: 'wearable',
    pointers: [pointer],
    timestamp: 1641239710752,
    content: [],
    metadata: {
      id: pointer,
      name: 'Krampus-Jetpack',
      description: 'Lets Krampus fly around and deliver presents',
      collectionAddress: '0xf1483f042614105cb943d3dd67157256cd003028',
      rarity: rarity,
      i18n: [],
      data: [],
      image: 'image.png',
      thumbnail: 'thumbnail.png',
      metrics: []
    }
  }
}
