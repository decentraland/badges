import { createLogComponent } from '@well-known-components/logger'
import { createDbMock } from '../../../mocks/db-mock'
import { AppComponents } from '../../../../src/types'
import { AuthLinkType, Events, UsedEmoteEvent } from '@dcl/schemas'
import { createMovesMasterObserver, MINUTES_IN_DAY } from '../../../../src/logic/badges/moves-master'
import { Badge, BadgeId, badges, createBadgeStorage, UserBadge } from '@badges/common'
import {
  getExpectedUserProgressForBadgeWithTiersBuilder,
  getMockedUserProgressForBadgeWithTiersBuilder,
  mapBadgeToHaveTierNth,
  timestamps
} from '../../../utils'

describe('Moves Master badge handler should', () => {
  const testAddress = '0xTest'
  const testSessionId = 'testsessionid'

  const createMockedUserProgress = getMockedUserProgressForBadgeWithTiersBuilder(BadgeId.MOVES_MASTER, testAddress)
  const createExpectedUserProgress = getExpectedUserProgressForBadgeWithTiersBuilder(BadgeId.MOVES_MASTER, testAddress)

  it('do nothing if the user already has completed all the badge tiers', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: UsedEmoteEvent = createUsedEmoteEvent()

    const mockUserProgress = createMockedUserProgress({
      completed_at: timestamps.twoMinutesBefore(timestamps.now()),
      progress: {
        steps: 500000,
        last_used_emote_timestamp: timestamps.twoMinutesBefore(timestamps.now()),
        last_day_used_emotes_timestamps: []
      }
    })

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('skip increasing the usages of emotes if the event is in the same minute than the last used emote event', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const timestamp = timestamps.now()
    const event: UsedEmoteEvent = createUsedEmoteEvent({
      sessionId: testSessionId,
      timestamp: timestamp
    })

    const mockUserProgress = createMockedUserProgress({
      progress: {
        steps: 5,
        last_used_emote_timestamp: timestamp,
        last_day_used_emotes_timestamps: []
      }
    })

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('skip increasing the usages of emotes if the event is older than the last used emote event', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const timestamp = timestamps.now()

    const event: UsedEmoteEvent = createUsedEmoteEvent({
      sessionId: testSessionId,
      timestamp: timestamps.twoMinutesBefore(timestamp)
    })

    const mockUserProgress = createMockedUserProgress({
      progress: {
        steps: 5,
        last_used_emote_timestamp: timestamp,
        last_day_used_emotes_timestamps: []
      }
    })

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('should not return a new achieved tier for new users with empty progress', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: UsedEmoteEvent = createUsedEmoteEvent()

    const mockUserProgress = undefined

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 1 }))
  })

  it('should not update the user progress when the new timestamp matches the last used timestamp exactly', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const timestamp = timestamps.now()
    const event: UsedEmoteEvent = createUsedEmoteEvent()

    // Mock user progress where the last timestamp equals the event timestamp
    const mockUserProgress = createMockedUserProgress({
      progress: {
        steps: 5,
        last_used_emote_timestamp: timestamp,
        last_day_used_emotes_timestamps: []
      }
    })

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('should remove the oldest timestamp and add the new one when user progress last_day_used_emotes_timestamps reaches the limit of 1440', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const timestamp = timestamps.now()
    const event: UsedEmoteEvent = createUsedEmoteEvent()

    // Mock user progress with exactly 1440 timestamps (one day of timestamps, one per minute)
    const lastDayTimestamps = Array.from({ length: MINUTES_IN_DAY }, (_, i) => timestamp - i * 60000)
    const mockUserProgress = createMockedUserProgress({
      progress: {
        steps: 1440,
        last_used_emote_timestamp: timestamps.twoMinutesBefore(timestamp),
        last_day_used_emotes_timestamps: lastDayTimestamps
      }
    })

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).toHaveBeenCalledWith(
      getExpectedUserProgress({
        steps: 1441,
        last_day_used_emotes_timestamps: Array.from({ length: MINUTES_IN_DAY }, (_) => expect.any(Number))
      })
    )
  })

  it('should modify the user progress adding the new timestamp to the array when the last_day_used_emotes_timestamps is empty', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: UsedEmoteEvent = createUsedEmoteEvent()

    const mockUserProgress = createMockedUserProgress({
      progress: {
        steps: 5,
        last_used_emote_timestamp: timestamps.twoMinutesBefore(timestamps.now()),
        last_day_used_emotes_timestamps: []
      }
    })

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 6 }))
  })

  it('increase the usages of emotes if the user used one for the first time in the last minute', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: UsedEmoteEvent = createUsedEmoteEvent()

    const mockUserProgress = undefined

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 1 }))
  })

  it('increase the usages of emotes and grant the first tier of the badge if the user used emotes for more than (or exactly) 100 times', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: UsedEmoteEvent = createUsedEmoteEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })

    const mockUserProgress = createMockedUserProgress({
      progress: {
        steps: 99,
        last_used_emote_timestamp: timestamps.twoMinutesBefore(timestamps.now()),
        last_day_used_emotes_timestamps: []
      }
    })

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(0, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 100 }))
  })

  it('increase the usages of emotes and grant the second tier of the badge if the user used emotes for more than (or exactly) 1000 times', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: UsedEmoteEvent = createUsedEmoteEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })

    const mockUserProgress = createMockedUserProgress({
      progress: {
        steps: 999,
        last_used_emote_timestamp: timestamps.twoMinutesBefore(timestamps.now()),
        last_day_used_emotes_timestamps: []
      }
    })

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(1, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 1000 }))
  })

  it('increase the usages of emotes and grant the third tier of the badge if the user used emotes for more than (or exactly) 5000 times', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: UsedEmoteEvent = createUsedEmoteEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })

    const mockUserProgress = createMockedUserProgress({
      progress: {
        steps: 4999,
        last_used_emote_timestamp: timestamps.twoMinutesBefore(timestamps.now()),
        last_day_used_emotes_timestamps: []
      }
    })

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(2, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 5000 }))
  })

  it('increase the usages of emotes and grant the fourth tier of the badge if the user used emotes for more than (or exactly) 10000 times', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: UsedEmoteEvent = createUsedEmoteEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })

    const mockUserProgress = createMockedUserProgress({
      progress: {
        steps: 9999,
        last_used_emote_timestamp: timestamps.twoMinutesBefore(timestamps.now()),
        last_day_used_emotes_timestamps: []
      }
    })

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(3, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 10000 }))
  })

  it('increase the usages of emotes and grant the fifth tier of the badge if the user used emotes for more than (or exactly) 100000 times', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: UsedEmoteEvent = createUsedEmoteEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })

    const mockUserProgress = createMockedUserProgress({
      progress: {
        steps: 99999,
        last_used_emote_timestamp: timestamps.twoMinutesBefore(timestamps.now()),
        last_day_used_emotes_timestamps: []
      }
    })

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(4, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 100000 }))
  })

  it('increase the usages of emotes and grant the fifth tier of the badge if the user used emotes for more than (or exactly) 500000 times', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: UsedEmoteEvent = createUsedEmoteEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })

    const mockUserProgress = createMockedUserProgress({
      progress: {
        steps: 499999,
        last_used_emote_timestamp: timestamps.twoMinutesBefore(timestamps.now()),
        last_day_used_emotes_timestamps: []
      }
    })

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(5, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 500000, completed: true }))
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

  function createUsedEmoteEvent(
    options: { sessionId: string; timestamp: number } = { sessionId: testSessionId, timestamp: Date.now() }
  ): UsedEmoteEvent {
    return {
      type: Events.Type.CLIENT,
      subType: Events.SubType.Client.USED_EMOTE,
      key: 'aKey',
      timestamp: options.timestamp,
      metadata: {
        authChain: [
          {
            payload: 'auth-chain-payload',
            type: AuthLinkType.SIGNER
          }
        ],
        emote: {
          emoteIndex: 0,
          isBase: true,
          itemId: 'anItemId',
          source: 'aSource'
        },
        sessionId: options.sessionId,
        timestamp: options.timestamp,
        userAddress: testAddress,
        realm: 'main'
      }
    }
  }

  function getExpectedUserProgress(progress: {
    steps: number
    completed?: boolean
    last_used_emote_timestamp?: number
    last_day_used_emotes_timestamps?: number[]
  }): Omit<UserBadge, 'updated_at'> {
    const { steps, completed, last_used_emote_timestamp, last_day_used_emotes_timestamps } = progress
    return createExpectedUserProgress({
      progress: {
        steps,
        last_used_emote_timestamp: last_used_emote_timestamp || expect.any(Number),
        last_day_used_emotes_timestamps: last_day_used_emotes_timestamps || expect.any(Array<number>)
      },
      completed
    })
  }
})
