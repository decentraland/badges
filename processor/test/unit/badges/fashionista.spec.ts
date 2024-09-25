import { createLogComponent } from '@well-known-components/logger'
import { createDbMock } from '../../mocks/db-mock'
import { AppComponents } from '../../../src/types'
import { Events, ItemSoldEvent } from '@dcl/schemas'
import { createFashionistaObserver } from '../../../src/logic/badges/fashionista'
import { Badge, BadgeId, badges, createBadgeStorage, UserBadge } from '@badges/common'
import { timestamps } from '../../utils'

describe('Fashionista badge handler should', () => {
  const testAddress = '0xTest'
  const badge = badges.get(BadgeId.FASHIONISTA) as Badge

  it('do nothing if the item purchased is not an wearable', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: ItemSoldEvent = createItemSoldEvent({
      timestamp: timestamps.now(),
      category: 'notAWearable'
    })

    const handler = createFashionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('do nothing if the user already has completed all the badge tiers', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: ItemSoldEvent = createItemSoldEvent()

    db.getUserProgressFor = mockUserProgress({
      completed_at: timestamps.twoMinutesBefore(timestamps.now()),
      steps: 300
    })

    const handler = createFashionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('skip increasing the number of wearables purchased if the wearable was already purchased', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: ItemSoldEvent = createItemSoldEvent()

    db.getUserProgressFor = mockUserProgress({
      steps: 1,
      transactions_wearable_purchase: ['0xTxHash']
    })

    const handler = createFashionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('increase the number of wearables purchased and grant the first tier of the badge if the user bought 1 wearable', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const txHash = `0x${timestamp}`

    const event: ItemSoldEvent = createItemSoldEvent({
      timestamp,
      txHash,
      category: 'wearable'
    })

    db.getUserProgressFor = jest.fn().mockResolvedValue(undefined)

    const handler = createFashionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(0, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 1 }))
  })

  it('increase the number of wearables purchased and return undefined if the user does not achieve a new tier', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const txHash = `0x${timestamp}`

    const event: ItemSoldEvent = createItemSoldEvent({
      timestamp,
      txHash,
      category: 'wearable'
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 1,
      transactions_wearable_purchase: Array.from({ length: 1 }, (_, i) => `0x${i}`)
    })

    const handler = createFashionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 2 }))
  })

  it('increase the number of wearables purchased and grant the second tier of the badge if the user bought 25 wearables', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const txHash = `0x${timestamp}`

    const event: ItemSoldEvent = createItemSoldEvent({
      timestamp,
      txHash,
      category: 'wearable'
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 24,
      transactions_wearable_purchase: Array.from({ length: 24 }, (_, i) => `0x${i}`)
    })

    const handler = createFashionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(1, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 25 }))
  })

  it('increase the number of wearables purchased and grant the third tier of the badge if the user bought 75 wearables', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const txHash = `0x${timestamp}`

    const event: ItemSoldEvent = createItemSoldEvent({
      timestamp,
      txHash,
      category: 'wearable'
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 74,
      transactions_wearable_purchase: Array.from({ length: 74 }, (_, i) => `0x${i}`)
    })

    const handler = createFashionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(2, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 75 }))
  })

  it('increase the number of wearables purchased and grant the fourth tier of the badge if the user bought 250 wearables', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const txHash = `0x${timestamp}`

    const event: ItemSoldEvent = createItemSoldEvent({
      timestamp,
      txHash,
      category: 'wearable'
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 249,
      transactions_wearable_purchase: Array.from({ length: 249 }, (_, i) => `0x${i}`)
    })

    const handler = createFashionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(3, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 250 }))
  })

  it('increase the number of wearables purchased and grant the fifth tier of the badge if the user bought 500 wearables', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const txHash = `0x${timestamp}`

    const event: ItemSoldEvent = createItemSoldEvent({
      timestamp,
      txHash,
      category: 'wearable'
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 499,
      transactions_wearable_purchase: Array.from({ length: 499 }, (_, i) => `0x${i}`)
    })

    const handler = createFashionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(4, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 500 }))
  })

  it('increase the number of wearables purchased, grant the last tier of the badge, and mark it as completed if the user bought 1500 wearables', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const txHash = `0x${timestamp}`

    const event: ItemSoldEvent = createItemSoldEvent({
      timestamp,
      txHash,
      category: 'wearable'
    })

    db.getUserProgressFor = mockUserProgress({
      steps: 1499,
      transactions_wearable_purchase: Array.from({ length: 1499 }, (_, i) => `0x${i}`)
    })

    const handler = createFashionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(5, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(createExpectedUserProgress({ steps: 1500, completed: true }))
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

  function createItemSoldEvent(
    options: { txHash?: string; category?: string; timestamp: number } = {
      txHash: '0xTxHash',
      category: 'wearable',
      timestamp: Date.now()
    }
  ): ItemSoldEvent {
    return {
      type: Events.Type.BLOCKCHAIN,
      subType: Events.SubType.Blockchain.ITEM_SOLD,
      key: options.txHash,
      timestamp: options.timestamp,
      metadata: {
        buyer: testAddress,
        category: options.category,
        tokenId: 'aTokenId',
        network: 'aNetwork',
        address: testAddress,
        image: 'image',
        seller: '0xSeller',
        link: 'link',
        title: 'Title',
        description: 'Description'
      }
    }
  }

  function mockUserProgress(progress: {
    steps: number
    transactions_wearable_purchase?: string[]
    completed_at?: number
  }) {
    const { steps, transactions_wearable_purchase = [], completed_at } = progress
    return jest.fn().mockResolvedValue({
      user_address: testAddress,
      badge_id: BadgeId.FASHIONISTA,
      progress: {
        steps,
        transactions_wearable_purchase
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
    transactions_wearable_purchase?: number[]
  }): Omit<UserBadge, 'updated_at'> {
    const { steps, completed, transactions_wearable_purchase } = progress
    return {
      user_address: testAddress,
      badge_id: BadgeId.FASHIONISTA,
      progress: {
        steps,
        transactions_wearable_purchase: transactions_wearable_purchase || expect.any(Array<number>)
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
