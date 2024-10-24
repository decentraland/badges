import { createEventDispatcher } from '../../../src/logic/event-dispatcher'
import { getMockedComponents, getMockEvent } from '../../utils'
import { createMessageProcessorComponent } from '../../../src/logic/message-processor'
import {
  BadgeProcessorResult,
  IEventDispatcher,
  MessageProcessorComponent,
  PublisherComponent
} from '../../../src/types'
import { createSnsComponent } from '../../../src/adapters/sns'
import { BadgeId, IBadgeStorage } from '@badges/common'
import { BadgeGrantedEvent, EthAddress, Event, Events } from '@dcl/schemas'

describe('MessageProcessor', () => {
  const testUserAddress = '0x1234567890abcdef1234567890abcdef12345678'

  let messageProcessor: MessageProcessorComponent
  let eventDispatcher: IEventDispatcher
  let publisher: PublisherComponent
  let badgeStorage: IBadgeStorage

  beforeEach(async () => {
    const { db, logs, metrics, ...mockComponents } = await getMockedComponents()

    const config = {
      ...mockComponents.config,
      requireString: jest.fn()
    }

    badgeStorage = mockComponents.badgeStorage

    eventDispatcher = createEventDispatcher({ logs, db, metrics })
    publisher = await createSnsComponent({ config })
    messageProcessor = await createMessageProcessorComponent({ logs, config, metrics, eventDispatcher, publisher })

    eventDispatcher.dispatch = jest.fn()
    publisher.publishMessages = jest.fn()
  })

  describe('process', () => {
    it('should do nothing if the processor result is empty', async () => {
      const event = getMockEvent(Events.Type.CLIENT, Events.SubType.Client.MOVE_TO_PARCEL, testUserAddress)
      jest.spyOn(eventDispatcher, 'dispatch').mockResolvedValue(undefined)

      await messageProcessor.process(event)

      expect(eventDispatcher.dispatch).toHaveBeenCalledWith(event)
      expect(publisher.publishMessages).not.toHaveBeenCalled()
    })

    it('should process event and publish granted badges', async () => {
      const badgeId = BadgeId.DECENTRALAND_CITIZEN
      const event = getMockEvent(Events.Type.CLIENT, Events.SubType.Client.MOVE_TO_PARCEL, testUserAddress)
      jest.spyOn(eventDispatcher, 'dispatch').mockResolvedValue([getProcessorResult(badgeId, testUserAddress)])

      const successfulMessageIds = ['message-id-1']
      const failedEvents = [
        {
          type: Events.Type.BADGE,
          subType: Events.SubType.Badge.GRANTED
        } as BadgeGrantedEvent
      ]
      jest.spyOn(publisher, 'publishMessages').mockResolvedValue({ successfulMessageIds, failedEvents })

      await messageProcessor.process(event)

      expect(eventDispatcher.dispatch).toHaveBeenCalledWith(event)
      expect(publisher.publishMessages).toHaveBeenCalledWith(createExpectedEventsToPublish(badgeId, testUserAddress))
    })
  })

  // Helpers
  function getProcessorResult(badgeId: BadgeId, userAddress: EthAddress): BadgeProcessorResult {
    return {
      badgeGranted: badgeStorage.getBadge(badgeId),
      userAddress
    }
  }

  function createExpectedEventsToPublish(badgeId: BadgeId, userAddress: EthAddress): BadgeGrantedEvent {
    const badgeGranted = badgeStorage.getBadge(badgeId)
    return expect.arrayContaining([
      expect.objectContaining({
        type: Events.Type.BADGE,
        subType: Events.SubType.Badge.GRANTED,
        key: expect.any(String),
        timestamp: expect.any(Number),
        metadata: {
          badgeId: badgeGranted.id,
          badgeName: badgeGranted.name,
          badgeImageUrl: !!badgeGranted.tiers?.length
            ? badgeGranted.tiers.pop()?.assets?.['2d'].normal
            : badgeGranted.assets?.['2d'].normal,
          badgeTierName: !!badgeGranted.tiers?.length ? badgeGranted.tiers.pop()?.tierName : undefined,
          address: userAddress
        }
      } as BadgeGrantedEvent)
    ])
  }
})
