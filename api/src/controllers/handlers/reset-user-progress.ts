import { HandlerContextWithPath } from '../../types'
import { IHttpServerComponent } from '@well-known-components/interfaces'
import { BadgeId } from '@badges/common'
import { parseBadgeId } from '../../logic/utils'
import { NotFoundError } from '@dcl/platform-server-commons'

export async function resetUserProgressHandler(
  context: Pick<HandlerContextWithPath<'badgeService', '/users/:address/badges/:id'>, 'url' | 'components' | 'params'>
): Promise<IHttpServerComponent.IResponse> {
  const { badgeService } = context.components
  const badgeId = context.params.id
  const userAddress = context.params.address

  const parsedBadgeId: BadgeId | undefined = parseBadgeId(badgeId)

  if (!parsedBadgeId) {
    throw new NotFoundError('Badge does not exists')
  }

  await badgeService.resetUserProgressFor(parsedBadgeId, userAddress)

  return {
    status: 204
  }
}
