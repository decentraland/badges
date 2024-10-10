import { BadgeId, createBadgeStorage, UserBadge } from '@badges/common'
import { AppComponents } from '../../../../src/types'
import { createDbMock } from '../../../mocks/db-mock'
import { CatalystDeploymentEvent, EntityType, Events } from '@dcl/schemas'
import { createRegallyRareObserver } from '../../../../src/logic/badges/regally-rare'
import { createLogComponent } from '@well-known-components/logger'
import { createBadgeContextMock } from '../../../mocks/badge-context-mock'
import { createBadgeStorageMock } from '../../../mocks/badge-storage-mock'

describe('Regally Rare badge handler should', () => {
  const testAddress = '0xTest'
  const wearableBaseUrn = 'urn:decentraland:mumbai:collections-v2:0xaa40af0b4a18e0555ff3c87beab1d5b591947abe:'

  async function getMockedComponents(): Promise<Pick<AppComponents, 'db' | 'logs' | 'badgeContext' | 'badgeStorage'>> {
    return {
      db: createDbMock(),
      badgeContext: createBadgeContextMock(),
      logs: await createLogComponent({ config: { requireString: jest.fn(), getString: jest.fn() } as any }),
      badgeStorage: await createBadgeStorageMock()
    }
  }

  it('grant badge when a Profile deployment contains at least three rare wearables', async () => {
    const { db, logs, badgeContext, badgeStorage } = await getMockedComponents()

    const wearablesUrn = [wearableBaseUrn + '1:1', wearableBaseUrn + '2:1', wearableBaseUrn + '3:1']

    const currentUserProgress: UserBadge = {
      user_address: testAddress,
      badge_id: BadgeId.REGALLY_RARE,
      progress: {},
      updated_at: 1708380838534
    }

    const event: CatalystDeploymentEvent = {
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
                wearables: wearablesUrn
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

    badgeContext.getWearablesWithRarity = jest
      .fn()
      .mockResolvedValue([
        getWearableWithRarity(wearablesUrn[0], 'rare'),
        getWearableWithRarity(wearablesUrn[1], 'rare'),
        getWearableWithRarity(wearablesUrn[2], 'rare')
      ])

    const handler = createRegallyRareObserver({ db, logs, badgeContext, badgeStorage })

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

  it('do not grant badge when a Profile deployment contains less than three rare wearables', async () => {
    const { db, logs, badgeContext, badgeStorage } = await getMockedComponents()

    const wearablesUrn = [wearableBaseUrn + '1:1', wearableBaseUrn + '2:1', wearableBaseUrn + '3:1']

    const currentUserProgress: UserBadge = {
      user_address: testAddress,
      badge_id: BadgeId.REGALLY_RARE,
      progress: {},
      updated_at: 1708380838534
    }

    const event: CatalystDeploymentEvent = {
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
                wearables: wearablesUrn
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

    badgeContext.getWearablesWithRarity = jest
      .fn()
      .mockResolvedValue([
        getWearableWithRarity(wearablesUrn[0], 'rare'),
        getWearableWithRarity(wearablesUrn[1], 'rare'),
        getWearableWithRarity(wearablesUrn[2], 'common')
      ])

    const handler = createRegallyRareObserver({ db, logs, badgeContext, badgeStorage })

    await handler.handle(event, currentUserProgress)

    expect(badgeContext.getWearablesWithRarity).toHaveBeenCalledWith(wearablesUrn)
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('do not grant badge when the user already has the badge granted', async () => {
    const { db, logs, badgeContext, badgeStorage } = await getMockedComponents()

    const wearablesUrn = [wearableBaseUrn + '1:1', wearableBaseUrn + '2:1', wearableBaseUrn + '3:1']

    const currentUserProgress: UserBadge = {
      user_address: testAddress,
      badge_id: BadgeId.REGALLY_RARE,
      completed_at: 1708380838534,
      progress: {
        completed_with: wearablesUrn
      },
      updated_at: 1708380838534
    }

    const event: CatalystDeploymentEvent = {
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
                wearables: wearablesUrn
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

    const handler = createRegallyRareObserver({ db, logs, badgeContext, badgeStorage })

    await handler.handle(event, currentUserProgress)

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
