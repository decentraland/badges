import { createLogComponent } from '@well-known-components/logger'
import { createDbMock } from '../../mocks/db-mock'
import { AppComponents } from '../../../src/types'
import { Events, ItemPublishedEvent } from '@dcl/schemas'
import { createWearableDesignerObserver } from '../../../src/logic/badges/wearable-designer'
import { Badge, BadgeId, badges, createBadgeStorage, UserBadge } from '@badges/common'
import { timestamps } from '../../utils'

describe('Wearable Designer badge handler should', () => {
  const testAddress = '0xTest'

  const badge = badges.get(BadgeId.WEARABLE_DESIGNER) as Badge

  it('do nothing if the item published is not a wearable', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp: timestamps.now(),
      category: 'notAWearable'
    })

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
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

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('skip increasing the number of wearables published if the wearable was already published', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: ItemPublishedEvent = createItemPublishedEvent()

    db.getUserProgressFor = mockUserProgress({
      steps: 1,
      published_wearables: ['anUrn']
    })

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('increase the number of wearables published and grant the first tier of the badge if the user published 1 wearable', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const urn = `urn-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      urn,
      category: 'wearable'
    })

    db.getUserProgressFor = jest.fn().mockResolvedValue(undefined)

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(0, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 1 }))
  })

  it('increase the number of wearables published and return undefined if the user does not achieve a new tier', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const urn = `urn-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      urn,
      category: 'wearable'
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 1,
      published_wearables: Array.from({ length: 1 }, (_, i) => `urn-${i}`)
    })

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 2 }))
  })

  it('increase the number of wearables published and grant the second tier of the badge if the user published 5 wearables', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const urn = `urn-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      urn,
      category: 'wearable'
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 4,
      published_wearables: Array.from({ length: 4 }, (_, i) => `urn-${i}`)
    })

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(1, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 5 }))
  })

  it('increase the number of wearables published and grant the third tier of the badge if the user published 25 wearables', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const urn = `urn-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      urn,
      category: 'wearable'
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 24,
      published_wearables: Array.from({ length: 24 }, (_, i) => `urn-${i}`)
    })

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(2, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 25 }))
  })

  it('increase the number of wearables published and grant the fourth tier of the badge if the user published 50 wearables', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const urn = `urn-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      urn,
      category: 'wearable'
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 49,
      published_wearables: Array.from({ length: 49 }, (_, i) => `urn-${i}`)
    })

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(3, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 50 }))
  })

  it('increase the number of wearables published and grant the fifth tier of the badge if the user published 175 wearables', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const urn = `urn-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      urn,
      category: 'wearable'
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 174,
      published_wearables: Array.from({ length: 174 }, (_, i) => `urn-${i}`)
    })

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(4, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 175 }))
  })

  it('increase the number of wearables published, grant the last tier of the badge, and mark it as completed if the user published 350 wearables', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const urn = `urn-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      urn,
      category: 'wearable'
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 349,
      published_wearables: Array.from({ length: 349 }, (_, i) => `urn-${i}`)
    })

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(5, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 350, completed: true }))
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
      category: 'wearable',
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

  function mockUserProgress(progress: { steps: number; published_wearables?: string[]; completed_at?: number }) {
    const { steps, published_wearables = [], completed_at } = progress
    return jest.fn().mockResolvedValue({
      user_address: testAddress,
      badge_id: BadgeId.WEARABLE_DESIGNER,
      progress: {
        steps,
        published_wearables
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

  function createExpectedUserProgress(progress: {
    steps: number
    completed?: boolean
    last_used_wearable_timestamp?: number
    published_wearables?: number[]
  }): Omit<UserBadge, 'updated_at'> {
    const { steps, completed, last_used_wearable_timestamp, published_wearables } = progress
    return {
      user_address: testAddress,
      badge_id: BadgeId.WEARABLE_DESIGNER,
      progress: {
        steps,
        published_wearables: published_wearables || expect.any(Array<number>)
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