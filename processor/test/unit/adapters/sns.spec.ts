import { SNSClient } from '@aws-sdk/client-sns'
import { PublisherComponent } from '../../../src/types'
import { createSnsComponent } from '../../../src/adapters/sns'
import { BadgeGrantedEvent, Events } from '@dcl/schemas'
import { getMockedComponents } from '../../utils'

jest.mock('@aws-sdk/client-sns', () => ({
  ...jest.requireActual('@aws-sdk/client-sns'),
  SNSClient: jest.fn().mockReturnValue({
    send: jest.fn()
  })
}))

const MOCK_ENDPOINT = 'http://localhost:9324'

describe('sns', () => {
  let sns: PublisherComponent
  let mockClient: SNSClient

  beforeEach(async () => {
    const { config } = await getMockedComponents()
    sns = await createSnsComponent({
      config: {
        ...config,
        requireString: jest.fn().mockReturnValueOnce(MOCK_ENDPOINT)
      }
    })
    mockClient = new SNSClient({ endpoint: MOCK_ENDPOINT })
  })

  it('should send all the messages in different chunks and return the successful and failures', async () => {
    const events = Array.from({ length: 20 }, () => ({
      type: Events.Type.BADGE,
      subType: Events.SubType.Badge.GRANTED
    })) as BadgeGrantedEvent[]

    mockClient.send = jest
      .fn()
      .mockResolvedValueOnce({
        Successful: [{ MessageId: 'msg_1' }, {}],
        Failed: []
      })
      .mockResolvedValueOnce({
        Successful: [{}],
        Failed: [{ Id: 'msg_14' }]
      })

    const { successfulMessageIds, failedEvents } = await sns.publishMessages(events)

    expect(mockClient.send).toHaveBeenCalledTimes(2)

    expect(successfulMessageIds).toStrictEqual(['msg_1'])
    expect(failedEvents).toEqual([events[14]]) // fifth message in the second batch
  })
})
