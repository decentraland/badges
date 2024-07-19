import { CatalystDeploymentEvent, CollectionCreatedEvent, EthAddress, Events } from '@dcl/schemas'
import { AppComponents, IObserver } from '../../types'
import { Badge, BadgeId, UserBadge } from '@badges/common'

export function createOpenForBusinessObserver({ db, logs }: Pick<AppComponents, 'db' | 'logs'>): IObserver {
  const logger = logs.getLogger('open-for-business-badge')

  async function handleCatalystDeployment(userProgress: UserBadge): Promise<UserBadge> {
    if (!userProgress.progress.storeCompleted) {
      userProgress.progress.storeCompleted = true
    }

    return userProgress
  }

  async function handleCollectionCreatedEvent(userProgress: UserBadge): Promise<UserBadge> {
    if (!userProgress.progress.collectionSubmitted) {
      userProgress.progress.collectionSubmitted = true
    }

    return userProgress
  }

  async function check(event: CatalystDeploymentEvent | CollectionCreatedEvent): Promise<any> {
    logger.info('Analyzing criteria')
    let result: Badge | undefined
    let eventHandler: (userProgress: UserBadge) => Promise<UserBadge>
    let userAddress: EthAddress

    if (event.type === Events.Type.CATALYST_DEPLOYMENT) {
      eventHandler = handleCatalystDeployment
      userAddress = (event as CatalystDeploymentEvent).entity.metadata.owner
    } else if (event.type === Events.Type.BLOCKCHAIN) {
      eventHandler = handleCollectionCreatedEvent
      userAddress = (event as CollectionCreatedEvent).metadata.creator
    }

    const userProgress: UserBadge =
      (await db.getUserProgressFor(BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION, userAddress!)) ||
      ({
        user_address: userAddress!,
        badge_id: BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION,
        progress: {}
      } as UserBadge)

    if (userProgress.awarded_at) {
      logger.info('User already has badge', {
        userAddress: userAddress!,
        badgeId: BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION
      })

      return []
    }

    const updatedUserProgress = await eventHandler!(userProgress)
    logger.debug(`User progress updated`, {
      userAddress: userAddress!,
      badgeId: BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION,
      userProgress: JSON.stringify(updatedUserProgress, null, 2)
    })

    if (updatedUserProgress.progress.storeCompleted && updatedUserProgress.progress.collectionSubmitted) {
      logger.info('Granting badge', {
        userAddress: userAddress!,
        badgeId: BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION
      })
      updatedUserProgress.awarded_at = Date.now()
      result = (await db.getBadgeDefinitions()).find(
        (b) => b.id === BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION
      )!
    }
    await db.saveUserProgress(updatedUserProgress)

    return result
  }

  return { check }
}
