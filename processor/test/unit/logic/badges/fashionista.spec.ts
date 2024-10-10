import { Events, ItemSoldEvent } from '@dcl/schemas'
import { createFashionistaObserver } from '../../../../src/logic/badges/fashionista'
import { BadgeId, UserBadge } from '@badges/common'
import {
  getExpectedUserProgressForBadgeWithTiersBuilder,
  getMockedComponents,
  getMockedUserProgressForBadgeWithTiersBuilder,
  mapBadgeToHaveTierNth,
  timestamps
} from '../../../utils'

describe('Fashionista badge handler should', () => {
  const testAddress = '0xTest'

  const createMockedUserProgress = getMockedUserProgressForBadgeWithTiersBuilder(BadgeId.FASHIONISTA, testAddress)
  const createExpectedUserProgress = getExpectedUserProgressForBadgeWithTiersBuilder(BadgeId.FASHIONISTA, testAddress)

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

    const mockUserProgress = createMockedUserProgress({
      completed_at: timestamps.twoMinutesBefore(timestamps.now()),
      progress: { steps: 300 }
    })

    const handler = createFashionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('skip increasing the number of wearables purchased if the wearable was already purchased', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: ItemSoldEvent = createItemSoldEvent()

    const mockUserProgress = createMockedUserProgress({
      progress: {
        steps: 1,
        transactions_wearable_purchase: [
          {
            transactionHash: '0xTxHash',
            saleAt: timestamps.twoMinutesBefore(timestamps.now())
          }
        ]
      }
    })

    const handler = createFashionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

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

    const mockUserProgress = undefined

    const handler = createFashionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(0, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 1 }))
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

    const mockUserProgress = getMockedUserProgressBySteps(1, timestamp)

    const handler = createFashionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 2 }))
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

    const mockUserProgress = getMockedUserProgressBySteps(24, timestamp)

    const handler = createFashionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(1, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 25 }))
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

    const mockUserProgress = getMockedUserProgressBySteps(74, timestamp)

    const handler = createFashionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(2, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 75 }))
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

    const mockUserProgress = getMockedUserProgressBySteps(249, timestamp)

    const handler = createFashionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(3, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 250 }))
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

    const mockUserProgress = getMockedUserProgressBySteps(499, timestamp)

    const handler = createFashionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(4, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 500 }))
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

    const mockUserProgress = getMockedUserProgressBySteps(1499, timestamp)

    const handler = createFashionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(5, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 1500, completed: true }))
  })

  // Helpers
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

  function getMockedUserProgressBySteps(steps: number, saleAt?: number) {
    return createMockedUserProgress({
      progress: {
        steps,
        transactions_wearable_purchase: Array.from({ length: steps }, (_, i) => ({
          transactionHash: `0xTxHash${i}`,
          saleAt: (saleAt || timestamps.now()) + 1
        }))
      }
    })
  }

  function getExpectedUserProgress(progress: { steps: number; completed?: boolean }): Omit<UserBadge, 'updated_at'> {
    const { steps, completed } = progress
    return createExpectedUserProgress({
      progress: {
        steps,
        transactions_wearable_purchase: expect.any(Array<{ transactionHash: string; saleAt: number }>)
      },
      completed
    })
  }
})
