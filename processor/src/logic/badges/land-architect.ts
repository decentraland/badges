import { CatalystDeploymentEvent, EthAddress, Events } from '@dcl/schemas'
import { Authenticator } from '@dcl/crypto'
import { Badge, BadgeId, UserBadge } from '@badges/common'
import { AppComponents, BadgeProcessorResult, IObserver } from '../../types'

export function createLandArchitectObserver({
  db,
  logs,
  badgeStorage
}: Pick<AppComponents, 'db' | 'logs' | 'badgeStorage'>): IObserver {
  const logger = logs.getLogger('land-architect-badge')
  const badgeId: BadgeId = BadgeId.LAND_ARCHITECT
  const badge: Badge = badgeStorage.getBadge(badgeId)

  function getUserAddress(event: CatalystDeploymentEvent): EthAddress {
    return Authenticator.ownerAddress(event.authChain)
  }

  async function handle(
    event: CatalystDeploymentEvent,
    userProgress: UserBadge | undefined
  ): Promise<BadgeProcessorResult | undefined> {
    const userAddress = getUserAddress(event)

    if (!EthAddress.validate(userAddress)) {
      logger.error('Invalid user address', { userAddress, badgeId, eventType: event.type })
      return undefined
    }

    userProgress ||= initProgressFor(userAddress)

    if (userProgress.completed_at) {
      logger.info('User already has badge', {
        userAddress: userAddress!,
        badgeId: badgeId
      })

      return undefined
    }

    userProgress.completed_at = Date.now()
    userProgress.progress.steps = 1

    await db.saveUserProgress(userProgress)
    return {
      badgeGranted: badge,
      userAddress: userAddress!
    }
  }

  function initProgressFor(userAddress: EthAddress): Omit<UserBadge, 'updated_at'> {
    return {
      user_address: userAddress,
      badge_id: badgeId,
      progress: {
        steps: 0
      }
    }
  }

  return {
    getUserAddress,
    handle,
    badgeId,
    badge,
    events: [
      {
        type: Events.Type.CATALYST_DEPLOYMENT,
        subType: Events.SubType.CatalystDeployment.SCENE
      }
    ]
  }
}
