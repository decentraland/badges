import { createLogComponent } from '@well-known-components/logger'
import { createDbMock } from '../../mocks/db-mock'
import { AppComponents } from '../../../src/types'
import { AuthLinkType, Events, UsedEmoteEvent } from '@dcl/schemas'
import { createMovesMasterObserver } from '../../../src/logic/badges/moves-master'
import { Badge, BadgeId, createBadgeStorage } from '@badges/common'

describe('Moves Master badge handler should', () => {
  const testAddress = '0xTest'
  const testSessionId = 'testsessionid'
  const timestamps = {
    now: () => Date.now(),
    oneMinuteBefore: (from: number) => from - 60 * 1000,
    twoMinutesBefore: (from: number) => from - 2 * 60 * 1000,
    tenSecondsBefore: (from: number) => from - 10 * 1000,
    thirtySecondsBefore: (from: number) => from - 30 * 1000,
    thirtySecondsInFuture: (from: number) => from + 30 * 1000
  }

  it('do nothing if the user already has completed all the badge tiers', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: UsedEmoteEvent = createUsedEmoteEvent()

    db.getUserProgressFor = jest.fn().mockResolvedValue({
      completed_at: timestamps.twoMinutesBefore(timestamps.now()),
      progress: { steps: 500000, last_used_emote_timestamp: timestamps.twoMinutesBefore(timestamps.now()) }
    })

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

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

    db.getUserProgressFor = jest.fn().mockResolvedValue({
      progress: { steps: 5, last_used_emote_timestamp: timestamp },
      achieved_tiers: []
    })

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

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

    db.getUserProgressFor = jest.fn().mockResolvedValue({
      progress: { steps: 5, last_used_emote_timestamp: timestamp },
      achieved_tiers: []
    })

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('increase the usages of emotes if the user used one for the first time in the last minute', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: UsedEmoteEvent = createUsedEmoteEvent()

    db.getUserProgressFor = jest.fn().mockResolvedValue(undefined)

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).toHaveBeenCalledWith({
      user_address: testAddress,
      badge_id: BadgeId.MOVES_MASTER,
      progress: {
        steps: 1,
        last_used_emote_timestamp: expect.any(Number)
      },
      achieved_tiers: []
    })
  })

  it('increase the usages of emotes and grant the first tier of the badge if the user used emotes for more than (or exactly) 100 times', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: UsedEmoteEvent = createUsedEmoteEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })

    db.getUserProgressFor = jest.fn().mockResolvedValue({
      user_address: testAddress,
      badge_id: BadgeId.MOVES_MASTER,
      progress: {
        steps: 99,
        last_used_emote_timestamp: timestamps.twoMinutesBefore(timestamps.now())
      },
      achieved_tiers: []
    })

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(0, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith({
      user_address: testAddress,
      badge_id: BadgeId.MOVES_MASTER,
      progress: {
        steps: 100,
        last_used_emote_timestamp: expect.any(Number)
      },
      achieved_tiers: [
        {
          completed_at: expect.any(Number),
          tier_id: 'moves-master-starter'
        }
      ]
    })
  })

  it('increase the usages of emotes and grant the second tier of the badge if the user used emotes for more than (or exactly) 1000 times', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: UsedEmoteEvent = createUsedEmoteEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })

    db.getUserProgressFor = jest.fn().mockResolvedValue({
      user_address: testAddress,
      badge_id: BadgeId.MOVES_MASTER,
      progress: {
        steps: 999,
        last_used_emote_timestamp: timestamps.twoMinutesBefore(timestamps.now())
      },
      achieved_tiers: [
        {
          completed_at: timestamps.twoMinutesBefore(timestamps.now()),
          tier_id: 'moves-master-starter'
        }
      ]
    })

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(1, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith({
      user_address: testAddress,
      badge_id: BadgeId.MOVES_MASTER,
      progress: {
        steps: 1000,
        last_used_emote_timestamp: expect.any(Number)
      },
      achieved_tiers: [
        {
          completed_at: expect.any(Number),
          tier_id: 'moves-master-starter'
        },
        {
          completed_at: expect.any(Number),
          tier_id: 'moves-master-bronze'
        }
      ]
    })
  })

  it('increase the usages of emotes and grant the third tier of the badge if the user used emotes for more than (or exactly) 5000 times', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: UsedEmoteEvent = createUsedEmoteEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })

    db.getUserProgressFor = jest.fn().mockResolvedValue({
      user_address: testAddress,
      badge_id: BadgeId.MOVES_MASTER,
      progress: {
        steps: 4999,
        last_used_emote_timestamp: timestamps.twoMinutesBefore(timestamps.now())
      },
      achieved_tiers: [
        {
          completed_at: timestamps.twoMinutesBefore(timestamps.now()),
          tier_id: 'moves-master-starter'
        },
        {
          completed_at: timestamps.twoMinutesBefore(timestamps.now()),
          tier_id: 'moves-master-bronze'
        }
      ]
    })

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(2, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith({
      user_address: testAddress,
      badge_id: BadgeId.MOVES_MASTER,
      progress: {
        steps: 5000,
        last_used_emote_timestamp: expect.any(Number)
      },
      achieved_tiers: [
        {
          completed_at: expect.any(Number),
          tier_id: 'moves-master-starter'
        },
        {
          completed_at: expect.any(Number),
          tier_id: 'moves-master-bronze'
        },
        {
          completed_at: expect.any(Number),
          tier_id: 'moves-master-silver'
        }
      ]
    })
  })

  it('increase the usages of emotes and grant the fourth tier of the badge if the user used emotes for more than (or exactly) 10000 times', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: UsedEmoteEvent = createUsedEmoteEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })

    db.getUserProgressFor = jest.fn().mockResolvedValue({
      user_address: testAddress,
      badge_id: BadgeId.MOVES_MASTER,
      progress: {
        steps: 9999,
        last_used_emote_timestamp: timestamps.twoMinutesBefore(timestamps.now())
      },
      achieved_tiers: [
        {
          completed_at: timestamps.twoMinutesBefore(timestamps.now()),
          tier_id: 'moves-master-starter'
        },
        {
          completed_at: timestamps.twoMinutesBefore(timestamps.now()),
          tier_id: 'moves-master-bronze'
        },
        {
          completed_at: timestamps.twoMinutesBefore(timestamps.now()),
          tier_id: 'moves-master-silver'
        }
      ]
    })

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(3, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith({
      user_address: testAddress,
      badge_id: BadgeId.MOVES_MASTER,
      progress: {
        steps: 10000,
        last_used_emote_timestamp: expect.any(Number)
      },
      achieved_tiers: [
        {
          completed_at: expect.any(Number),
          tier_id: 'moves-master-starter'
        },
        {
          completed_at: expect.any(Number),
          tier_id: 'moves-master-bronze'
        },
        {
          completed_at: expect.any(Number),
          tier_id: 'moves-master-silver'
        },
        {
          completed_at: expect.any(Number),
          tier_id: 'moves-master-gold'
        }
      ]
    })
  })

  it('increase the usages of emotes and grant the fifth tier of the badge if the user used emotes for more than (or exactly) 100000 times', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: UsedEmoteEvent = createUsedEmoteEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })

    db.getUserProgressFor = jest.fn().mockResolvedValue({
      user_address: testAddress,
      badge_id: BadgeId.MOVES_MASTER,
      progress: {
        steps: 99999,
        last_used_emote_timestamp: timestamps.twoMinutesBefore(timestamps.now())
      },
      achieved_tiers: [
        {
          completed_at: timestamps.twoMinutesBefore(timestamps.now()),
          tier_id: 'moves-master-starter'
        },
        {
          completed_at: timestamps.twoMinutesBefore(timestamps.now()),
          tier_id: 'moves-master-bronze'
        },
        {
          completed_at: timestamps.twoMinutesBefore(timestamps.now()),
          tier_id: 'moves-master-silver'
        },
        {
          completed_at: timestamps.twoMinutesBefore(timestamps.now()),
          tier_id: 'moves-master-gold'
        }
      ]
    })

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(4, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith({
      user_address: testAddress,
      badge_id: BadgeId.MOVES_MASTER,
      progress: {
        steps: 100000,
        last_used_emote_timestamp: expect.any(Number)
      },
      achieved_tiers: [
        {
          completed_at: expect.any(Number),
          tier_id: 'moves-master-starter'
        },
        {
          completed_at: expect.any(Number),
          tier_id: 'moves-master-bronze'
        },
        {
          completed_at: expect.any(Number),
          tier_id: 'moves-master-silver'
        },
        {
          completed_at: expect.any(Number),
          tier_id: 'moves-master-gold'
        },
        {
          completed_at: expect.any(Number),
          tier_id: 'moves-master-platinum'
        }
      ]
    })
  })

  it('increase the usages of emotes and grant the fifth tier of the badge if the user used emotes for more than (or exactly) 500000 times', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: UsedEmoteEvent = createUsedEmoteEvent({
      sessionId: testSessionId,
      timestamp: timestamps.thirtySecondsInFuture(timestamps.now())
    })

    db.getUserProgressFor = jest.fn().mockResolvedValue({
      user_address: testAddress,
      badge_id: BadgeId.MOVES_MASTER,
      progress: {
        steps: 499999,
        last_used_emote_timestamp: timestamps.twoMinutesBefore(timestamps.now())
      },
      achieved_tiers: [
        {
          completed_at: timestamps.twoMinutesBefore(timestamps.now()),
          tier_id: 'moves-master-starter'
        },
        {
          completed_at: timestamps.twoMinutesBefore(timestamps.now()),
          tier_id: 'moves-master-bronze'
        },
        {
          completed_at: timestamps.twoMinutesBefore(timestamps.now()),
          tier_id: 'moves-master-silver'
        },
        {
          completed_at: timestamps.twoMinutesBefore(timestamps.now()),
          tier_id: 'moves-master-gold'
        },
        {
          completed_at: timestamps.twoMinutesBefore(timestamps.now()),
          tier_id: 'moves-master-platinum'
        }
      ]
    })

    const handler = createMovesMasterObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(5, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith({
      user_address: testAddress,
      badge_id: BadgeId.MOVES_MASTER,
      completed_at: expect.any(Number),
      progress: {
        steps: 500000,
        last_used_emote_timestamp: expect.any(Number)
      },
      achieved_tiers: [
        {
          completed_at: expect.any(Number),
          tier_id: 'moves-master-starter'
        },
        {
          completed_at: expect.any(Number),
          tier_id: 'moves-master-bronze'
        },
        {
          completed_at: expect.any(Number),
          tier_id: 'moves-master-silver'
        },
        {
          completed_at: expect.any(Number),
          tier_id: 'moves-master-gold'
        },
        {
          completed_at: expect.any(Number),
          tier_id: 'moves-master-platinum'
        },
        {
          completed_at: expect.any(Number),
          tier_id: 'moves-master-diamond'
        }
      ]
    })
  })

  // Helpers
  async function getMockedComponents(): Promise<Pick<AppComponents, 'db' | 'logs' | 'memoryStorage' | 'badgeStorage'>> {
    return {
      db: createDbMock(),
      memoryStorage: {
        get: jest.fn(),
        set: jest.fn()
      },
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

  function mapBadgeToHaveTierNth(index: number, badge: Badge): Badge {
    return {
      ...badge,
      tiers: [badge.tiers[index]]
    }
  }
})
