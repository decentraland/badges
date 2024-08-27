import { CatalystDeploymentEvent, Entity, EthAddress, Rarity } from '@dcl/schemas'
import { AppComponents, BadgeProcessorResult, IObserver } from '../../types'
import { Badge, BadgeId, UserBadge, badges } from '@badges/common'

const AMOUNT_OF_RARE_WEARABLES_REQUIRED = 3
export function createEpicEnsembleObserver({
  db,
  logs,
  badgeContext
}: Pick<AppComponents, 'db' | 'logs' | 'badgeContext'>): IObserver {
  const logger = logs.getLogger('epic-ensemble-badge')

  const badge: Badge = badges.get(BadgeId.EPIC_ENSEMBLE)!

  async function check(event: CatalystDeploymentEvent): Promise<BadgeProcessorResult> {
    logger.info('Analyzing criteria')
    let result: BadgeProcessorResult
    const userAddress = event.entity.pointers[0]

    const userProgress: UserBadge =
      (await db.getUserProgressFor(BadgeId.EPIC_ENSEMBLE, userAddress!)) || initProgressFor(userAddress)

    if (userProgress.completed_at) {
      logger.info('User already has badge', {
        userAddress: userAddress!,
        badgeId: BadgeId.EPIC_ENSEMBLE
      })

      return undefined
    }

    const wearablesWithRarity: Entity[] = await badgeContext.getWearablesWithRarity(
      event.entity.metadata.avatars[0].avatar.wearables
    )
    const rareWearablesEquipped = wearablesWithRarity.filter((wearable) => wearable.metadata?.rarity === Rarity.EPIC)

    if (rareWearablesEquipped.length >= AMOUNT_OF_RARE_WEARABLES_REQUIRED) {
      userProgress.completed_at = Date.now()
      userProgress.progress = { completed_with: rareWearablesEquipped.map((wearable) => wearable.metadata.id) }
      logger.info('Granting badge', {
        userAddress: userAddress!,
        badgeId: BadgeId.EPIC_ENSEMBLE,
        progress: userProgress.progress
      })
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
      badge_id: BadgeId.EPIC_ENSEMBLE,
      progress: {}
    }
  }

  return { check, badge }
}
