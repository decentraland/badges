import { AppComponents, MessageProcessorComponent } from '../types'

export function createMessageProcessorComponent({ logs }: Pick<AppComponents, 'logs'>): MessageProcessorComponent {
  const logger = logs.getLogger('message-processor')

  async function process(message: any, messageHandle: string): Promise<void> {
    logger.info('Processing message', { message, messageHandle })
  }

  return {
    process
  }
}
