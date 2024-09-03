import { CatalystDeploymentEvent, CollectionCreatedEvent, EthAddress, Events } from '@dcl/schemas'
import { AppComponents, BadgeProcessorResult, IObserver } from '../../types'
import { Badge, BadgeId, UserBadge, badges } from '@badges/common'

export function createOpenForBusinessObserver({ db, logs }: Pick<AppComponents, 'db' | 'logs'>): IObserver {
  const logger = logs.getLogger('open-for-business-badge')

  const badge: Badge = badges.get(BadgeId.OPEN_FOR_BUSINESS)!

  const functionsPerEvent = {
    [Events.Type.CATALYST_DEPLOYMENT]: (event: any) => ({
      getUserAddress: () => event.entity.metadata.owner,
      updateUserProgress: (userProgress: UserBadge) => ({
        ...userProgress,
        progress: { ...userProgress.progress, steps: (userProgress.progress.steps || 0) + 1, store_completed: true }
      })
    }),
    [Events.Type.BLOCKCHAIN]: (event: any) => ({
      getUserAddress: () => event.metadata.creator,
      updateUserProgress: (userProgress: UserBadge) => ({
        ...userProgress,
        progress: {
          ...userProgress.progress,
          steps: (userProgress.progress.steps || 0) + 1,
          collection_submitted: true
        }
      })
    })
  }

  async function handle(
    event: CatalystDeploymentEvent | CollectionCreatedEvent
  ): Promise<BadgeProcessorResult | undefined> {
    let result: BadgeProcessorResult | undefined
    const functions = functionsPerEvent[event.type](event)
    const userAddress: EthAddress = functions.getUserAddress()

    const userProgress: UserBadge =
      (await db.getUserProgressFor(BadgeId.OPEN_FOR_BUSINESS, userAddress!)) || initProgressFor(userAddress)

    if (userProgress.completed_at) {
      logger.info('User already has badge', {
        userAddress: userAddress!,
        badgeId: BadgeId.OPEN_FOR_BUSINESS
      })

      return undefined
    }

    const updatedUserProgress = functions.updateUserProgress(userProgress)

    if (updatedUserProgress.progress.store_completed && updatedUserProgress.progress.collection_submitted) {
      updatedUserProgress.completed_at = Date.now()
      result = {
        badgeGranted: badge,
        userAddress: userAddress!
      }
    }

    await db.saveUserProgress(updatedUserProgress)

    return result
  }

  function initProgressFor(userAddress: EthAddress): Omit<UserBadge, 'updated_at'> {
    return {
      user_address: userAddress,
      badge_id: BadgeId.OPEN_FOR_BUSINESS,
      progress: {}
    }
  }

  return {
    handle,
    badge,
    events: [
      {
        type: Events.Type.CATALYST_DEPLOYMENT,
        subType: Events.SubType.CatalystDeployment.STORE
      },
      {
        type: Events.Type.BLOCKCHAIN,
        subType: Events.SubType.Blockchain.COLLECTION_CREATED
      }
    ]
  }
}
