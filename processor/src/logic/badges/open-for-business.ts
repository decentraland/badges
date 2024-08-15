import { CatalystDeploymentEvent, CollectionCreatedEvent, EthAddress, Events } from '@dcl/schemas'
import { AppComponents, IObserver } from '../../types'
import { Badge, BadgeId, UserBadge, badges } from '@badges/common'

export function createOpenForBusinessObserver({ db, logs }: Pick<AppComponents, 'db' | 'logs'>): IObserver {
  const logger = logs.getLogger('open-for-business-badge')

  const badge: Badge = badges.get(BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION)!

  const functionsPerEvent = {
    [Events.Type.CATALYST_DEPLOYMENT]: (event: any) => ({
      getUserAddress: () => event.entity.metadata.owner,
      updateUserProgress: (userProgress: UserBadge) => ({
        ...userProgress,
        progress: { ...userProgress.progress, steps: (userProgress.progress.steps || 0) + 1, storeCompleted: true }
      })
    }),
    [Events.Type.BLOCKCHAIN]: (event: any) => ({
      getUserAddress: () => event.metadata.creator,
      updateUserProgress: (userProgress: UserBadge) => ({
        ...userProgress,
        progress: {
          ...userProgress.progress,
          steps: (userProgress.progress.steps || 0) + 1,
          collectionSubmitted: true
        }
      })
    })
  }

  async function check(event: CatalystDeploymentEvent | CollectionCreatedEvent): Promise<Badge[] | undefined> {
    logger.info('Analyzing criteria')
    let result: Badge[] | undefined
    const functions = functionsPerEvent[event.type](event)
    const userAddress: EthAddress = functions.getUserAddress()

    const userProgress: UserBadge =
      (await db.getUserProgressFor(BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION, userAddress!)) ||
      initProgressFor(userAddress)

    if (userProgress.completed_at) {
      logger.info('User already has badge', {
        userAddress: userAddress!,
        badgeId: BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION
      })

      return undefined
    }

    const updatedUserProgress = functions.updateUserProgress(userProgress)

    if (updatedUserProgress.progress.storeCompleted && updatedUserProgress.progress.collectionSubmitted) {
      updatedUserProgress.completed_at = Date.now()
      logger.info('Granting badge', {
        userAddress: userAddress!,
        badgeId: BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION,
        progress: updatedUserProgress.progress
      })
      result = [badge]
    }

    await db.saveUserProgress(updatedUserProgress)

    return result
  }

  function initProgressFor(userAddress: EthAddress): UserBadge {
    return {
      user_address: userAddress,
      badge_id: BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION,
      progress: {}
    }
  }

  return {
    check,
    badge
  }
}
