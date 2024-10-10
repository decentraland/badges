import { createLogComponent } from '@well-known-components/logger'
import { createDbMock } from '../../../mocks/db-mock'
import { AppComponents } from '../../../../src/types'
import { Events, ItemPublishedEvent } from '@dcl/schemas'
import { createEmoteCreatorObserver } from '../../../../src/logic/badges/emote-creator'
import { Badge, BadgeId, badges, createBadgeStorage, UserBadge } from '@badges/common'
import {
  getExpectedUserProgressForBadgeWithTiersBuilder,
  getMockedUserProgressForBadgeWithTiersBuilder,
  mapBadgeToHaveTierNth,
  timestamps
} from '../../../utils'
import { createBadgeStorageMock } from '../../../mocks/badge-storage-mock'

describe('Emote Creator badge handler should', () => {
  const testAddress = '0xTest'

  const createMockedUserProgress = getMockedUserProgressForBadgeWithTiersBuilder(BadgeId.EMOTE_CREATOR, testAddress)
  const createExpectedUserProgress = getExpectedUserProgressForBadgeWithTiersBuilder(BadgeId.EMOTE_CREATOR, testAddress)

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

    const mockUserProgress = createMockedUserProgress({
      completed_at: timestamps.twoMinutesBefore(timestamps.now()),
      progress: { steps: 100 }
    })

    const handler = createEmoteCreatorObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('skip increasing the number of emotes published if the emote was already published', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()
    const event: ItemPublishedEvent = createItemPublishedEvent()

    const mockUserProgress = createMockedUserProgress({
      progress: {
        steps: 1,
        published_emotes: [{ itemId: 'anUrn', createdAt: timestamps.now() }]
      }
    })

    const handler = createEmoteCreatorObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).not.toHaveBeenCalled()
  })

  it('increase the number of emotes published and grant the first tier of the badge if the user published 1 emote', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const itemId = `itemId-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      itemId,
      category: 'emote'
    })

    const mockUserProgress = undefined

    const handler = createEmoteCreatorObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(0, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 1 }))
  })

  it('increase the number of emotes published and return undefined if the user does not achieve a new tier', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const itemId = `itemId-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      itemId,
      category: 'emote'
    })

    const mockUserProgress = getMockedUserProgressBySteps(1)

    const handler = createEmoteCreatorObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toBeUndefined()
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 2 }))
  })

  it('increase the number of emotes published and grant the second tier of the badge if the user published 5 emotes', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const itemId = `itemId-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      itemId,
      category: 'emote'
    })

    const mockUserProgress = getMockedUserProgressBySteps(4)

    const handler = createEmoteCreatorObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(1, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 5 }))
  })

  it('increase the number of emotes published and grant the third tier of the badge if the user published 10 emotes', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const itemId = `itemId-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      itemId,
      category: 'emote'
    })

    const mockUserProgress = getMockedUserProgressBySteps(9)

    const handler = createEmoteCreatorObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(2, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 10 }))
  })

  it('increase the number of emotes published and grant the fourth tier of the badge if the user published 20 emotes', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const itemId = `itemId-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      itemId,
      category: 'emote'
    })

    const mockUserProgress = getMockedUserProgressBySteps(19)

    const handler = createEmoteCreatorObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(3, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 20 }))
  })

  it('increase the number of emotes published and grant the fifth tier of the badge if the user published 50 emotes', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const itemId = `itemId-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      itemId,
      category: 'emote'
    })

    const mockUserProgress = getMockedUserProgressBySteps(49)

    const handler = createEmoteCreatorObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(4, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 50 }))
  })

  it('increase the number of emotes published, grant the last tier of the badge, and mark it as completed if the user published 100 emotes', async () => {
    const { db, logs, badgeStorage } = await getMockedComponents()

    const timestamp = timestamps.now()
    const itemId = `itemId-${timestamp}`

    const event: ItemPublishedEvent = createItemPublishedEvent({
      timestamp,
      itemId,
      category: 'emote'
    })

    const mockUserProgress = getMockedUserProgressBySteps(99)

    const handler = createEmoteCreatorObserver({ db, logs, badgeStorage })
    const result = await handler.handle(event, mockUserProgress)

    expect(result).toMatchObject({
      badgeGranted: mapBadgeToHaveTierNth(5, handler.badge),
      userAddress: testAddress
    })
    expect(db.saveUserProgress).toHaveBeenCalledWith(getExpectedUserProgress({ steps: 100, completed: true }))
  })

  // Helpers
  async function getMockedComponents(): Promise<Pick<AppComponents, 'db' | 'logs' | 'badgeStorage'>> {
    return {
      db: createDbMock(),
      logs: await createLogComponent({ config: { requireString: jest.fn(), getString: jest.fn() } as any }),
      badgeStorage: await createBadgeStorageMock()
    }
  }

  function createItemPublishedEvent(
    options: { itemId?: string; category?: string; timestamp: number } = {
      itemId: 'anUrn',
      category: 'emote',
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
        published_emotes: Array.from({ length: steps }, (_, i) => ({
          itemId: `itemId-${i}`,
          createdAt: (createdAt || timestamps.now()) + i
        }))
      }
    })
  }

  function getExpectedUserProgress(progress: { steps: number; completed?: boolean }): Omit<UserBadge, 'updated_at'> {
    const { steps, completed } = progress
    return createExpectedUserProgress({
      progress: {
        steps,
        published_emotes: expect.any(Array<{ itemId: string; createdAt: number }>)
      },
      completed
    })
  }
})
