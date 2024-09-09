import { CatalystDeploymentEvent, Entity, EthAddress, Events, Rarity } from '@dcl/schemas'
import { AppComponents, BadgeProcessorResult, IObserver } from '../../types'
import { Badge, BadgeId, UserBadge } from '@badges/common'

const AMOUNT_OF_EPIC_WEARABLES_REQUIRED = 3
export function createEpicEnsembleObserver({
  db,
  logs,
  badgeContext,
  badgeStorage
}: Pick<AppComponents, 'db' | 'logs' | 'badgeContext' | 'badgeStorage'>): IObserver {
  const logger = logs.getLogger('epic-ensemble-badge')
  const badgeId: BadgeId = BadgeId.EPIC_ENSEMBLE
  const badge: Badge = badgeStorage.getBadge(badgeId)

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

    const wearablesWithRarity: Entity[] = await badgeContext.getWearablesWithRarity(
      event.entity.metadata.avatars[0].avatar.wearables
    )
    const rareWearablesEquipped = wearablesWithRarity.filter((wearable) => wearable.metadata?.rarity === Rarity.EPIC)

    if (rareWearablesEquipped.length >= AMOUNT_OF_EPIC_WEARABLES_REQUIRED) {
      userProgress.completed_at = Date.now()
      userProgress.progress = {
        completed_with: rareWearablesEquipped.map((wearable) => wearable.metadata.id),
        steps: 1
      }
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
