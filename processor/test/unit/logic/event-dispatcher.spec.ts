import { Event } from '@dcl/schemas'
import { createLogComponent } from '@well-known-components/logger'
import { AppComponents, IObserver } from '../../../src/types'
import { createDbMock } from '../../mocks/db-mock'
import { createEventDispatcher } from '../../../src/logic/event-dispatcher'
import { Badge, BadgeId, badges, DbComponent, UserBadge } from '@badges/common'

describe('EventDispatcher', () => {
  const testUserAddress = '0xTestUserAddress'
  const anotherTestUserAddress = '0xAnotherTestUserAddress'

  let db: DbComponent
  let dispatcher: ReturnType<typeof createEventDispatcher>

  beforeEach(async () => {
    const { logs, ...mockedComponents } = await getMockedComponents()
    db = mockedComponents.db
    dispatcher = createEventDispatcher({ db, logs })
  })

  it('should register an observer properly', async () => {
    const observer = createMockedObserver({ badgeId: BadgeId.WALKABOUT_WANDERER })
    dispatcher.registerObserver(observer)

    expect(dispatcher.getObservers().get('aType-aSubType')).toEqual([observer])
  })

  describe('when dispatching events', () => {
    it('should handle an event when there are no observers listening', async () => {
      const event = createMockedEvent()
      const result = await dispatcher.dispatch(event)

      expect(result).toBeUndefined()
    })

    it('should dispatch event to the correct observer when user has no progress', async () => {
      const observer = createMockedObserver({ badgeId: BadgeId.WALKABOUT_WANDERER })
      db.getUserProgressesForMultipleBadges = jest.fn().mockResolvedValue([])

      dispatcher.registerObserver(observer)
      const event = createMockedEvent()
      await dispatcher.dispatch(event)
      expect(observer.handle).toHaveBeenCalledWith(event, undefined)
    })

    it('should dispatch event when user has non-completed progress', async () => {
      const observer = createMockedObserver({ badgeId: BadgeId.WALKABOUT_WANDERER })
      const userProgress = createMockedUserProgress({ badge_id: BadgeId.WALKABOUT_WANDERER })

      db.getUserProgressesForMultipleBadges = jest.fn().mockResolvedValue([userProgress])
      dispatcher.registerObserver(observer)
      const event = createMockedEvent()
      await dispatcher.dispatch(event)
      expect(observer.handle).toHaveBeenCalledWith(event, userProgress)
    })

    it('should skip observers with completed badges', async () => {
      const observer = createMockedObserver({ badgeId: BadgeId.WALKABOUT_WANDERER })
      const completedProgress = createMockedUserProgress({
        badge_id: BadgeId.WALKABOUT_WANDERER,
        completed_at: Date.now()
      })

      db.getUserProgressesForMultipleBadges = jest.fn().mockResolvedValue([completedProgress])
      dispatcher.registerObserver(observer)
      const result = await dispatcher.dispatch(createMockedEvent())

      expect(observer.handle).not.toHaveBeenCalled()
      expect(result).toEqual([])
    })

    it('should handle one badge for multiple users', async () => {
      const badgeId = BadgeId.WALKABOUT_WANDERER
      const observer1 = createMockedObserver({ badgeId, userAddress: testUserAddress })
      const observer2 = createMockedObserver({ badgeId, userAddress: anotherTestUserAddress })

      const userProgress1 = createMockedUserProgress({ badge_id: badgeId, user_address: testUserAddress })

      db.getUserProgressesForMultipleBadges = jest.fn().mockResolvedValue([userProgress1])

      dispatcher.registerObserver(observer1)
      dispatcher.registerObserver(observer2)

      const event = createMockedEvent()
      const result = await dispatcher.dispatch(event)

      expect(observer1.handle).toHaveBeenCalledWith(event, userProgress1)
      expect(observer2.handle).toHaveBeenCalledWith(event, undefined)
      expect(result).toEqual(['badge', 'badge'])
    })

    it('should handle multiple badges for one user', async () => {
      const observer1 = createMockedObserver({ badgeId: BadgeId.DECENTRALAND_CITIZEN })
      const observer2 = createMockedObserver({ badgeId: BadgeId.WALKABOUT_WANDERER })

      const userProgress2 = createMockedUserProgress({ badge_id: BadgeId.WALKABOUT_WANDERER })

      db.getUserProgressesForMultipleBadges = jest.fn().mockResolvedValue([userProgress2])

      dispatcher.registerObserver(observer1)
      dispatcher.registerObserver(observer2)

      const event = createMockedEvent()
      const result = await dispatcher.dispatch(event)

      expect(observer1.handle).toHaveBeenCalledWith(event, undefined)
      expect(observer2.handle).toHaveBeenCalledWith(event, userProgress2)
      expect(result).toEqual(['badge', 'badge'])
    })

    it('should handle different badges for different users', async () => {
      const badgeId1 = BadgeId.DECENTRALAND_CITIZEN
      const badgeId2 = BadgeId.WALKABOUT_WANDERER

      const observer1 = createMockedObserver({ badgeId: badgeId1, userAddress: testUserAddress })
      const observer2 = createMockedObserver({
        badgeId: badgeId2,
        userAddress: anotherTestUserAddress
      })

      const userProgress1 = createMockedUserProgress({
        badge_id: badgeId1,
        user_address: testUserAddress
      })
      const userProgress2 = createMockedUserProgress({ badge_id: badgeId2, user_address: anotherTestUserAddress })

      db.getUserProgressesForMultipleBadges = jest.fn().mockResolvedValue([userProgress1, userProgress2])

      dispatcher.registerObserver(observer1)
      dispatcher.registerObserver(observer2)

      const event = createMockedEvent()
      const result = await dispatcher.dispatch(event)

      expect(observer1.handle).toHaveBeenCalledWith(event, userProgress1)
      expect(observer2.handle).toHaveBeenCalledWith(event, userProgress2)
      expect(result).toEqual(['badge', 'badge'])
    })

    it('should handle errors in the observer handler gracefully', async () => {
      const observer = createMockedObserver({ badgeId: BadgeId.WALKABOUT_WANDERER, withError: true })
      db.getUserProgressesForMultipleBadges = jest.fn().mockResolvedValue([])

      dispatcher.registerObserver(observer)

      const event = createMockedEvent()
      const result = await dispatcher.dispatch(event)

      expect(observer.handle).toHaveBeenCalledWith(event, undefined)
      expect(result).toEqual([]) // handler errors return empty array
    })

    it('should handle errors outside the handler gracefully', async () => {
      const observer = createMockedObserver()
      dispatcher.registerObserver(observer)

      db.getUserProgressesForMultipleBadges = jest.fn().mockRejectedValue(new Error('db error'))

      const result = await dispatcher.dispatch(createMockedEvent())

      expect(observer.handle).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })
  })

  // Helpers
  async function getMockedComponents(): Promise<Pick<AppComponents, 'db' | 'logs'>> {
    return {
      db: createDbMock(),
      logs: await createLogComponent({ config: { requireString: jest.fn(), getString: jest.fn() } as any })
    }
  }

  function createMockedObserver(opts?: Partial<IObserver> & { withError?: boolean; userAddress?: string }): IObserver {
    return {
      handle:
        opts?.handle || opts?.withError
          ? jest.fn().mockRejectedValue(new Error('observer handler error'))
          : jest.fn().mockResolvedValue('badge'),
      getUserAddress: opts?.getUserAddress || jest.fn().mockReturnValue(opts?.userAddress || testUserAddress),
      badgeId: opts?.badgeId || BadgeId.DECENTRALAND_CITIZEN,
      badge: opts?.badge || (badges.get(opts?.badgeId || BadgeId.DECENTRALAND_CITIZEN) as Badge),
      events: opts?.events || [{ type: 'aType', subType: 'aSubType' }]
    } as IObserver
  }

  function createMockedUserProgress(opts?: Partial<UserBadge>): UserBadge {
    return {
      badge_id: opts?.badge_id || BadgeId.DECENTRALAND_CITIZEN,
      user_address: opts?.user_address || testUserAddress,
      completed_at: opts?.completed_at || null
    } as UserBadge
  }

  function createMockedEvent(opts?: Partial<Event>): Event {
    return { type: opts?.type || 'aType', subType: opts?.subType || 'aSubType' } as Event
  }
})
