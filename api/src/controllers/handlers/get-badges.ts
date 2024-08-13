import { HandlerContextWithPath } from '../../types'
import { IHttpServerComponent } from '@well-known-components/interfaces'
import { Badge, badges } from '@badges/common'

type UserBadgesResponse = {
  data: Badge[]
}

export async function getBadgesHandler(
  _: Pick<HandlerContextWithPath<'logs', '/badges'>, 'url' | 'components' | 'params'>
): Promise<IHttpServerComponent.IResponse> {
  return {
    body: {
      data: Array.from(badges.values())
    } as UserBadgesResponse
  }
}
