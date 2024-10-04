import { createLogComponent } from '@well-known-components/logger'
import { createDbMock } from '../../../mocks/db-mock'
import { AppComponents } from '../../../../src/types'
import { Events, ItemPublishedEvent } from '@dcl/schemas'
import { createWearableDesignerObserver } from '../../../../src/logic/badges/wearable-designer'
import { Badge, BadgeId, badges, createBadgeStorage, UserBadge } from '@badges/common'
import { timestamps } from '../../../utils'

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

    const mockUserProgress = getMockedUserProgress({
      completed_at: timestamps.twoMinutesBefore(timestamps.now()),
      steps: 100
    })

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('skip increasing the number of wearables published if the wearable was already published', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: ItemPublishedEvent = createItemPublishedEvent()

    const mockUserProgress = getMockedUserProgress({
      steps: 1,
      published_wearables: [{ itemId: 'anUrn', createdAt: timestamps.now() }]
    })

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('increase the number of wearables published and grant the first tier of the badge if the user published 1 wearable', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const itemId = `itemId-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      itemId,
      category: 'wearable'
    })

    const mockUserProgress = undefined

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(0, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 1 }))
  })

  it('increase the number of wearables published and return undefined if the user does not achieve a new tier', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const itemId = `itemId-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      itemId,
      category: 'wearable'
    })

    const mockUserProgress = getMockedUserProgress({
      steps: 1,
      published_wearables: Array.from({ length: 1 }, (_, i) => ({
        itemId: `itemId-${i}`,
        createdAt: timestamps.oneMinuteBefore(timestamps.now())
      }))
    })

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 2 }))
  })

  it('increase the number of wearables published and grant the second tier of the badge if the user published 5 wearables', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const itemId = `itemId-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      itemId,
      category: 'wearable'
    })

    const mockUserProgress = getMockedUserProgress({
      steps: 4,
      published_wearables: Array.from({ length: 4 }, (_, i) => ({
        itemId: `itemId-${i}`,
        createdAt: timestamps.oneMinuteBefore(timestamps.now())
      }))
    })

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(1, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 5 }))
  })

  it('increase the number of wearables published and grant the third tier of the badge if the user published 25 wearables', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const itemId = `itemId-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      itemId,
      category: 'wearable'
    })

    const mockUserProgress = getMockedUserProgress({
      steps: 24,
      published_wearables: Array.from({ length: 24 }, (_, i) => ({
        itemId: `itemId-${i}`,
        createdAt: timestamps.oneMinuteBefore(timestamps.now())
      }))
    })

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(2, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 25 }))
  })

  it('increase the number of wearables published and grant the fourth tier of the badge if the user published 50 wearables', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const itemId = `itemId-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      itemId,
      category: 'wearable'
    })

    const mockUserProgress = getMockedUserProgress({
      steps: 49,
      published_wearables: Array.from({ length: 49 }, (_, i) => ({
        itemId: `itemId-${i}`,
        createdAt: timestamps.oneMinuteBefore(timestamps.now())
      }))
    })

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(3, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 50 }))
  })

  it('increase the number of wearables published and grant the fifth tier of the badge if the user published 175 wearables', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const itemId = `itemId-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      itemId,
      category: 'wearable'
    })

    const mockUserProgress = getMockedUserProgress({
      steps: 174,
      published_wearables: Array.from({ length: 174 }, (_, i) => ({
        itemId: `itemId-${i}`,
        createdAt: timestamps.oneMinuteBefore(timestamps.now())
      }))
    })

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(4, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 175 }))
  })

  it('increase the number of wearables published, grant the last tier of the badge, and mark it as completed if the user published 350 wearables', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const itemId = `itemId-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      itemId,
      category: 'wearable'
    })

    const mockUserProgress = getMockedUserProgress({
      steps: 349,
      published_wearables: Array.from({ length: 349 }, (_, i) => ({
        itemId: `itemId-${i}`,
        createdAt: timestamps.oneMinuteBefore(timestamps.now())
      }))
    })

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

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
    options: { itemId?: string; category?: string; timestamp: number } = {
      itemId: 'anUrn',
      category: 'wearable',
      timestamp: Date.now()
    }
  ): ItemPublishedEvent {
    return {
      type: Events.Type.BLOCKCHAIN,
      subType: Events.SubType.Blockchain.ITEM_PUBLISHED,
      key: 'aKey',
      timestamp: options.timestamp,
      metadata: {
        creator: testAddress,
        category: options.category,
        itemId: options.itemId,
        network: 'aNetwork',
        urn: 'anUrn'
      }
    }
  }

  function getMockedUserProgress(progress: {
    steps: number
    published_wearables?: { itemId: string; createdAt: number }[]
    completed_at?: number
  }) {
    const { steps, published_wearables = [], completed_at } = progress
    return {
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
    }
  }

  function createExpectedUserProgress(progress: {
    steps: number
    completed?: boolean
    published_wearables?: { itemId: string; createdAt: number }[]
  }): Omit<UserBadge, 'updated_at'> {
    const { steps, completed, published_wearables } = progress
    return {
      user_address: testAddress,
      badge_id: BadgeId.WEARABLE_DESIGNER,
      progress: {
        steps,
        published_wearables: published_wearables || expect.any(Array<{ itemId: string; createdAt: number }>)
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
