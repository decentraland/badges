import { BadgeId, UserBadge } from '@badges/common'
import { AppComponents, IUserProgressValidator } from '../types'
import { InvalidRequestError } from '@dcl/platform-server-commons'
import { mergeWearablesEquipementProgress } from './backfills/wearables-equipement-backfill'
import { mergeEmotionistaProgress } from './backfills/emotionista-backfill'
import { mergeFashionistaProgress } from './backfills/fashionista-backfill'
import { mergeEventEnthusiastProgress } from './backfills/event-enthusiast-backfill'
import { mergeMovesMasterProgress } from './backfills/moves-master-backfill'
import { mergeSocialButterflyProgress } from './backfills/social-butterfly-backfill'
import { mergeLandArchitectProgress } from './backfills/land-architect-backfill'
import { mergeEmoteCreatorProgress } from './backfills/emote-creator-backfill'

export function createBackfillMergerComponent({
  logs,
  badgeService
}: Pick<AppComponents, 'logs' | 'badgeService'>): IUserProgressValidator {
  const logger = logs.getLogger('backfill-merger')

  function mergeUserProgress(
    badgeId: BadgeId,
    userAddress: string,
    currentUserProgress: UserBadge | undefined,
    backfillData: any
  ): UserBadge {
    try {
      switch (badgeId) {
        case BadgeId.REGALLY_RARE:
        case BadgeId.EXOTIC_ELEGANCE:
        case BadgeId.EPIC_ENSEMBLE:
        case BadgeId.UNIQUE_UNICORN:
        case BadgeId.LEGENDARY_LOOK:
        case BadgeId.MYTHIC_MODEL:
          return mergeWearablesEquipementProgress(
            userAddress,
            currentUserProgress,
            badgeService.getBadge(badgeId),
            backfillData
          )
        case BadgeId.EMOTIONISTA:
          return mergeEmotionistaProgress(
            userAddress,
            currentUserProgress,
            badgeService.getBadge(BadgeId.EMOTIONISTA),
            backfillData
          )
        case BadgeId.EMOTE_CREATOR:
          return mergeEmoteCreatorProgress(
            userAddress,
            currentUserProgress,
            badgeService.getBadge(BadgeId.EMOTE_CREATOR),
            backfillData
          )
        case BadgeId.FASHIONISTA:
          return mergeFashionistaProgress(
            userAddress,
            currentUserProgress,
            badgeService.getBadge(BadgeId.FASHIONISTA),
            backfillData
          )
        case BadgeId.EVENT_ENTHUSIAST:
          return mergeEventEnthusiastProgress(
            userAddress,
            currentUserProgress,
            badgeService.getBadge(BadgeId.EVENT_ENTHUSIAST),
            backfillData
          )
        case BadgeId.MOVES_MASTER:
          return mergeMovesMasterProgress(
            userAddress,
            currentUserProgress,
            badgeService.getBadge(BadgeId.MOVES_MASTER),
            backfillData
          )
        case BadgeId.SOCIAL_BUTTERFLY:
          return mergeSocialButterflyProgress(
            userAddress,
            currentUserProgress,
            badgeService.getBadge(BadgeId.SOCIAL_BUTTERFLY),
            backfillData
          )
        case BadgeId.LAND_ARCHITECT:
          return mergeLandArchitectProgress(
            userAddress,
            currentUserProgress,
            badgeService.getBadge(BadgeId.LAND_ARCHITECT),
            backfillData
          )

        default:
          throw new InvalidRequestError('Invalid Badge ID')
      }
    } catch (error: any) {
      logger.error('Failure while backfilling badge', { error: error.message, stack: JSON.stringify(error.stack) })
      throw new InvalidRequestError('Could not backfill this badge')
    }
  }

  return {
    mergeUserProgress
  }
}
