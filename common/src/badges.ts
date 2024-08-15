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
  ],
  [
    BadgeId.TRAVELER,
    {
      id: BadgeId.TRAVELER,
      name: 'Traveler',
      description: `
        Starter: 1 Genesis City scene explored
        Bronze: 50 Genesis City scenes explored
        Silver: 250 Genesis City scenes explored
        Gold: 1,000 Genesis City scenes explored
        Platinum: 2,500 Genesis City scenes explored
        Diamond: 10,000 Genesis City scenes explored
        `,
      tiers: [
        {
          tierId: 1,
          tierName: 'Starter',
          criteria: { scenesVisited: 1 },
          description: '1 Genesis City scene explored',
          image: 'lorem ipsum 1'
        },
        {
          tierId: 2,
          tierName: 'Bronze',
          criteria: { scenesVisited: 50 },
          description: 'Bronze: 50 Genesis City scenes explored',
          image: 'lorem ipsum 2'
        },
        {
          tierId: 3,
          tierName: 'Silver',
          criteria: { scenesVisited: 250 },
          description: 'Silver: 250 Genesis City scenes explored',
          image: 'lorem ipsum 3'
        },
        {
          tierId: 4,
          tierName: 'Gold',
          criteria: { scenesVisited: 1000 },
          description: 'Gold: 1,000 Genesis City scenes explored',
          image: 'lorem ipsum 4'
        },
        {
          tierId: 5,
          tierName: 'Platinum',
          criteria: { scenesVisited: 2500 },
          description: 'Platinum: 2,500 Genesis City scenes explored',
          image: 'lorem ipsum 5'
        },
        {
          tierId: 6,
          tierName: 'Diamond',
          criteria: { scenesVisited: 10000 },
          description: 'Diamond: 10,000 Genesis City scenes explored',
          image: 'lorem ipsum 6'
        }
      ]
    }
  ]
])

export { badges }
