import { IHttpServerComponent, ILoggerComponent } from '@well-known-components/interfaces'
import { ErrorResponse, InvalidRequestError } from '../../error.types'
import { AppComponents } from '../../types'

const handleErrorWith =
  (logger: ILoggerComponent.ILogger) =>
  (url: URL, error: any): { status: number; body: ErrorResponse } => {
    if (error instanceof InvalidRequestError) {
      return {
        status: 400,
        body: {
          error: 'Bad request',
          message: error.message
        }
      }
    }

    logger.error(`Error handling ${url.toString()}: ${error.message}`)
    return {
      status: 500,
      body: {
        error: 'Internal Server Error',
        message: error.message
      }
    }
  }

export function createErrorHandler({ logs }: Pick<AppComponents, 'logs'>): IHttpServerComponent.IRequestHandler {
  const logger = logs.getLogger('error-handler')
  const handleError = handleErrorWith(logger)
  return async function errorHandler(
    ctx: IHttpServerComponent.DefaultContext<object>,
    next: () => Promise<IHttpServerComponent.IResponse>
  ): Promise<IHttpServerComponent.IResponse> {
    try {
      return await next()
    } catch (error: any) {
      const { status, body } = handleError(ctx.url, error)
      logger.error(`Error handling ${ctx.url.toString()}: ${error.message}`)
      return { status, body }
    }
  }
}
