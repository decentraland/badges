import { Router } from '@well-known-components/http-server'
import { GlobalContext } from '../types'
import { errorHandler } from '@dcl/platform-server-commons'
import { getUserBadgesHandler } from './handlers/get-user-badges'
import { getStatusHandler } from './handlers/get-service-status'
import { getBadgesHandler } from './handlers/get-badges'

export async function setupRouter(_: GlobalContext): Promise<Router<GlobalContext>> {
  const router = new Router<GlobalContext>()
  router.use(errorHandler)

  router.get('/badges/:address', getUserBadgesHandler)
  router.get('/badges', getBadgesHandler)
  router.get('/status', getStatusHandler)

  return router
}
