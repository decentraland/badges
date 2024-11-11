import { createEventDispatcher } from '../../../src/logic/event-dispatcher'
import { getMockedComponents, getMockEvent } from '../../utils'
import { createMessageProcessorComponent } from '../../../src/logic/message-processor'
import {
  IEventDispatcher,
  IEventParser,
  MessageConsumerComponent,
  MessageProcessorComponent,
  PublisherComponent,
  QueueComponent
} from '../../../src/types'
import { createSnsComponent } from '../../../src/adapters/sns'
import { createMessagesConsumerComponent } from '../../../src/logic/message-consumer'
import { createSqsAdapter } from '../../../src/adapters/sqs'
import { createEventParser } from '../../../src/adapters/event-parser'
import { Event, Events } from '@dcl/schemas'
import { sleep } from '../../../src/utils/timer'
import { Message } from '@aws-sdk/client-sqs'

jest.mock('../../../src/utils/timer', () => ({
  sleep: jest.fn()
}))

describe('MessageConsumer', () => {
  const testUserAddress = '0x1234567890abcdef1234567890abcdef12345678'

  let messageConsumer: MessageConsumerComponent
  let messageProcessor: MessageProcessorComponent
  let eventDispatcher: IEventDispatcher
  let eventParser: IEventParser
  let publisher: PublisherComponent
  let queue: QueueComponent

  let messageHandle: string
  let event: Event
  let message: Message

  beforeEach(async () => {
    const { db, logs, metrics, badgeContext, ...mockComponents } = await getMockedComponents()

    const config = {
      ...mockComponents.config,
      requireString: jest.fn()
    }

    eventDispatcher = createEventDispatcher({ logs, db, metrics })
    eventParser = await createEventParser({ config, logs, badgeContext })
    publisher = await createSnsComponent({ config })
    queue = {
      ...(await createSqsAdapter('endpoint')),
      receiveSingleMessage: jest.fn(),
      deleteMessage: jest.fn()
    }
    messageProcessor = await createMessageProcessorComponent({ logs, config, metrics, eventDispatcher, publisher })
    messageConsumer = await createMessagesConsumerComponent({ logs, metrics, queue, messageProcessor, eventParser })

    messageProcessor.process = jest.fn()
    eventParser.parse = jest.fn()

    messageHandle = 'receipt-handle-123'
    event = getMockEvent(Events.Type.BLOCKCHAIN, Events.SubType.Blockchain.ITEM_SOLD, testUserAddress)
    message = {
      Body: JSON.stringify({ Message: JSON.stringify(event) }),
      ReceiptHandle: messageHandle
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should handle no messages found in the queue', async () => {
    jest.spyOn(queue, 'receiveSingleMessage').mockResolvedValueOnce([])

    await consumeMessages()

    expect(sleep).toHaveBeenCalled()
  })

  it('should process a valid message and remove it from the queue', async () => {
    jest.spyOn(queue, 'receiveSingleMessage').mockResolvedValueOnce([message])
    jest.spyOn(eventParser, 'parse').mockResolvedValue(event)
    jest.spyOn(messageProcessor, 'process').mockResolvedValue(undefined)

    await consumeMessages()

    expect(queue.receiveSingleMessage).toHaveBeenCalled()
    expect(eventParser.parse).toHaveBeenCalledWith(event)
    expect(messageProcessor.process).toHaveBeenCalledWith(event)
    expect(queue.deleteMessage).toHaveBeenCalledWith(messageHandle)
  })

  it('should remove the message from the queue without processing it when the message could not be parsed', async () => {
    jest.spyOn(queue, 'receiveSingleMessage').mockResolvedValueOnce([message])
    jest.spyOn(eventParser, 'parse').mockResolvedValue(undefined)

    await consumeMessages()

    expect(queue.receiveSingleMessage).toHaveBeenCalled()
    expect(eventParser.parse).toHaveBeenCalledWith(event)
    expect(messageProcessor.process).not.toHaveBeenCalled()
    expect(queue.deleteMessage).toHaveBeenCalledWith(messageHandle)
  })

  it('should remove a message from the queue without processing it when the parse fails', async () => {
    jest.spyOn(queue, 'receiveSingleMessage').mockResolvedValueOnce([message])
    jest.spyOn(eventParser, 'parse').mockRejectedValue(new Error('Failed to parse event'))

    await consumeMessages()

    expect(queue.receiveSingleMessage).toHaveBeenCalled()
    expect(eventParser.parse).toHaveBeenCalledWith(event)
    expect(messageProcessor.process).not.toHaveBeenCalled()
    expect(queue.deleteMessage).toHaveBeenCalledWith(messageHandle)
  })

  it('should process a valid message and remove it from the queue even when the message processor fails', async () => {
    jest.spyOn(queue, 'receiveSingleMessage').mockResolvedValueOnce([message])
    jest.spyOn(eventParser, 'parse').mockResolvedValue(event)
    jest.spyOn(messageProcessor, 'process').mockRejectedValue(new Error('Failed to process event'))

    await consumeMessages()

    expect(queue.receiveSingleMessage).toHaveBeenCalled()
    expect(eventParser.parse).toHaveBeenCalledWith(event)
    expect(messageProcessor.process).toHaveBeenCalledWith(event)
    expect(queue.deleteMessage).toHaveBeenCalledWith(messageHandle)
  })

  // Helpers
  async function consumeMessages() {
    const startPromise = messageConsumer.start({} as any)
    messageConsumer.stop()
    await startPromise
  }
})
