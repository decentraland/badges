import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs'
import { QueueComponent, QueueMessage } from '../../../src/types'
import { createSqsAdapter } from '../../../src/adapters/sqs'

jest.mock('@aws-sdk/client-sqs', () => ({
  ...jest.requireActual('@aws-sdk/client-sqs'),
  SQSClient: jest.fn().mockReturnValue({
    send: jest.fn()
  })
}))

const MOCK_ENDPOINT = 'http://localhost:9324'

describe('sqs', () => {
  let sqs: QueueComponent
  let mockClient: SQSClient

  beforeEach(async () => {
    sqs = await createSqsAdapter(MOCK_ENDPOINT)
    mockClient = new SQSClient({ endpoint: MOCK_ENDPOINT })
  })

  describe('when call send', () => {
    it('should send a message to the sqs client', async () => {
      const message: QueueMessage = { message: 'hello' }
      await sqs.send(message)
      expect(mockClient.send).toHaveBeenCalledWith(
        createMockExpectedCommand({
          QueueUrl: MOCK_ENDPOINT,
          MessageBody: JSON.stringify({ Message: JSON.stringify(message) })
        })
      )
    })
  })

  describe('when call receiveSingleMessage', () => {
    it('should receive a message from the sqs client', async () => {
      const messages = []
      mockClient.send = jest.fn().mockResolvedValueOnce({ Messages: messages })
      const receivedMessages = await sqs.receiveSingleMessage()
      expect(mockClient.send).toHaveBeenCalledWith(
        createMockExpectedCommand({
          QueueUrl: MOCK_ENDPOINT,
          MaxNumberOfMessages: 1,
          VisibilityTimeout: 60
        })
      )
      expect(receivedMessages).toBe(messages)
    })
  })

  describe('when call deleteMessage', () => {
    it('should delete a message from the sqs client', async () => {
      const receiptHandle = 'receiptHandle'
      await sqs.deleteMessage(receiptHandle)
      expect(mockClient.send).toHaveBeenCalledWith(
        createMockExpectedCommand({
          QueueUrl: MOCK_ENDPOINT,
          ReceiptHandle: receiptHandle
        })
      )
    })
  })

  // Helpers
  function createMockExpectedCommand(input: any) {
    return expect.objectContaining({
      input: expect.objectContaining(input)
    })
  }
})
