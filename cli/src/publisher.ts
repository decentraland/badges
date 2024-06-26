import { PublishCommand, SNSClient } from '@aws-sdk/client-sns'

const sns = new SNSClient({
  endpoint: process.env.AWS_SNS_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  }
})

export async function publishEvent(message: string) {
  try {
    await sns.send(
      new PublishCommand({
        Message: message,
        TopicArn: process.env.AWS_SNS_ARN
      })
    )
    console.log('Message published successfully!')
  } catch (error) {
    console.error('Error publishing message:', error)
  }
}
