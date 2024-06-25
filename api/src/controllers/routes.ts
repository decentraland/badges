import { Router } from '@well-known-components/http-server'
import { GlobalContext } from '../types'
import { createErrorHandler } from './handlers/error-handler'

export async function setupRouter(globalContext: GlobalContext): Promise<Router<GlobalContext>> {
  const router = new Router<GlobalContext>()
  router.use(createErrorHandler({ ...globalContext.components }))

  return router
}
