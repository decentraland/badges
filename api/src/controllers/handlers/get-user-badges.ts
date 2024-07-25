import { HandlerContextWithPath } from '../../types'
import { IHttpServerComponent } from '@well-known-components/interfaces'
import { UserBadge } from '@badges/common'

type UserBadgeWithoutProgress = Omit<UserBadge, 'progress'>

type UserBadgesResponse = {
  data: UserBadgeWithoutProgress[]
}

export async function getUserBadgesHandler(
  context: Pick<HandlerContextWithPath<'db' | 'logs', '/badges/:address'>, 'url' | 'components' | 'params'>
): Promise<IHttpServerComponent.IResponse> {
  const { db } = context.components

  const address = context.params.address

  const result = await db.getUserBadges(address)

  return {
    body: {
      data: result
    } as UserBadgesResponse
  }
}
