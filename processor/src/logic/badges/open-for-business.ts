import { CatalystDeploymentEvent, CollectionCreatedEvent, EthAddress, Events } from '@dcl/schemas'
import { Authenticator } from '@dcl/crypto'
import { Badge, BadgeId, UserBadge } from '@badges/common'
import { AppComponents, BadgeProcessorResult, IObserver } from '../../types'

export function createOpenForBusinessObserver({
  db,
  logs,
  badgeStorage
}: Pick<AppComponents, 'db' | 'logs' | 'badgeStorage'>): IObserver {
  const logger = logs.getLogger('open-for-business-badge')
  const badgeId: BadgeId = BadgeId.OPEN_FOR_BUSINESS
  const badge: Badge = badgeStorage.getBadge(badgeId)!

  const functionsPerEvent = {
    [Events.Type.CATALYST_DEPLOYMENT]: (event: any) => ({
      getUserAddress: () => Authenticator.ownerAddress(event.authChain),
      updateUserProgress: (userProgress: UserBadge) => ({
        ...userProgress,
        progress: { ...userProgress.progress, steps: (userProgress.progress.steps || 0) + 1, store_completed: true }
      }),
      stepAlreadyCompleted: (userProgress: UserBadge) => userProgress.progress.store_completed
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
      }),
      stepAlreadyCompleted: (userProgress: UserBadge) => userProgress.progress.collection_submitted
    })
  }

  function getUserAddress(event: CatalystDeploymentEvent | CollectionCreatedEvent): EthAddress {
    return functionsPerEvent[event.type](event).getUserAddress()!
  }

  async function handle(
    event: CatalystDeploymentEvent | CollectionCreatedEvent,
    userProgress: UserBadge | undefined
  ): Promise<BadgeProcessorResult | undefined> {
    let result: BadgeProcessorResult | undefined
    const functions = functionsPerEvent[event.type](event)
    const userAddress: EthAddress = getUserAddress(event)

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

    if (functions.stepAlreadyCompleted(userProgress)) {
      logger.info('User already completed the step associated to this event', {
        userAddress: userAddress!,
        badgeId: badgeId,
        eventType: event.type
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
      badge_id: badgeId,
      progress: {}
    }
  }

  return {
    getUserAddress,
    handle,
    badge,
    badgeId,
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
