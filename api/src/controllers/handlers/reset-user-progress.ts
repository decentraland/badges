import { HandlerContextWithPath } from '../../types'
import { IHttpServerComponent } from '@well-known-components/interfaces'
import { BadgeId } from '@badges/common'

function parseBadgeId(id: string): BadgeId | undefined {
  if (Object.values(BadgeId).includes(id as BadgeId)) {
    return id as BadgeId
  }
  return undefined
}

export async function resetUserProgress(
  context: Pick<HandlerContextWithPath<'badgeService', '/users/:address/badges/:id'>, 'url' | 'components' | 'params'>
): Promise<IHttpServerComponent.IResponse> {
  const { badgeService } = context.components
  const badgeId = context.params.id
  const userAddress = context.params.address

  const parsedBadgeId: BadgeId | undefined = parseBadgeId(badgeId)

  if (!parsedBadgeId) {
    return {
      status: 404,
      body: {
        error: 'Badge not found'
      }
    }
  }

  await badgeService.resetUserProgressFor(parsedBadgeId, userAddress)

  return {
    status: 204
  }
}
