import { Badge, BadgeCategory, BadgeId } from '.'

const badges: Map<BadgeId, Badge> = new Map<BadgeId, Badge>([
  [
    BadgeId.DECENTRALAND_CITIZEN,
    {
      id: BadgeId.DECENTRALAND_CITIZEN,
      name: 'Decentraland Citizen',
      category: BadgeCategory.EXPLORER,
      description: 'Landed in Decentraland',
      image: 'lorem impsum',
      criteria: { steps: 1 }
    }
  ],
  [
    BadgeId.EPIC_ENSEMBLE,
    {
      id: BadgeId.EPIC_ENSEMBLE,
      name: 'Epic Ensemble',
      category: BadgeCategory.COLLECTOR,
      description: "Equip at least 3 wearables of rarity 'epic' at the same time",
      image: 'lorem impsum',
      criteria: { steps: 1 }
    }
  ],
  [
    BadgeId.REGALLY_RARE,
    {
      id: BadgeId.REGALLY_RARE,
      name: 'Regally Rare',
      category: BadgeCategory.COLLECTOR,
      description: "Equip at least 3 wearables of rarity 'rare' at the same time",
      image: 'lorem impsum',
      criteria: { steps: 1 }
    }
  ],
  [
    BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION,
    {
      id: BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION,
      name: 'Open for Business',
      category: BadgeCategory.EXPLORER,
      description: 'Complete Store Information and submit at least 1 collection',
      image: 'lorem impsum',
      criteria: { steps: 2 }
    }
  ],
  [
    BadgeId.TRAVELER,
    {
      id: BadgeId.TRAVELER,
      name: 'Traveler',
      category: BadgeCategory.EXPLORER,
      description: `Starter: 1 Genesis City scene explored;Bronze: 50 Genesis City scenes explored;Silver: 250 Genesis City scenes explored;Gold: 1,000 Genesis City scenes explored;Platinum: 2,500 Genesis City scenes explored;Diamond: 10,000 Genesis City scenes explored`,
      tiers: [
        {
          tierId: 'traveler-starter',
          tierName: 'Starter',
          description: '1 Genesis City scene explored',
          image: 'lorem ipsum 1',
          criteria: { steps: 1 }
        },
        {
          tierId: 'traveler-bronze',
          tierName: 'Bronze',
          description: 'Bronze: 50 Genesis City scenes explored',
          image: 'lorem ipsum 2',
          criteria: { steps: 50 }
        },
        {
          tierId: 'traveler-silver',
          tierName: 'Silver',
          description: 'Silver: 250 Genesis City scenes explored',
          image: 'lorem ipsum 3',
          criteria: { steps: 250 }
        },
        {
          tierId: 'traveler-gold',
          tierName: 'Gold',
          description: 'Gold: 1,000 Genesis City scenes explored',
          image: 'lorem ipsum 4',
          criteria: { steps: 1000 }
        },
        {
          tierId: 'traveler-platinum',
          tierName: 'Platinum',
          description: 'Platinum: 2,500 Genesis City scenes explored',
          image: 'lorem ipsum 5',
          criteria: { steps: 2500 }
        },
        {
          tierId: 'traveler-diamond',
          tierName: 'Diamond',
          description: 'Diamond: 10,000 Genesis City scenes explored',
          image: 'lorem ipsum 6',
          criteria: { steps: 10000 }
        }
      ]
    }
  ]
])

export { badges }
