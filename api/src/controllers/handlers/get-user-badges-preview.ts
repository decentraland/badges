import { IHttpServerComponent } from '@well-known-components/interfaces'
import { HandlerContextWithPath } from '../../types'

export async function getUserBadgesPreviewHandler(
  context: Pick<HandlerContextWithPath<'badgeService', '/users/:address/preview'>, 'url' | 'components' | 'params'>
): Promise<IHttpServerComponent.IResponse> {
  const { badgeService } = context.components
  const address = context.params.address

  const latestUserAchievedBadges = await badgeService.getLatestAchievedBadges(address)

  return {
    body: {
      data: {
        latestAchievedBadges: latestUserAchievedBadges
      }
    }
  }
}
