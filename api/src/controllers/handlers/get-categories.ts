import { HandlerContextWithPath } from '../../types'
import { IHttpServerComponent } from '@well-known-components/interfaces'
import { BadgeCategory } from '@badges/common'

type Response = {
  data: { categories: BadgeCategory[] }
}

export async function getBadgeCategoriesHandler(
  _: Pick<HandlerContextWithPath<'logs', '/categories'>, 'url' | 'components' | 'params'>
): Promise<IHttpServerComponent.IResponse> {
  return {
    body: {
      data: {
        categories: Object.values(BadgeCategory)
      }
    } as Response
  }
}
