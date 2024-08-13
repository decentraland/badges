import { Badge, BadgeId } from './types'

const badges: Map<BadgeId, Badge> = new Map<BadgeId, Badge>([
  [
    BadgeId.DECENTRALAND_CITIZEN,
    {
      id: BadgeId.DECENTRALAND_CITIZEN,
      name: 'Decentraland Citizen',
      description: 'Landed in Decentraland',
      image: 'lorem impsum' // TODO
    }
  ],
  [
    BadgeId.EPIC_ENSEMBLE,
    {
      id: BadgeId.EPIC_ENSEMBLE,
      name: 'Epic Ensemble',
      description: "Equip at least 3 wearables of rarity 'epic' at the same time",
      image: 'lorem impsum' // TODO
    }
  ],
  [
    BadgeId.REGALLY_RARE,
    {
      id: BadgeId.REGALLY_RARE,
      name: 'Regally Rare',
      description: "Equip at least 3 wearables of rarity 'rare' at the same time",
      image: 'lorem impsum' // TODO
    }
  ],
  [
    BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION,
    {
      id: BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION,
      name: 'Open for Business',
      description: 'Complete Store Information and submit at least 1 collection',
      image: 'lorem impsum' // TODO
    }
  ]
])

export { badges }
