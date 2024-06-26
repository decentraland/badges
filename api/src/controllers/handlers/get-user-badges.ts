import { InvalidRequestError } from '@dcl/platform-server-commons'
import { HandlerContextWithPath } from '../../types'
import { EthAddress } from '@dcl/schemas'

export async function getUserBadgesHandler({
  params,
  components: { badgeManager }
}: Pick<HandlerContextWithPath<'badgeManager', '/wallet/:wallet/stats'>, 'components' | 'params' | 'url'>) {
  const wallet = params.wallet

  if (!wallet || !EthAddress.validate(wallet)) {
    throw new InvalidRequestError('Invalid request. Missing or invalid wallet in request url param.')
  }

  const badges = await badgeManager.getUserBadges(wallet)

  return {
    status: 200,
    body: badges
  }
}
