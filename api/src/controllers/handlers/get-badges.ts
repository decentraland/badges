import { HandlerContextWithPath } from '../../types'
import { IHttpServerComponent } from '@well-known-components/interfaces'
import { Badge } from '@badges/common'

type Response = {
  data: Badge[]
}

export async function getBadgesHandler(
  context: Pick<HandlerContextWithPath<'logs' | 'badgeService', '/badges'>, 'url' | 'components' | 'params'>
): Promise<IHttpServerComponent.IResponse> {
  const badges = context.components.badgeService.getAllBadges()

  return {
    body: {
      data: badges
    } as Response
  }
}
