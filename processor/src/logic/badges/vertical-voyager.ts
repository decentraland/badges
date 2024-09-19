import { Badge, BadgeId, UserBadge } from '@badges/common'
import { AppComponents, BadgeProcessorResult, IObserver } from '../../types'
import { EthAddress, Events, VerticalHeightReachedEvent } from '@dcl/schemas'

const ELEVATION_GAIN_NEEDED = 500

export function createVerticalVoyagerObserver({
  db,
  logs,
  badgeStorage
}: Pick<AppComponents, 'db' | 'logs' | 'badgeStorage'>): IObserver {
  const logger = logs.getLogger('vertical-voyager-badge')
  const badgeId: BadgeId = BadgeId.VERTICAL_VOYAGER
  const badge: Badge = badgeStorage.getBadge(badgeId)

  async function handle(event: VerticalHeightReachedEvent): Promise<BadgeProcessorResult | undefined> {
    const userAddress = event.metadata.userAddress
    const heightReached = event.metadata.height

    const userProgress: UserBadge = (await db.getUserProgressFor(badgeId, userAddress)) || initProgressFor(userAddress)

    if (userProgress.completed_at) {
      logger.info('User already has badge', { userAddress, badgeId })
      return undefined
    }

    if (heightReached < ELEVATION_GAIN_NEEDED) {
      logger.info('User has not reached enough elevation', { userAddress, heightReached })
      return undefined
    }

    userProgress.completed_at = Date.now()
    userProgress.progress = {
      steps: 1,
      height_reached: heightReached
    }

    await db.saveUserProgress(userProgress)

    return {
      badgeGranted: badge,
      userAddress: userAddress
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
    handle,
    badge,
    events: [
      {
        type: Events.Type.CLIENT,
        subType: Events.SubType.Client.VERTICAL_HEIGHT_REACHED
      }
    ]
  }
}
