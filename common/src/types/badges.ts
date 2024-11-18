import { Badge, BadgeCategory, BadgeId } from '.'
import { TierBadge } from './tiers'
import { createLevelBadgeTiers } from './utils'

const badges: Map<BadgeId, Badge> = new Map<BadgeId, Badge>([
  [
    BadgeId.DECENTRALAND_CITIZEN,
    {
      id: BadgeId.DECENTRALAND_CITIZEN,
      name: 'Decentraland Citizen',
      category: BadgeCategory.EXPLORER,
      description: 'Landed in Decentraland',
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
      criteria: { steps: 1 }
    }
  ],
  [
    BadgeId.LEGENDARY_LOOK,
    {
      id: BadgeId.LEGENDARY_LOOK,
      name: 'Legendary Look',
      category: BadgeCategory.COLLECTOR,
      description: 'Equipped outfit with at least 3 Legendary Wearables',
      criteria: { steps: 1 }
    }
  ],
  [
    BadgeId.MYTHIC_MODEL,
    {
      id: BadgeId.MYTHIC_MODEL,
      name: 'Mythic Model',
      category: BadgeCategory.COLLECTOR,
      description: 'Equipped outfit with at least 3 Mythic Wearables',
      criteria: { steps: 1 }
    }
  ],
  [
    BadgeId.UNIQUE_UNICORN,
    {
      id: BadgeId.UNIQUE_UNICORN,
      name: 'Unique Unicorn',
      category: BadgeCategory.COLLECTOR,
      description: 'Equipped outfit with at least 3 Unique Wearables',
      criteria: { steps: 1 }
    }
  ],
  [
    BadgeId.OPEN_FOR_BUSINESS,
    {
      id: BadgeId.OPEN_FOR_BUSINESS,
      name: 'Open for Business',
      category: BadgeCategory.CREATOR,
      description: 'Complete Store Information and submit at least 1 collection',
      criteria: { steps: 2 }
    }
  ],
  [
    BadgeId.EXOTIC_ELEGANCE,
    {
      id: BadgeId.EXOTIC_ELEGANCE,
      name: 'Exotic Elegance',
      category: BadgeCategory.COLLECTOR,
      description: 'Equipped outfit with at least 3 Exotic Wearables',
      criteria: { steps: 1 }
    }
  ],
  [
    BadgeId.TRAVELER,
    {
      id: BadgeId.TRAVELER,
      name: 'Traveler',
      category: BadgeCategory.EXPLORER,
      description: `Starter: 1 Genesis City scene explored (for at least 1 min);Bronze: 50 Genesis City scenes explored (for at least 1 min);Silver: 250 Genesis City scenes explored (for at least 1 min);Gold: 1,000 Genesis City scenes explored (for at least 1 min);Platinum: 2,500 Genesis City scenes explored (for at least 1 min);Diamond: 10,000 Genesis City scenes explored (for at least 1 min)`,
      tiers: createLevelBadgeTiers(
        TierBadge.TRAVELER,
        [1, 50, 250, 1000, 2500, 10000],
        [
          '1 Genesis City scene explored (for at least 1 min)',
          '50 Genesis City scenes explored (for at least 1 min)',
          '250 Genesis City scenes explored (for at least 1 min)',
          '1,000 Genesis City scenes explored (for at least 1 min)',
          '2,500 Genesis City scenes explored (for at least 1 min)',
          '10,000 Genesis City scenes explored (for at least 1 min)'
        ]
      )
    }
  ],
  [
    BadgeId.PROFILE_PRO,
    {
      id: BadgeId.PROFILE_PRO,
      name: 'Profile Pro',
      category: BadgeCategory.SOCIALIZER,
      description: 'Added information to Profile',
      criteria: { steps: 1 }
    }
  ],
  [
    BadgeId.EMOTIONISTA,
    {
      id: BadgeId.EMOTIONISTA,
      name: 'Emotionista',
      category: BadgeCategory.COLLECTOR,
      description:
        'Starter: 1 Emote purchased;Bronze: 10 Emotes purchased;Silver: 25 Emotes purchased;Gold: 50 Emotes purchased;Platinum: 150 Emotes purchased;Diamond: 300  Emotes purchased',
      tiers: createLevelBadgeTiers(
        TierBadge.EMOTIONISTA,
        [1, 10, 25, 50, 150, 300],
        [
          '1 Emote purchased',
          '10 Emotes purchased',
          '25 Emotes purchased',
          '50 Emotes purchased',
          '150 Emotes purchased',
          '300  Emotes purchased'
        ]
      )
    }
  ],
  [
    BadgeId.FASHIONISTA,
    {
      id: BadgeId.FASHIONISTA,
      name: 'Fashionista',
      category: BadgeCategory.COLLECTOR,
      description:
        'Starter: 1 Wearable purchased;Bronze: 25 Wearables purchased;Silver: 75 Wearables purchased;Gold: 250 Wearables purchased;Platinum: 500 Wearables purchased;Diamond: 1,500 Wearables purchased',
      tiers: createLevelBadgeTiers(
        TierBadge.FASHIONISTA,
        [1, 25, 75, 250, 500, 1500],
        [
          '1 Wearable purchased',
          '25 Wearables purchased',
          '75 Wearables purchased',
          '250 Wearables purchased',
          '500 Wearables purchased',
          '1,500 Wearables purchased'
        ]
      )
    }
  ],
  [
    BadgeId.EVENT_ENTHUSIAST,
    {
      id: BadgeId.EVENT_ENTHUSIAST,
      name: 'Event Enthusiast',
      category: BadgeCategory.EXPLORER,
      description:
        'Starter: 1 Events attended (for at least 5 min);Bronze: 50 Events attended (for at least 5 min);Silver: 100 Events attended (for at least 5 min);Gold: 500 Events attended (for at least 5 min);Platinum: 1000 Events attended (for at least 5 min);Diamond: 2000 Events attended (for at least 5 min)',
      tiers: createLevelBadgeTiers(
        TierBadge.EVENT_ENTHUSIAST,
        [1, 50, 100, 500, 1000, 2000],
        [
          '1 Events attended (for at least 5 min)',
          '50 Events attended (for at least 5 min)',
          '100 Events attended (for at least 5 min)',
          '500 Events attended (for at least 5 min)',
          '1000 Events attended (for at least 5 min)',
          '2000 Events attended (for at least 5 min)'
        ]
      )
    }
  ],
  [
    BadgeId.MOVES_MASTER,
    {
      id: BadgeId.MOVES_MASTER,
      name: 'Moves Master',
      category: BadgeCategory.EXPLORER,
      description:
        'Starter: Emoted 100 times (max 1/min);Bronze: Emoted 1,000 times (max 1/min);Silver: Emoted 5,000 times (max 1/min);Gold: Emoted 10,000 times (max 1/min);Platinum: Emoted 100,000 times (max 1/min);Diamond: Emoted 500,000 times (max 1/min)',
      tiers: createLevelBadgeTiers(
        TierBadge.MOVES_MASTER,
        [100, 1000, 5000, 10000, 100000, 500000],
        [
          'Emoted 100 times (max 1/min)',
          'Emoted 1,000 times (max 1/min)',
          'Emoted 5,000 times (max 1/min)',
          'Emoted 10,000 times (max 1/min)',
          'Emoted 100,000 times (max 1/min)',
          'Emoted 500,000 times (max 1/min)'
        ]
      )
    }
  ],
  [
    BadgeId.SOCIAL_BUTTERFLY,
    {
      id: BadgeId.SOCIAL_BUTTERFLY,
      name: 'Social Butterfly',
      category: BadgeCategory.SOCIALIZER,
      description:
        'Starter: 1 Profile viewed;Bronze: 50 Profiles viewed;Silver: 100 Profiles viewed;Gold: 250 Profiles viewed;Platinum: 500 Profiles viewed;Diamond: 1,000 Profiles viewed',
      tiers: createLevelBadgeTiers(
        TierBadge.SOCIAL_BUTTERFLY,
        [1, 50, 100, 250, 500, 1000],
        [
          '1 Profile viewed',
          '50 Profiles viewed',
          '100 Profiles viewed',
          '250 Profiles viewed',
          '500 Profiles viewed',
          '1,000 Profiles viewed'
        ]
      )
    }
  ],
  [
    BadgeId.VERTICAL_VOYAGER,
    {
      id: BadgeId.VERTICAL_VOYAGER,
      name: 'Vertical Voyager',
      category: BadgeCategory.EXPLORER,
      description: 'Achieved a total elevation gain of at least 500m in one session',
      criteria: { steps: 1 }
    }
  ],
  [
    BadgeId.WALKABOUT_WANDERER,
    {
      id: BadgeId.WALKABOUT_WANDERER,
      name: 'Walkabout Wanderer',
      category: BadgeCategory.EXPLORER,
      description:
        'Starter: 10k Steps walked in Decentraland;Bronze: 40k Steps walked in Decentraland;Silver: 150k Steps walked in Decentraland;Gold: 600k Steps walked in Decentraland;Platinum: 2.5M Steps walked in Decentraland;Diamond: 10M Steps walked in Decentraland',
      tiers: createLevelBadgeTiers(
        TierBadge.WALKABOUT_WANDERER,
        [10000, 40000, 150000, 600000, 2500000, 10000000],
        [
          '10k Steps walked in Decentraland',
          '40k Steps walked in Decentraland',
          '150k Steps walked in Decentraland',
          '600k Steps walked in Decentraland',
          '2.5M Steps walked in Decentraland',
          '10M Steps walked in Decentraland'
        ]
      )
    }
  ],
  [
    BadgeId.LAND_ARCHITECT,
    {
      id: BadgeId.LAND_ARCHITECT,
      name: 'LAND Architect',
      category: BadgeCategory.BUILDER,
      description: 'Deployed a scene to Genesis City',
      criteria: { steps: 1 }
    }
  ],
  [
    BadgeId.EMOTE_CREATOR,
    {
      id: BadgeId.EMOTE_CREATOR,
      name: 'Emote Creator',
      category: BadgeCategory.CREATOR,
      description:
        'Starter: 1 Emote published;Bronze: 5 Emotes published;Silver: 10 Emotes published;Gold: 20 Emotes published;Platinum: 50 Emotes published;Diamond: 100 Emotes published',
      tiers: createLevelBadgeTiers(
        TierBadge.EMOTE_CREATOR,
        [1, 5, 10, 20, 50, 100],
        [
          '1 Emote published',
          '5 Emotes published',
          '10 Emotes published',
          '20 Emotes published',
          '50 Emotes published',
          '100 Emotes published'
        ]
      )
    }
  ],
  [
    BadgeId.WEARABLE_DESIGNER,
    {
      id: BadgeId.WEARABLE_DESIGNER,
      name: 'Wearable Designer',
      category: BadgeCategory.CREATOR,
      description:
        'Starter: 1 Wearable published;Bronze: 5 Wearables published;Silver: 25 Wearables published;Gold: 50 Wearables published;Platinum: 175 Wearables published;Diamond: 350 Wearables published',
      tiers: createLevelBadgeTiers(
        TierBadge.WEARABLE_DESIGNER,
        [1, 5, 25, 50, 175, 350],
        [
          '1 Wearable published',
          '5 Wearables published',
          '25 Wearables published',
          '50 Wearables published',
          '175 Wearables published',
          '350 Wearables published'
        ]
      )
    }
  ],
  [
    BadgeId.MUSIC_FESTIVAL_2024,
    {
      id: BadgeId.MUSIC_FESTIVAL_2024,
      name: 'Decentraland Music Festival 2024',
      category: BadgeCategory.EXPLORER,
      description: 'Jumped in and attended Decentraland Music Festival 2024',
      criteria: { steps: 1 }
    }
  ]
])

export { badges }
