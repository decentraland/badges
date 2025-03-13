import { AuthLinkType, Events, PassportOpenedEvent } from '@dcl/schemas'
import { createSocialButterflyObserver } from '../../../../src/logic/badges/social-butterfly'
import { BadgeId, UserBadge } from '@badges/common'
import {
  getExpectedUserProgressForBadgeBuilder,
  getMockedComponents,
  getMockedUserProgressForBadgeWithTiersBuilder,
  mapBadgeToHaveTierNth,
  timestamps
} from '../../../utils'

describe('Social Butterfly badge handler should', () => {
  const testAddress = '0xTest'
  const testSessionId = 'testsessionid'
  const receiverAddress = '0xReceiver'

  const createMockedUserProgress = getMockedUserProgressForBadgeWithTiersBuilder(BadgeId.SOCIAL_BUTTERFLY, testAddress)
  const createExpectedUserProgress = getExpectedUserProgressForBadgeBuilder(BadgeId.SOCIAL_BUTTERFLY, testAddress)

  it('do nothing if the user already has completed all the badge tiers', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: PassportOpenedEvent = createPassportOpenedEvent()

    const mockUserProgress = createMockedUserProgress({
      completed_at: timestamps.twoMinutesBefore(timestamps.now()),
      progress: {
        steps: 1000
      }
    })

    const handler = createSocialButterflyObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('do nothing if the user opened their passport', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: PassportOpenedEvent = createPassportOpenedEvent()
    event.metadata.passport.receiver = testAddress

    const handler = createSocialButterflyObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('skip increasing progress if the receiver was already visited', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: PassportOpenedEvent = createPassportOpenedEvent()

    const mockUserProgress = createMockedUserProgress({
      progress: {
        steps: 5,
        profiles_visited: [receiverAddress]
      }
    })

    const handler = createSocialButterflyObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('increase the profile visits and grant the first tier of the badge if the user visit a profile for the first time', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: PassportOpenedEvent = createPassportOpenedEvent()

    const handler = createSocialButterflyObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(0, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 1 }))
  })

  it('increase the profile visits and grant the second tier of the badge if the user visit a profile emotes for more than (or exactly) 50 times', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: PassportOpenedEvent = createPassportOpenedEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })

    const mockUserProgress = createMockedUserProgress({
      progress: {
        steps: 49
      }
    })

    const handler = createSocialButterflyObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(1, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 50 }))
  })

  it('increase the profile visits and grant the third tier of the badge if the user visit a profile emotes for more than (or exactly) 100 times', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: PassportOpenedEvent = createPassportOpenedEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })

    const mockUserProgress = createMockedUserProgress({
      progress: {
        steps: 99
      }
    })

    const handler = createSocialButterflyObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(2, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 100 }))
  })

  it('increase the profile visits and grant the fourth tier of the badge if the user visit a profile emotes for more than (or exactly) 250 times', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: PassportOpenedEvent = createPassportOpenedEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })

    const mockUserProgress = createMockedUserProgress({
      progress: {
        steps: 249
      }
    })

    const handler = createSocialButterflyObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(3, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 250 }))
  })

  it('increase the profile visits and grant the fifth tier of the badge if the user visit a profile emotes for more than (or exactly) 500 times', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: PassportOpenedEvent = createPassportOpenedEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })

    const mockUserProgress = createMockedUserProgress({
      progress: {
        steps: 499
      }
    })

    const handler = createSocialButterflyObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(4, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 500 }))
  })

  it('increase the profile visits and grant the sixth tier of the badge if the user visit a profile emotes for more than (or exactly) 1000 times', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: PassportOpenedEvent = createPassportOpenedEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })

    const mockUserProgress = createMockedUserProgress({
      progress: {
        steps: 999
      }
    })

    const handler = createSocialButterflyObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(5, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 1000, completed: true }))
  })

  // Helpers
  function createPassportOpenedEvent(
    options: { sessionId: string; timestamp: number } = { sessionId: 'test-session', timestamp: Date.now() }
  ): PassportOpenedEvent {
    return {
      type: Events.Type.CLIENT,
      subType: Events.SubType.Client.PASSPORT_OPENED,
      key: 'aKey',
      timestamp: options.timestamp,
      metadata: {
        authChain: [
          {
            payload: 'auth-chain-payload',
            type: AuthLinkType.SIGNER
          }
        ],
        passport: {
          receiver: '0xReceiver'
        },
        sessionId: options.sessionId,
        timestamp: options.timestamp,
        timestamps: {
          reportedAt: options.timestamp - 1000,
          receivedAt: options.timestamp - 500
        },
        userAddress: testAddress,
        realm: 'main'
      }
    }
  }

  function getExpectedUserProgress(progress: { steps: number; completed?: boolean }): Omit<UserBadge, 'updated_at'> {
    const { steps, completed } = progress
    return createExpectedUserProgress({
      progress: {
        steps,
        profiles_visited: expect.any(Array<string>)
      },
      completed
    })
  }
})
