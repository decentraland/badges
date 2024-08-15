import { HandlerContextWithPath } from '../../types'
import { IHttpServerComponent } from '@well-known-components/interfaces'
import { BadgeCategory } from '@badges/common'

type UserBadgesResponse = {
  data: BadgeCategory[]
}

export async function getBadgeCategoriesHandler(
  _: Pick<HandlerContextWithPath<'logs', '/categories'>, 'url' | 'components' | 'params'>
): Promise<IHttpServerComponent.IResponse> {
  return {
    body: {
      data: Object.values(BadgeCategory)
    } as UserBadgesResponse
  }
}
