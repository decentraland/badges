import { createLogComponent } from '@well-known-components/logger'
import { createDbMock } from '../../mocks/db-mock'
import { AppComponents } from '../../../src/types'
import { Events, PassportOpenedEvent } from '@dcl/schemas'
import { createSocialButterflyObserver } from '../../../src/logic/badges/social-butterfly'
import { Badge, BadgeId, badges, createBadgeStorage, UserBadge } from '@badges/common'
import { timestamps } from '../../utils'

describe('Social Butterfly badge handler should', () => {
  const testAddress = '0xTest'
  const testSessionId = 'testsessionid'
  const receiverAddress = '0xReceiver'

  const badge = badges.get(BadgeId.SOCIAL_BUTTERFLY) as Badge

  it('do nothing if the user already has completed all the badge tiers', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: PassportOpenedEvent = createPassportOpenedEvent()

    db.getUserProgressFor = mockUserProgress({
      completed_at: timestamps.twoMinutesBefore(timestamps.now()),
      steps: 1000
    })

    const handler = createSocialButterflyObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('skip increasing progress if the receiver was already visited', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: PassportOpenedEvent = createPassportOpenedEvent()

    db.getUserProgressFor = mockUserProgress({
      steps: 5,
      profiles_visited: [receiverAddress]
    })

    const handler = createSocialButterflyObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('should handle empty progress for new users', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: PassportOpenedEvent = createPassportOpenedEvent()

    db.getUserProgressFor = jest.fn().mockResolvedValue(undefined)

    const handler = createSocialButterflyObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 1 }))
  })

  it('increase the profile visits and grant the first tier of the badge if the user visit a profile for the first time', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: PassportOpenedEvent = createPassportOpenedEvent()

    db.getUserProgressFor = jest.fn().mockResolvedValue(undefined)

    const handler = createSocialButterflyObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(0, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 1 }))
  })

  it('increase the profile visits and grant the second tier of the badge if the user visit a profile emotes for more than (or exactly) 50 times', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: PassportOpenedEvent = createPassportOpenedEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 49
    })

    const handler = createSocialButterflyObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(1, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 50 }))
  })

  it('increase the profile visits and grant the third tier of the badge if the user visit a profile emotes for more than (or exactly) 100 times', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: PassportOpenedEvent = createPassportOpenedEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 99
    })

    const handler = createSocialButterflyObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(1, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 100 }))
  })

  it('increase the profile visits and grant the fourth tier of the badge if the user visit a profile emotes for more than (or exactly) 250 times', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: PassportOpenedEvent = createPassportOpenedEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 249
    })

    const handler = createSocialButterflyObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(1, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 250 }))
  })

  it('increase the profile visits and grant the fifth tier of the badge if the user visit a profile emotes for more than (or exactly) 500 times', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: PassportOpenedEvent = createPassportOpenedEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 499
    })

    const handler = createSocialButterflyObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(1, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 500 }))
  })

  it('increase the profile visits and grant the sixth tier of the badge if the user visit a profile emotes for more than (or exactly) 1000 times', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: PassportOpenedEvent = createPassportOpenedEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 999
    })

    const handler = createSocialButterflyObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(1, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 1000 }))
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

  function createPassportOpenedEvent(
    options: { sessionId: string; timestamp: number } = { sessionId: 'test-session', timestamp: Date.now() }
  ): PassportOpenedEvent {
    return {
      type: Events.Type.CLIENT,
      subType: Events.SubType.Client.PASSPORT_OPENED,
      key: 'aKey',
      timestamp: options.timestamp,
      metadata: {
        userAddress: testAddress,
        passport: {
          receiver: '0xReceiver'
        }
      }
    }
  }

  function mockUserProgress(progress: {
    steps: number
    profiles_visited?: string[]
    achieved_tiers?: UserBadge['achieved_tiers']
    completed_at?: number
  }) {
    const { steps, profiles_visited, achieved_tiers = [], completed_at } = progress
    return jest.fn().mockResolvedValue({
      user_address: testAddress,
      badge_id: BadgeId.SOCIAL_BUTTERFLY,
      progress: {
        steps,
        profiles_visited: profiles_visited || []
      },
      achieved_tiers:
        achieved_tiers ||
        badge.tiers
          .filter((tier) => steps >= tier.criteria.steps)
          .map((tier) => ({
            tier_id: tier.tierId,
            completed_at: timestamps.twoMinutesBefore(timestamps.now())
          })),
      completed_at
    })
  }

  function createExpectedUserProgress(progress: {
    steps: number
    profiles_visited?: string[]
    completed?: boolean
  }): Omit<UserBadge, 'updated_at'> {
    const { steps, profiles_visited, completed } = progress
    return {
      user_address: testAddress,
      badge_id: BadgeId.SOCIAL_BUTTERFLY,
      progress: {
        steps,
        profiles_visited: profiles_visited || expect.any(Array<string>)
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
