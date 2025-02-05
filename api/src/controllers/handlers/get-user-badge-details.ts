import { IHttpServerComponent } from '@well-known-components/interfaces'
import { HandlerContextWithPath } from '../../types'
import { BadgeId, UserBadge } from '@badges/common'
import { parseBadgeId } from '../../logic/utils'
import { NotFoundError } from '@dcl/platform-server-commons'

type Response = {
  data: UserBadge
}

export async function getUserBadgeDetailsHandler(
  context: Pick<
    HandlerContextWithPath<'badgeService', '/users/:address/badges/:id'>,
    'url' | 'request' | 'components' | 'params'
  >
): Promise<IHttpServerComponent.IResponse> {
  const { badgeService } = context.components

  const userAddress = context.params.address
  const badgeId = context.params.id as BadgeId
  const parsedBadgeId: BadgeId | undefined = parseBadgeId(badgeId)

  if (!parsedBadgeId) {
    throw new NotFoundError('Badge does not exists')
  }

  const badgeStateForUser: UserBadge = await badgeService.getUserState(userAddress, parsedBadgeId)

  if (!badgeStateForUser) {
    throw new NotFoundError('User progress not found for this badge')
  }

  return {
    body: {
      data: badgeStateForUser
    } as Response
  }
}
