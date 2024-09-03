import { Badge, BadgeId, badges, UserBadge } from '@badges/common'
import { AppComponents, BadgeProcessorResult, IObserver } from '../../types'
import { EthAddress, Events, MoveToParcelEvent } from '@dcl/schemas'

export function createDecentralandCitizenObserver({ db, logs }: Pick<AppComponents, 'db' | 'logs'>): IObserver {
  const logger = logs.getLogger('decentraland-citizen-badge')

  const badge: Badge = badges.get(BadgeId.DECENTRALAND_CITIZEN)!

  async function handle(event: MoveToParcelEvent): Promise<BadgeProcessorResult | undefined> {
    const userAddress = event.metadata.userAddress

    const userProgress: UserBadge =
      (await db.getUserProgressFor(BadgeId.DECENTRALAND_CITIZEN, userAddress)) || initProgressFor(userAddress)

    if (userProgress.completed_at) {
      logger.info('User already has badge', {
        userAddress: userAddress,
        badgeId: BadgeId.DECENTRALAND_CITIZEN
      })

      return undefined
    }

    userProgress.completed_at = Date.now()
    userProgress.progress = {
      steps: 1,
      visited: event.metadata.parcel.newParcel
    }
    logger.info('Granting badge', {
      userAddress: userAddress,
      badgeId: BadgeId.DECENTRALAND_CITIZEN,
      progress: userProgress.progress
    })

    await db.saveUserProgress(userProgress)
    return {
      badgeGranted: badge,
      userAddress: userAddress
    }
  }

  function initProgressFor(userAddress: EthAddress): Omit<UserBadge, 'updated_at'> {
    return {
      user_address: userAddress,
      badge_id: BadgeId.DECENTRALAND_CITIZEN,
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
