import { CatalystDeploymentEvent, EthAddress, Events } from '@dcl/schemas'
import { AppComponents, BadgeProcessorResult, IObserver } from '../../types'
import { Badge, BadgeId, UserBadge, badges } from '@badges/common'

export function createProfileProObserver({ db, logs }: Pick<AppComponents, 'db' | 'logs'>): IObserver {
  const logger = logs.getLogger('profile-pro-badge')
  const badgeId: BadgeId = BadgeId.PROFILE_PRO
  const badge: Badge = badges.get(badgeId)!

  async function handle(event: CatalystDeploymentEvent): Promise<BadgeProcessorResult | undefined> {
    let result: BadgeProcessorResult | undefined
    const userAddress = event.entity.pointers[0]

    const userProgress: UserBadge = (await db.getUserProgressFor(badgeId, userAddress!)) || initProgressFor(userAddress)

    if (userProgress.completed_at) {
      logger.info('User already has badge', {
        userAddress: userAddress!,
        badgeId: badgeId
      })

      return undefined
    }

    const hasCompletedProfileDescription = !!event.entity.metadata.avatars[0].avatar.description

    if (hasCompletedProfileDescription) {
      userProgress.completed_at = Date.now()
      userProgress.progress = { steps: 1, descriptionAdded: event.entity.metadata.avatars[0].avatar.description }
      await db.saveUserProgress(userProgress)
      result = {
        badgeGranted: badge,
        userAddress: userAddress!
      }
    }

    return result
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
        type: Events.Type.CATALYST_DEPLOYMENT,
        subType: Events.SubType.CatalystDeployment.PROFILE
      }
    ]
  }
}
