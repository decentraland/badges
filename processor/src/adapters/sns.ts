import { PublishCommand, SNSClient } from '@aws-sdk/client-sns'
import { AppComponents, BadgeGrantedEvent, PublisherComponent } from '../types'

export async function createSnsComponent({ config }: Pick<AppComponents, 'config'>): Promise<PublisherComponent> {
  const snsArn = await config.requireString('AWS_SNS_ARN')
  const optionalEndpoint = await config.getString('AWS_SNS_ENDPOINT')

  const client = new SNSClient({
    endpoint: optionalEndpoint ? optionalEndpoint : undefined
  })

  async function publishMessage(event: BadgeGrantedEvent): Promise<string | undefined> {
    const { MessageId } = await client.send(
      new PublishCommand({
        TopicArn: snsArn,
        Message: JSON.stringify(event)
      })
    )

    return MessageId
  }

  return { publishMessage }
}
