import { createMemoryQueueAdapter } from '../../../src/adapters/memory-queue'

jest.mock('node:crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('uuid')
}))

describe('Memory Queue', () => {
  const queue = createMemoryQueueAdapter()

  it('should send and receive messages', async () => {
    const message = { id: '1', body: 'hello' }
    await queue.send(message)

    const messages = await queue.receiveSingleMessage()
    expect(messages).toHaveLength(1)
    expect(messages[0].Body).toBe(JSON.stringify({ Message: JSON.stringify(message) }))
  })

  it('should delete messages', async () => {
    const message = { id: '1', body: 'hello' }
    await queue.send(message)

    const mockReceiptHandle = 'uuid'

    await queue.deleteMessage(mockReceiptHandle)

    const messagesAfterDelete = await queue.receiveSingleMessage()
    expect(messagesAfterDelete).toHaveLength(0)
  })
})
