import { Router } from '@well-known-components/http-server'
import { GlobalContext } from '../types'
import { bearerTokenMiddleware, errorHandler } from '@dcl/platform-server-commons'
import { getUserBadgesHandler } from './handlers/get-user-badges'
import { getStatusHandler } from './handlers/get-service-status'
import { getBadgesHandler } from './handlers/get-badges'
import { getBadgeCategoriesHandler } from './handlers/get-categories'
import { getBadgeDetailsHandler } from './handlers/get-badge-details'
import { getBadgeTiersHandler } from './handlers/get-badge-tiers'
import { getUserBadgesPreviewHandler } from './handlers/get-user-badges-preview'
import { resetUserProgressHandler } from './handlers/reset-user-progress'
import { badgesBackfillHandler } from './handlers/badges-backfill-handler'

export async function setupRouter(context: GlobalContext): Promise<Router<GlobalContext>> {
  const router = new Router<GlobalContext>()
  router.use(errorHandler)

  router.get('/badges', getBadgesHandler)
  router.get('/badges/:id', getBadgeDetailsHandler)
  router.get('/badges/:id/tiers', getBadgeTiersHandler)

  router.get('/users/:address/badges', getUserBadgesHandler)
  router.get('/users/:address/preview', getUserBadgesPreviewHandler)

  router.get('/categories', getBadgeCategoriesHandler)

  router.get('/status', getStatusHandler)

  // manage workflow
  const env = await context.components.config.getString('ENV')
  const shouldExposeEndpointsToManageWorkflows = env === 'dev' || env === 'test'

  if (shouldExposeEndpointsToManageWorkflows) {
    router.delete('/users/:address/badges/:id', resetUserProgressHandler)
  }

  const adminToken = await context.components.config.getString('API_ADMIN_TOKEN')

  if (!!adminToken) {
    router.post('/badges/:id/backfill', bearerTokenMiddleware(adminToken), badgesBackfillHandler)
  }

  return router
}
