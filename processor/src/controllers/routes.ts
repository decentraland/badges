import { Router } from '@well-known-components/http-server'
import { GlobalContext } from '../types'
import { errorHandler } from '@dcl/platform-server-commons'
import { getStatusHandler } from './handlers/get-service-status'

export async function setupRouter(_: GlobalContext): Promise<Router<GlobalContext>> {
  const router = new Router<GlobalContext>()
  router.use(errorHandler)

  router.get('/status', getStatusHandler)

  return router
}
