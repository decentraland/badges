import { Badge, BadgeId, UserBadge } from '@badges/common'
import { AppComponents, BadgeProcessorResult, IObserver } from '../../types'
import { EthAddress, Events, MoveToParcelEvent } from '@dcl/schemas'

export function createDecentralandCitizenObserver({
  db,
  logs,
  badgeStorage
}: Pick<AppComponents, 'db' | 'logs' | 'badgeStorage'>): IObserver {
  const logger = logs.getLogger('decentraland-citizen-badge')
  const badgeId: BadgeId = BadgeId.DECENTRALAND_CITIZEN
  const badge: Badge = badgeStorage.getBadge(badgeId)!

  async function handle(event: MoveToParcelEvent): Promise<BadgeProcessorResult | undefined> {
    const userAddress = event.metadata.userAddress

    const userProgress: UserBadge = (await db.getUserProgressFor(badgeId, userAddress)) || initProgressFor(userAddress)

    if (userProgress.completed_at) {
      logger.info('User already has badge', {
        userAddress: userAddress,
        badgeId: badgeId
      })

      return undefined
    }

    userProgress.completed_at = Date.now()
    userProgress.progress = {
      steps: 1,
      visited: event.metadata.parcel.newParcel
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
        subType: Events.SubType.Client.MOVE_TO_PARCEL
      }
    ]
  }
}
