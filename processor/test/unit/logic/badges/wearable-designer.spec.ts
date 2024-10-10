import { Events, ItemPublishedEvent } from '@dcl/schemas'
import { createWearableDesignerObserver } from '../../../../src/logic/badges/wearable-designer'
import { Badge, BadgeId, badges, UserBadge } from '@badges/common'
import {
  getExpectedUserProgressForBadgeWithTiersBuilder,
  getMockedComponents,
  getMockedUserProgressForBadgeWithTiersBuilder,
  mapBadgeToHaveTierNth,
  timestamps
} from '../../../utils'

describe('Wearable Designer badge handler should', () => {
  const testAddress = '0xTest'

  const badge = badges.get(BadgeId.WEARABLE_DESIGNER) as Badge
  const createMockedUserProgress = getMockedUserProgressForBadgeWithTiersBuilder(BadgeId.WEARABLE_DESIGNER, testAddress)
  const createExpectedUserProgress = getExpectedUserProgressForBadgeWithTiersBuilder(
    BadgeId.WEARABLE_DESIGNER,
    testAddress
  )

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

    const mockUserProgress = createMockedUserProgress({
      completed_at: timestamps.twoMinutesBefore(timestamps.now()),
      progress: {
        steps: 100
      }
    })

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('skip increasing the number of wearables published if the wearable was already published', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: ItemPublishedEvent = createItemPublishedEvent()

    const mockUserProgress = createMockedUserProgress({
      progress: {
        steps: 1,
        published_wearables: [{ itemId: 'anUrn', createdAt: timestamps.now() }]
      }
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

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(0, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 1 }))
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

    const mockUserProgress = getMockedUserProgressBySteps(1, timestamps.oneMinuteBefore(timestamps.now()))

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 2 }))
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

    const mockUserProgress = getMockedUserProgressBySteps(4, timestamps.oneMinuteBefore(timestamps.now()))

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(1, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 5 }))
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

    const mockUserProgress = getMockedUserProgressBySteps(24, timestamps.oneMinuteBefore(timestamps.now()))

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(2, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 25 }))
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

    const mockUserProgress = getMockedUserProgressBySteps(49, timestamps.oneMinuteBefore(timestamps.now()))

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(3, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 50 }))
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

    const mockUserProgress = getMockedUserProgressBySteps(174, timestamps.oneMinuteBefore(timestamps.now()))

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(4, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 175 }))
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

    const mockUserProgress = getMockedUserProgressBySteps(349, timestamps.oneMinuteBefore(timestamps.now()))

    const handler = createWearableDesignerObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(5, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 350, completed: true }))
  })

  // Helpers
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

  function getMockedUserProgressBySteps(steps: number, createdAt?: number) {
    return createMockedUserProgress({
      progress: {
        steps,
        published_wearables: Array.from({ length: steps }, (_, i) => ({
          itemId: `itemId-${i}`,
          createdAt: (createdAt || timestamps.oneMinuteBefore(timestamps.now())) + i
        }))
      }
    })
  }

  function getExpectedUserProgress(progress: { steps: number; completed?: boolean }): Omit<UserBadge, 'updated_at'> {
    const { steps, completed } = progress
    return createExpectedUserProgress({
      progress: {
        steps,
        published_wearables: expect.any(Array<{ itemId: string; createdAt: number }>)
      },
      completed
    })
  }
})
