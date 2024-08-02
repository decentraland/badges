import { CatalystDeploymentEvent, Entity, EthAddress, Rarity } from '@dcl/schemas'
import { AppComponents, IObserver } from '../../types'
import { Badge, BadgeId, UserBadge } from '@badges/common'

const AMOUNT_OF_RARE_WEARABLES_REQUIRED = 3
export function createRegallyRareObserver({
  db,
  logs,
  badgeContext
}: Pick<AppComponents, 'db' | 'logs' | 'badgeContext'>): IObserver {
  const logger = logs.getLogger('regally-rare-badge')

  const badge: Badge = {
    id: BadgeId.REGALLY_RARE,
    name: 'Regally Rare',
    description: 'Equip at least 3 wearables of rarity “rare” at the same time',
    image: 'lorem impsum' // TODO
  }

  async function check(event: CatalystDeploymentEvent): Promise<Badge | undefined> {
    logger.info('Analyzing criteria')
    let result: Badge | undefined
    const userAddress = event.entity.pointers[0]

    const userProgress: UserBadge =
      (await db.getUserProgressFor(BadgeId.REGALLY_RARE, userAddress!)) || initProgressFor(userAddress)

    if (userProgress.awarded_at) {
      logger.info('User already has badge', {
        userAddress: userAddress!,
        badgeId: BadgeId.REGALLY_RARE
      })

      return undefined
    }

    const wearablesWithRarity: Entity[] = await badgeContext.getWearablesWithRarity(
      event.entity.metadata.avatars[0].avatar.wearables
    )
    const rareWearablesEquipped = wearablesWithRarity.filter((wearable) => wearable.metadata?.rarity === Rarity.RARE)

    if (rareWearablesEquipped.length >= AMOUNT_OF_RARE_WEARABLES_REQUIRED) {
      userProgress.awarded_at = Date.now()
      userProgress.progress = { completedWith: rareWearablesEquipped.map((wearable) => wearable.metadata.id) }
      logger.info('Granting badge', {
        userAddress: userAddress!,
        badgeId: BadgeId.REGALLY_RARE,
        progress: userProgress.progress
      })
      await db.saveUserProgress(userProgress)
      result = badge
    }

    return result
  }

  function initProgressFor(userAddress: EthAddress): UserBadge {
    return {
      user_address: userAddress,
      badge_id: BadgeId.REGALLY_RARE,
      progress: {}
    }
  }

  return { check, badge }
}
