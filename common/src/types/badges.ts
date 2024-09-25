import { Badge, BadgeCategory, BadgeId } from '.'

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
      category: BadgeCategory.EXPLORER,
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
      tiers: [
        {
          tierId: 'traveler-starter',
          tierName: 'Starter',
          description: '1 Genesis City scene explored (for at least 1 min)',
          criteria: { steps: 1 }
        },
        {
          tierId: 'traveler-bronze',
          tierName: 'Bronze',
          description: '50 Genesis City scenes explored (for at least 1 min)',
          criteria: { steps: 50 }
        },
        {
          tierId: 'traveler-silver',
          tierName: 'Silver',
          description: '250 Genesis City scenes explored (for at least 1 min)',
          criteria: { steps: 250 }
        },
        {
          tierId: 'traveler-gold',
          tierName: 'Gold',
          description: '1,000 Genesis City scenes explored (for at least 1 min)',
          criteria: { steps: 1000 }
        },
        {
          tierId: 'traveler-platinum',
          tierName: 'Platinum',
          description: '2,500 Genesis City scenes explored (for at least 1 min)',
          criteria: { steps: 2500 }
        },
        {
          tierId: 'traveler-diamond',
          tierName: 'Diamond',
          description: '10,000 Genesis City scenes explored (for at least 1 min)',
          criteria: { steps: 10000 }
        }
      ]
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
      tiers: [
        {
          tierId: 'emotionista-starter',
          tierName: 'Starter',
          description: '1 Emote purchased',
          criteria: { steps: 1 }
        },
        {
          tierId: 'emotionista-bronze',
          tierName: 'Bronze',
          description: '10 Emotes purchased',
          criteria: { steps: 10 }
        },
        {
          tierId: 'emotionista-silver',
          tierName: 'Silver',
          description: '25 Emotes purchased',
          criteria: { steps: 25 }
        },
        {
          tierId: 'emotionista-gold',
          tierName: 'Gold',
          description: '50 Emotes purchased',
          criteria: { steps: 50 }
        },
        {
          tierId: 'emotionista-platinum',
          tierName: 'Platinum',
          description: '150 Emotes purchased',
          criteria: { steps: 150 }
        },
        {
          tierId: 'emotionista-diamond',
          tierName: 'Diamond',
          description: '300  Emotes purchased',
          criteria: { steps: 300 }
        }
      ]
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
      tiers: [
        {
          tierId: 'fashionista-starter',
          tierName: 'Starter',
          description: '1 Wearable purchased',
          criteria: { steps: 1 }
        },
        {
          tierId: 'fashionista-bronze',
          tierName: 'Bronze',
          description: '25 Wearables purchased',
          criteria: { steps: 25 }
        },
        {
          tierId: 'fashionista-silver',
          tierName: 'Silver',
          description: '75 Wearables purchased',
          criteria: { steps: 75 }
        },
        {
          tierId: 'fashionista-gold',
          tierName: 'Gold',
          description: '250 Wearables purchased',
          criteria: { steps: 250 }
        },
        {
          tierId: 'fashionista-platinum',
          tierName: 'Platinum',
          description: '500 Wearables purchased',
          criteria: { steps: 500 }
        },
        {
          tierId: 'fashionista-diamond',
          tierName: 'Diamond',
          description: '1,500 Wearables purchased',
          criteria: { steps: 1500 }
        }
      ]
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
      tiers: [
        {
          tierId: 'event-enthusiast-starter',
          tierName: 'Starter',
          description: '1 Events attended (for at least 5 min)',
          criteria: { steps: 1 }
        },
        {
          tierId: 'event-enthusiast-bronze',
          tierName: 'Bronze',
          description: '50 Events attended (for at least 5 min)',
          criteria: { steps: 50 }
        },
        {
          tierId: 'event-enthusiast-silver',
          tierName: 'Silver',
          description: '100 Events attended (for at least 5 min)',
          criteria: { steps: 100 }
        },
        {
          tierId: 'event-enthusiast-gold',
          tierName: 'Gold',
          description: '500 Events attended (for at least 5 min)',
          criteria: { steps: 500 }
        },
        {
          tierId: 'event-enthusiast-platinum',
          tierName: 'Platinum',
          description: '1000 Events attended (for at least 5 min)',
          criteria: { steps: 1000 }
        },
        {
          tierId: 'event-enthusiast-diamond',
          tierName: 'Diamond',
          description: '2000 Events attended (for at least 5 min)',
          criteria: { steps: 2000 }
        }
      ]
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
      tiers: [
        {
          tierId: 'moves-master-starter',
          tierName: 'Starter',
          description: 'Emoted 100 times (max 1/min)',
          criteria: { steps: 100 }
        },
        {
          tierId: 'moves-master-bronze',
          tierName: 'Bronze',
          description: 'Emoted 1,000 times (max 1/min)',
          criteria: { steps: 1000 }
        },
        {
          tierId: 'moves-master-silver',
          tierName: 'Silver',
          description: 'Emoted 5,000 times (max 1/min)',
          criteria: { steps: 5000 }
        },
        {
          tierId: 'moves-master-gold',
          tierName: 'Gold',
          description: 'Emoted 10,000 times (max 1/min)',
          criteria: { steps: 10000 }
        },
        {
          tierId: 'moves-master-platinum',
          tierName: 'Platinum',
          description: 'Emoted 100,000 times (max 1/min)',
          criteria: { steps: 100000 }
        },
        {
          tierId: 'moves-master-diamond',
          tierName: 'Diamond',
          description: 'Emoted 500,000 times (max 1/min)',
          criteria: { steps: 500000 }
        }
      ]
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
      tiers: [
        {
          tierId: 'social-butterfly-starter',
          tierName: 'Starter',
          description: '1 Profile viewed',
          criteria: { steps: 1 }
        },
        {
          tierId: 'social-butterfly-bronze',
          tierName: 'Bronze',
          description: '50 Profiles viewed',
          criteria: { steps: 50 }
        },
        {
          tierId: 'social-butterfly-silver',
          tierName: 'Silver',
          description: '100 Profiles viewed',
          criteria: { steps: 100 }
        },
        {
          tierId: 'social-butterfly-gold',
          tierName: 'Gold',
          description: '250 Profiles viewed',
          criteria: { steps: 250 }
        },
        {
          tierId: 'social-butterfly-platinum',
          tierName: 'Platinum',
          description: '500 Profiles viewed',
          criteria: { steps: 500 }
        },
        {
          tierId: 'social-butterfly-diamond',
          tierName: 'Diamond',
          description: '1,000 Profiles viewed',
          criteria: { steps: 1000 }
        }
      ]
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
      tiers: [
        {
          tierId: 'walkabout-wanderer-starter',
          tierName: 'Starter',
          description: '10k Steps walked in Decentraland',
          criteria: { steps: 10000 }
        },
        {
          tierId: 'walkabout-wanderer-bronze',
          tierName: 'Bronze',
          description: '40k Steps walked in Decentraland',
          criteria: { steps: 40000 }
        },
        {
          tierId: 'walkabout-wanderer-silver',
          tierName: 'Silver',
          description: '150k Steps walked in Decentraland',
          criteria: { steps: 150000 }
        },
        {
          tierId: 'walkabout-wanderer-gold',
          tierName: 'Gold',
          description: '600k Steps walked in Decentraland',
          criteria: { steps: 600000 }
        },
        {
          tierId: 'walkabout-wanderer-platinum',
          tierName: 'Platinum',
          description: '2.5M Steps walked in Decentraland',
          criteria: { steps: 2500000 }
        },
        {
          tierId: 'walkabout-wanderer-diamond',
          tierName: 'Diamond',
          description: '10M Steps walked in Decentraland',
          criteria: { steps: 10000000 }
        }
      ]
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
      tiers: [
        {
          tierId: 'emote-creator-starter',
          tierName: 'Starter',
          description: '1 Emote published',
          criteria: { steps: 1 }
        },
        {
          tierId: 'emote-creator-bronze',
          tierName: 'Bronze',
          description: '5 Emotes published',
          criteria: { steps: 5 }
        },
        {
          tierId: 'emote-creator-silver',
          tierName: 'Silver',
          description: '10 Emotes published',
          criteria: { steps: 10 }
        },
        {
          tierId: 'emote-creator-gold',
          tierName: 'Gold',
          description: '20 Emotes published',
          criteria: { steps: 20 }
        },
        {
          tierId: 'emote-creator-platinum',
          tierName: 'Platinum',
          description: '50 Emotes published',
          criteria: { steps: 50 }
        },
        {
          tierId: 'emote-creator-diamond',
          tierName: 'Diamond',
          description: '100 Emotes published',
          criteria: { steps: 100 }
        }
      ]
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
      tiers: [
        {
          tierId: 'wearable-designer-starter',
          tierName: 'Starter',
          description: '1 Wearable published',
          criteria: { steps: 1 }
        },
        {
          tierId: 'wearable-designer-bronze',
          tierName: 'Bronze',
          description: '5 Wearables published',
          criteria: { steps: 5 }
        },
        {
          tierId: 'wearable-designer-silver',
          tierName: 'Silver',
          description: '25 Wearables published',
          criteria: { steps: 25 }
        },
        {
          tierId: 'wearable-designer-gold',
          tierName: 'Gold',
          description: '50 Wearables published',
          criteria: { steps: 50 }
        },
        {
          tierId: 'wearable-designer-platinum',
          tierName: 'Platinum',
          description: '175 Wearables published',
          criteria: { steps: 175 }
        },
        {
          tierId: 'wearable-designer-diamond',
          tierName: 'Diamond',
          description: '350 Wearables published',
          criteria: { steps: 350 }
        }
      ]
    }
  ]
])

export { badges }
