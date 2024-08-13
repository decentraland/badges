import { Badge, BadgeId, badges, UserBadge } from '@badges/common'
import { AppComponents, IObserver } from '../../types'
import { EthAddress, MoveToParcelEvent } from '@dcl/schemas'

export function createDecentralandCitizenObserver({ db, logs }: Pick<AppComponents, 'db' | 'logs'>): IObserver {
  const logger = logs.getLogger('decentraland-citizen-badge')

  const badge: Badge = badges.get(BadgeId.DECENTRALAND_CITIZEN)!

  async function check(event: MoveToParcelEvent): Promise<Badge | undefined> {
    const userAddress = event.metadata.userAddress

    const userProgress: UserBadge =
      (await db.getUserProgressFor(BadgeId.DECENTRALAND_CITIZEN, userAddress)) || initProgressFor(userAddress)

    if (userProgress.awarded_at) {
      logger.info('User already has badge', {
        userAddress: userAddress,
        badgeId: BadgeId.DECENTRALAND_CITIZEN
      })

      return undefined
    }

    userProgress.awarded_at = Date.now()
    userProgress.progress = {
      visited: event.metadata.parcel.newParcel
    }
    logger.info('Granting badge', {
      userrAddress: userAddress,
      badgeId: BadgeId.DECENTRALAND_CITIZEN,
      progress: userProgress.progress
    })

    await db.saveUserProgress(userProgress)
    return badge
  }

  function initProgressFor(userAddress: EthAddress): UserBadge {
    return {
      user_address: userAddress,
      badge_id: BadgeId.DECENTRALAND_CITIZEN,
      progress: {}
    }
  }

  return {
    check,
    badge
  }
}
