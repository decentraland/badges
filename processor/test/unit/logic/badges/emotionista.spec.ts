import { createLogComponent } from '@well-known-components/logger'
import { createDbMock } from '../../../mocks/db-mock'
import { AppComponents } from '../../../../src/types'
import { Events, ItemSoldEvent } from '@dcl/schemas'
import { createEmotionistaObserver } from '../../../../src/logic/badges/emotionista'
import { Badge, BadgeId, badges, createBadgeStorage, UserBadge } from '@badges/common'
import {
  getExpectedUserProgressForBadgeWithTiersBuilder,
  getMockedUserProgressForBadgeWithTiersBuilder,
  mapBadgeToHaveTierNth,
  timestamps
} from '../../../utils'

describe('Emotionista badge handler should', () => {
  const testAddress = '0xTest'

  const createMockedUserProgress = getMockedUserProgressForBadgeWithTiersBuilder(BadgeId.EMOTIONISTA, testAddress)
  const createExpectedUserProgress = getExpectedUserProgressForBadgeWithTiersBuilder(BadgeId.EMOTIONISTA, testAddress)

  it('do nothing if the item purchased is not an emote', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: ItemSoldEvent = createItemSoldEvent({
      timestamp: timestamps.now(),
      category: 'notAnEmote'
    })

    const handler = createEmotionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('do nothing if the user already has completed all the badge tiers', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: ItemSoldEvent = createItemSoldEvent()

    const mockUserProgress = createMockedUserProgress({
      completed_at: timestamps.twoMinutesBefore(timestamps.now()),
      progress: {
        steps: 300
      }
    })

    const handler = createEmotionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('skip increasing the number of emotes purchased if the emote was already purchased', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: ItemSoldEvent = createItemSoldEvent()

    const mockUserProgress = createMockedUserProgress({
      progress: {
        steps: 1,
        transactions_emotes_purchase: [
          {
            transactionHash: '0xTxHash',
            saleAt: timestamps.now()
          }
        ]
      }
    })

    const handler = createEmotionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('increase the number of emotes purchased and grant the first tier of the badge if the user bought 1 emote', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const txHash = `0x${timestamp}`

    const event: ItemSoldEvent = createItemSoldEvent({
      timestamp,
      txHash,
      category: 'emote'
    })

    const mockUserProgress = undefined

    const handler = createEmotionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(0, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 1 }))
  })

  it('increase the number of emotes purchased and return undefined if the users does not achieve a new tier', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const txHash = `0x${timestamp}`

    const event: ItemSoldEvent = createItemSoldEvent({
      timestamp,
      txHash,
      category: 'emote'
    })

    const mockUserProgress = getMockedUserProgressBySteps(1, timestamp)

    const handler = createEmotionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 2 }))
  })

  it('increase the number of emotes purchased and grant the second tier of the badge if the user bought 10 emotes', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const txHash = `0x${timestamp}`

    const event: ItemSoldEvent = createItemSoldEvent({
      timestamp,
      txHash,
      category: 'emote'
    })

    const mockUserProgress = getMockedUserProgressBySteps(9, timestamp)

    const handler = createEmotionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(1, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 10 }))
  })

  it('increase the number of emotes purchased and grant the third tier of the badge if the user bought 25 emotes', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const txHash = `0x${timestamp}`

    const event: ItemSoldEvent = createItemSoldEvent({
      timestamp,
      txHash,
      category: 'emote'
    })

    const mockUserProgress = getMockedUserProgressBySteps(24, timestamp)

    const handler = createEmotionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(2, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 25 }))
  })

  it('increase the number of emotes purchased and grant the fourth tier of the badge if the user bought 50 emotes', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const txHash = `0x${timestamp}`

    const event: ItemSoldEvent = createItemSoldEvent({
      timestamp,
      txHash,
      category: 'emote'
    })

    const mockUserProgress = getMockedUserProgressBySteps(49, timestamp)

    const handler = createEmotionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(3, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 50 }))
  })

  it('increase the number of emotes purchased and grant the fifth tier of the badge if the user bought 150 emotes', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const txHash = `0x${timestamp}`

    const event: ItemSoldEvent = createItemSoldEvent({
      timestamp,
      txHash,
      category: 'emote'
    })

    const mockUserProgress = getMockedUserProgressBySteps(149, timestamp)

    const handler = createEmotionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(4, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 150 }))
  })

  it('increase the number of emotes purchased, grant the last tier of the badge, and mark it as completed if the user bought 300 emotes', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const txHash = `0x${timestamp}`

    const event: ItemSoldEvent = createItemSoldEvent({
      timestamp,
      txHash,
      category: 'emote'
    })

    const mockUserProgress = getMockedUserProgressBySteps(299, timestamp)

    const handler = createEmotionistaObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(5, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 300, completed: true }))
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
      category: 'emote',
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
        transactions_emotes_purchase: Array.from({ length: steps }, (_, i) => ({
          transactionHash: `0xTxHash${i}`,
          saleAt: (saleAt || timestamps.now()) + i
        }))
      }
    })
  }

  function getExpectedUserProgress(progress: { steps: number; completed?: boolean }): Omit<UserBadge, 'updated_at'> {
    const { steps, completed } = progress
    return createExpectedUserProgress({
      progress: {
        steps,
        transactions_emotes_purchase: expect.any(Array<{ saleAt: number; transactionHash: string }>)
      },
      completed
    })
  }
})
