import { Router } from '@well-known-components/http-server'
import { GlobalContext } from '../types'
import { errorHandler } from '@dcl/platform-server-commons'
import { getUserBadgesHandler } from './handlers/get-user-badges'
import { getStatusHandler } from './handlers/get-service-status'
import { getBadgesHandler } from './handlers/get-badges'
import { getBadgeCategoriesHandler } from './handlers/get-categories'
import { getUserBadgeDetailsHandler } from './handlers/get-badge-details'

export async function setupRouter(_: GlobalContext): Promise<Router<GlobalContext>> {
  const router = new Router<GlobalContext>()
  router.use(errorHandler)

  router.get('/users/:address/badges', getUserBadgesHandler)
  router.get('/users/:address/badges/:id', getUserBadgeDetailsHandler)
  router.get('/badges', getBadgesHandler)
  router.get('/categories', getBadgeCategoriesHandler)
  router.get('/status', getStatusHandler)

  return router
}
