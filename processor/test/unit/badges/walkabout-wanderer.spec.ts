import { createLogComponent } from '@well-known-components/logger'
import { createDbMock } from '../../mocks/db-mock'
import { AppComponents } from '../../../src/types'
import { AuthLinkType, Events, WalkedDistanceEvent } from '@dcl/schemas'
import { Badge, BadgeId, badges, createBadgeStorage, UserBadge } from '@badges/common'
import { timestamps } from '../../utils'
import { createWalkaboutWandererObserver } from '../../../src/logic/badges/walkabout-wanderer'

describe('Walkabout Wanderer badge handler should', () => {
  const testAddress = '0xTest'
  const testSessionId = 'testSessionid'

  const badge = badges.get(BadgeId.WALKABOUT_WANDERER) as Badge

  it('do nothing if the user already has completed all the badge tiers', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: WalkedDistanceEvent = createWalkedDistanceEvent()

    db.getUserProgressFor = mockUserProgress({
      completed_at: timestamps.twoMinutesBefore(timestamps.now()),
      steps: 10000000
    })

    const handler = createWalkaboutWandererObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('increase the steps walked by the user using the step count that comes in the event metadata', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: WalkedDistanceEvent = createWalkedDistanceEvent({ stepCount: 10 })

    db.getUserProgressFor = jest.fn().mockResolvedValue(undefined)

    const handler = createWalkaboutWandererObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 10 }))
  })

  it('increase the steps walked by the user and grant the first tier of the badge if the user reaches 10k steps', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: WalkedDistanceEvent = createWalkedDistanceEvent({
      stepCount: 500
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 9500
    })

    const handler = createWalkaboutWandererObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(0, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 10000 }))
  })

  it('increase the steps walked by the user and grant the second tier of the badge if the user reaches 40k steps', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: WalkedDistanceEvent = createWalkedDistanceEvent({
      stepCount: 25000
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 15000
    })

    const handler = createWalkaboutWandererObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(1, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 40000 }))
  })

  it('increase the steps walked by the user and grant the third tier of the badge if the user reaches 150k steps', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: WalkedDistanceEvent = createWalkedDistanceEvent({
      stepCount: 1
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 149999
    })

    const handler = createWalkaboutWandererObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(2, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 150000 }))
  })

  it('increase the steps walked by the user and grant the fourth tier of the badge if the user reaches 600k steps', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: WalkedDistanceEvent = createWalkedDistanceEvent({
      stepCount: 300000
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 300000
    })

    const handler = createWalkaboutWandererObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(3, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 600000 }))
  })

  it('increase the steps walked by the user and grant the fifth tier of the badge if the user reaches 2.5M steps', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: WalkedDistanceEvent = createWalkedDistanceEvent({
      stepCount: 500000
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 2000000
    })

    const handler = createWalkaboutWandererObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(4, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 2500000 }))
  })

  it('increase the steps walked by the user and grant the sixth tier of the badge if the user reaches 10M steps', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: WalkedDistanceEvent = createWalkedDistanceEvent({
      stepCount: 2500010
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 7500000
    })

    const handler = createWalkaboutWandererObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(5, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 10000010, completed: true }))
  })

  // Helpers
  async function getMockedComponents(): Promise<Pick<AppComponents, 'db' | 'logs' | 'badgeStorage'>> {
    return {
      db: createDbMock(),
      logs: await createLogComponent({ config: { requireString: jest.fn(), getString: jest.fn() } as any }),
      badgeStorage: await createBadgeStorage({
        config: { requireString: jest.fn().mockResolvedValue('https://any-url.tld') } as any
      })
    }
  }

  function createWalkedDistanceEvent(
    options: { sessionId?: string; timestamp?: number; stepCount?: number } = {
      sessionId: testSessionId,
      timestamp: Date.now(),
      stepCount: 0
    }
  ): WalkedDistanceEvent {
    return {
      type: Events.Type.CLIENT,
      subType: Events.SubType.Client.WALKED_DISTANCE,
      key: 'aKey',
      timestamp: options.timestamp,
      metadata: {
        authChain: [
          {
            payload: 'auth-chain-payload',
            type: AuthLinkType.SIGNER
          }
        ],
        distance: 1,
        stepCount: options.stepCount,
        sessionId: options.sessionId,
        timestamp: options.timestamp,
        userAddress: testAddress,
        realm: 'main'
      }
    }
  }

  function mockUserProgress(progress: { steps: number; completed_at?: number }) {
    const { steps, completed_at } = progress
    return jest.fn().mockResolvedValue({
      user_address: testAddress,
      badge_id: BadgeId.WALKABOUT_WANDERER,
      progress: {
        steps
      },
      achieved_tiers: badge.tiers
        .filter((tier) => steps >= tier.criteria.steps)
        .map((tier) => ({
          tier_id: tier.tierId,
          completed_at: timestamps.twoMinutesBefore(timestamps.now())
        })),
      completed_at
    })
  }

  function createExpectedUserProgress(progress: { steps: number; completed?: boolean }): Omit<UserBadge, 'updated_at'> {
    const { steps, completed } = progress
    return {
      user_address: testAddress,
      badge_id: BadgeId.WALKABOUT_WANDERER,
      progress: {
        steps
      },
      achieved_tiers: badge.tiers
        .filter((tier) => steps >= tier.criteria.steps)
        .map((tier) => ({
          tier_id: tier.tierId,
          completed_at: expect.any(Number)
        })),
      completed_at: completed ? expect.any(Number) : undefined
    }
  }

  function mapBadgeToHaveTierNth(index: number, badge: Badge): Badge {
    return {
      ...badge,
      tiers: [badge.tiers[index]]
    }
  }
})
