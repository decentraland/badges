import { createLogComponent } from '@well-known-components/logger'
import { AppComponents } from '../../../src/types'
import { createDbMock } from '../../mocks/db-mock'
import { AuthLinkType, Events, MoveToParcelEvent } from '@dcl/schemas'
import { createDecentralandCitizenObserver } from '../../../src/logic/badges/decentraland-citizen'
import { BadgeId, createBadgeStorage } from '@badges/common'

describe('Decentraland Citizen badge handler should', () => {
  const testAddress = '0xTest'

  async function getMockedComponents(): Promise<Pick<AppComponents, 'db' | 'logs' | 'badgeStorage'>> {
    return {
      db: createDbMock(),
      logs: await createLogComponent({ config: { requireString: jest.fn(), getString: jest.fn() } as any }),
      badgeStorage: await createBadgeStorage({
        config: { requireString: jest.fn().mockResolvedValue('https://any-url.tld') } as any
      })
    }
  }

  it('grant badge when a user moves to a parcel by first-time (log-in into world)', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const event: MoveToParcelEvent = {
      type: Events.Type.CLIENT,
      subType: Events.SubType.Client.MOVE_TO_PARCEL,
      key: 'aKey',
      timestamp: 1708380838534,
      metadata: {
        authChain: [
          {
            payload: 'auth-chain-payload',
            type: AuthLinkType.SIGNER
          }
        ],
        parcel: {
          isEmptyParcel: false,
          newParcel: '0,1',
          oldParcel: '0,0',
          sceneHash: 'aSceneHash'
        },
        sessionId: 'testsessionid',
        timestamp: 1708380838504,
        userAddress: testAddress,
        realm: 'main'
      }
    }

    db.getUserProgressFor = jest.fn().mockResolvedValue(undefined)

    const handler = createDecentralandCitizenObserver({ db, logs, badgeStorage })

    const result = await handler.handle(event)

    expect(db.getUserProgressFor).toHaveBeenCalledWith(BadgeId.DECENTRALAND_CITIZEN, testAddress)
    expect(db.saveUserProgress).toHaveBeenCalledWith({
      user_address: testAddress,
      badge_id: BadgeId.DECENTRALAND_CITIZEN,
      completed_at: expect.any(Number),
      progress: {
        steps: 1,
        visited: '0,1'
      }
    })
    expect(result).toMatchObject({
      badgeGranted: handler.badge,
      userAddress: testAddress
    })
  })

  it('do not grant badge when the user already has the badge granted', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const event: MoveToParcelEvent = {
      type: Events.Type.CLIENT,
      subType: Events.SubType.Client.MOVE_TO_PARCEL,
      key: 'aKey',
      timestamp: 1708380838534,
      metadata: {
        authChain: [
          {
            payload: 'auth-chain-payload',
            type: AuthLinkType.SIGNER
          }
        ],
        parcel: {
          isEmptyParcel: false,
          newParcel: '0,1',
          oldParcel: '0,0',
          sceneHash: 'aSceneHash'
        },
        sessionId: 'testSessionId',
        timestamp: 1708380838504,
        userAddress: testAddress,
        realm: 'main'
      }
    }

    db.getUserProgressFor = jest.fn().mockResolvedValue({
      user_address: testAddress,
      badge_id: BadgeId.DECENTRALAND_CITIZEN,
      completed_at: 1708380838534,
      progress: {
        visited: '0,1'
      }
    })

    const handler = createDecentralandCitizenObserver({ db, logs, badgeStorage })

    const result = await handler.handle(event)

    expect(db.getUserProgressFor).toHaveBeenCalledWith(BadgeId.DECENTRALAND_CITIZEN, testAddress)
    expect(db.saveUserProgress).not.toHaveBeenCalled()
    expect(result).toBe(undefined)
  })
})
