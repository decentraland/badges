import { createLogComponent } from '@well-known-components/logger'
import { createDbMock } from '../../mocks/db-mock'
import { AppComponents } from '../../../src/types'
import { Events, ItemPublishedEvent } from '@dcl/schemas'
import { createEmoteCreatorObserver } from '../../../src/logic/badges/emote-creator'
import { Badge, BadgeId, badges, createBadgeStorage, UserBadge } from '@badges/common'
import { timestamps } from '../../utils'

describe('Emote Creator badge handler should', () => {
  const testAddress = '0xTest'

  const badge = badges.get(BadgeId.EMOTE_CREATOR) as Badge

  it('do nothing if the item published is not an emote', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp: timestamps.now(),
      category: 'notAnEmote'
    })

    const handler = createEmoteCreatorObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('do nothing if the user already has completed all the badge tiers', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: ItemPublishedEvent = createItemPublishedEvent()

    db.getUserProgressFor = mockUserProgress({
      completed_at: timestamps.twoMinutesBefore(timestamps.now()),
      steps: 100
    })

    const handler = createEmoteCreatorObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('skip increasing the number of emotes published if the emote was already published', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: ItemPublishedEvent = createItemPublishedEvent()

    db.getUserProgressFor = mockUserProgress({
      steps: 1,
      published_emotes: ['anUrn']
    })

    const handler = createEmoteCreatorObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('increase the number of emotes published and grant the first tier of the badge if the user published 1 emote', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const urn = `urn-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      urn,
      category: 'emote'
    })

    db.getUserProgressFor = jest.fn().mockResolvedValue(undefined)

    const handler = createEmoteCreatorObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(0, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 1 }))
  })

  it('increase the number of emotes published and grant the second tier of the badge if the user published 5 emotes', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const urn = `urn-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      urn,
      category: 'emote'
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 4,
      published_emotes: Array.from({ length: 4 }, (_, i) => `urn-${i}`)
    })

    const handler = createEmoteCreatorObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(1, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 5 }))
  })

  it('increase the number of emotes published and grant the third tier of the badge if the user published 10 emotes', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const urn = `urn-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      urn,
      category: 'emote'
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 9,
      published_emotes: Array.from({ length: 9 }, (_, i) => `urn-${i}`)
    })

    const handler = createEmoteCreatorObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(2, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 10 }))
  })

  it('increase the number of emotes published and grant the fourth tier of the badge if the user published 20 emotes', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const urn = `urn-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      urn,
      category: 'emote'
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 19,
      published_emotes: Array.from({ length: 19 }, (_, i) => `urn-${i}`)
    })

    const handler = createEmoteCreatorObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(3, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 20 }))
  })

  it('increase the number of emotes published and grant the fifth tier of the badge if the user published 50 emotes', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const urn = `urn-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      urn,
      category: 'emote'
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 49,
      published_emotes: Array.from({ length: 49 }, (_, i) => `urn-${i}`)
    })

    const handler = createEmoteCreatorObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(4, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 50 }))
  })

  it('increase the number of emotes published, grant the last tier of the badge, and mark it as completed if the user published 100 emotes', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const urn = `urn-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      urn,
      category: 'emote'
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 99,
      published_emotes: Array.from({ length: 99 }, (_, i) => `urn-${i}`)
    })

    const handler = createEmoteCreatorObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(5, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 100, completed: true }))
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

  function createItemPublishedEvent(
    options: { urn?: string; category?: string; timestamp: number } = {
      urn: 'anUrn',
      category: 'emote',
      timestamp: Date.now()
    }
  ): ItemPublishedEvent {
    return {
      type: Events.Type.BLOCKCHAIN,
      subType: Events.SubType.Blockchain.ITEM_PUBLISHED,
      key: options.urn,
      timestamp: options.timestamp,
      metadata: {
        creator: testAddress,
        category: options.category,
        tokenId: 'aTokenId',
        network: 'aNetwork'
      }
    }
  }

  function mockUserProgress(progress: { steps: number; published_emotes?: string[]; completed_at?: number }) {
    const { steps, published_emotes = [], completed_at } = progress
    return jest.fn().mockResolvedValue({
      user_address: testAddress,
      badge_id: BadgeId.EMOTE_CREATOR,
      progress: {
        steps,
        published_emotes
      },
      achieved_tiers: badge.tiers
        .filter((tier) => steps > tier.criteria.steps)
        .map((tier) => ({
          tier_id: tier.tierId,
          completed_at: timestamps.twoMinutesBefore(timestamps.now())
        })),
      completed_at
    })
  }

  function createExpectedUserProgress(progress: {
    steps: number
    completed?: boolean
    last_used_emote_timestamp?: number
    published_emotes?: number[]
  }): Omit<UserBadge, 'updated_at'> {
    const { steps, completed, last_used_emote_timestamp, published_emotes } = progress
    return {
      user_address: testAddress,
      badge_id: BadgeId.EMOTE_CREATOR,
      progress: {
        steps,
        published_emotes: published_emotes || expect.any(Array<number>)
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
