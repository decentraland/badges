import { Badge, BadgeCategory, BadgeId } from '.'
import {
  TierEmoteCreator,
  TierEmotionista,
  TierEventEnthusiast,
  TierFashionista,
  TierMovesMaster,
  TierMusicFestival,
  TierSocialButterfly,
  TierTraveler,
  TierWalkaboutWanderer,
  TierWearableDesigner
} from './tiers'

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
      tiers: [
        {
          tierId: TierTraveler.STARTER,
          tierName: 'Starter',
          description: '1 Genesis City scene explored (for at least 1 min)',
          criteria: { steps: 1 }
        },
        {
          tierId: TierTraveler.BRONZE,
          tierName: 'Bronze',
          description: '50 Genesis City scenes explored (for at least 1 min)',
          criteria: { steps: 50 }
        },
        {
          tierId: TierTraveler.SILVER,
          tierName: 'Silver',
          description: '250 Genesis City scenes explored (for at least 1 min)',
          criteria: { steps: 250 }
        },
        {
          tierId: TierTraveler.GOLD,
          tierName: 'Gold',
          description: '1,000 Genesis City scenes explored (for at least 1 min)',
          criteria: { steps: 1000 }
        },
        {
          tierId: TierTraveler.PLATINUM,
          tierName: 'Platinum',
          description: '2,500 Genesis City scenes explored (for at least 1 min)',
          criteria: { steps: 2500 }
        },
        {
          tierId: TierTraveler.DIAMOND,
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
          tierId: TierEmotionista.STARTER,
          tierName: 'Starter',
          description: '1 Emote purchased',
          criteria: { steps: 1 }
        },
        {
          tierId: TierEmotionista.BRONZE,
          tierName: 'Bronze',
          description: '10 Emotes purchased',
          criteria: { steps: 10 }
        },
        {
          tierId: TierEmotionista.SILVER,
          tierName: 'Silver',
          description: '25 Emotes purchased',
          criteria: { steps: 25 }
        },
        {
          tierId: TierEmotionista.GOLD,
          tierName: 'Gold',
          description: '50 Emotes purchased',
          criteria: { steps: 50 }
        },
        {
          tierId: TierEmotionista.PLATINUM,
          tierName: 'Platinum',
          description: '150 Emotes purchased',
          criteria: { steps: 150 }
        },
        {
          tierId: TierEmotionista.DIAMOND,
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
          tierId: TierFashionista.STARTER,
          tierName: 'Starter',
          description: '1 Wearable purchased',
          criteria: { steps: 1 }
        },
        {
          tierId: TierFashionista.BRONZE,
          tierName: 'Bronze',
          description: '25 Wearables purchased',
          criteria: { steps: 25 }
        },
        {
          tierId: TierFashionista.SILVER,
          tierName: 'Silver',
          description: '75 Wearables purchased',
          criteria: { steps: 75 }
        },
        {
          tierId: TierFashionista.GOLD,
          tierName: 'Gold',
          description: '250 Wearables purchased',
          criteria: { steps: 250 }
        },
        {
          tierId: TierFashionista.PLATINUM,
          tierName: 'Platinum',
          description: '500 Wearables purchased',
          criteria: { steps: 500 }
        },
        {
          tierId: TierFashionista.DIAMOND,
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
          tierId: TierEventEnthusiast.STARTER,
          tierName: 'Starter',
          description: '1 Events attended (for at least 5 min)',
          criteria: { steps: 1 }
        },
        {
          tierId: TierEventEnthusiast.BRONZE,
          tierName: 'Bronze',
          description: '50 Events attended (for at least 5 min)',
          criteria: { steps: 50 }
        },
        {
          tierId: TierEventEnthusiast.SILVER,
          tierName: 'Silver',
          description: '100 Events attended (for at least 5 min)',
          criteria: { steps: 100 }
        },
        {
          tierId: TierEventEnthusiast.GOLD,
          tierName: 'Gold',
          description: '500 Events attended (for at least 5 min)',
          criteria: { steps: 500 }
        },
        {
          tierId: TierEventEnthusiast.PLATINUM,
          tierName: 'Platinum',
          description: '1000 Events attended (for at least 5 min)',
          criteria: { steps: 1000 }
        },
        {
          tierId: TierEventEnthusiast.DIAMOND,
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
          tierId: TierMovesMaster.STARTER,
          tierName: 'Starter',
          description: 'Emoted 100 times (max 1/min)',
          criteria: { steps: 100 }
        },
        {
          tierId: TierMovesMaster.BRONZE,
          tierName: 'Bronze',
          description: 'Emoted 1,000 times (max 1/min)',
          criteria: { steps: 1000 }
        },
        {
          tierId: TierMovesMaster.SILVER,
          tierName: 'Silver',
          description: 'Emoted 5,000 times (max 1/min)',
          criteria: { steps: 5000 }
        },
        {
          tierId: TierMovesMaster.GOLD,
          tierName: 'Gold',
          description: 'Emoted 10,000 times (max 1/min)',
          criteria: { steps: 10000 }
        },
        {
          tierId: TierMovesMaster.PLATINUM,
          tierName: 'Platinum',
          description: 'Emoted 100,000 times (max 1/min)',
          criteria: { steps: 100000 }
        },
        {
          tierId: TierMovesMaster.DIAMOND,
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
          tierId: TierSocialButterfly.STARTER,
          tierName: 'Starter',
          description: '1 Profile viewed',
          criteria: { steps: 1 }
        },
        {
          tierId: TierSocialButterfly.BRONZE,
          tierName: 'Bronze',
          description: '50 Profiles viewed',
          criteria: { steps: 50 }
        },
        {
          tierId: TierSocialButterfly.SILVER,
          tierName: 'Silver',
          description: '100 Profiles viewed',
          criteria: { steps: 100 }
        },
        {
          tierId: TierSocialButterfly.GOLD,
          tierName: 'Gold',
          description: '250 Profiles viewed',
          criteria: { steps: 250 }
        },
        {
          tierId: TierSocialButterfly.PLATINUM,
          tierName: 'Platinum',
          description: '500 Profiles viewed',
          criteria: { steps: 500 }
        },
        {
          tierId: TierSocialButterfly.DIAMOND,
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
          tierId: TierWalkaboutWanderer.STARTER,
          tierName: 'Starter',
          description: '10k Steps walked in Decentraland',
          criteria: { steps: 10000 }
        },
        {
          tierId: TierWalkaboutWanderer.BRONZE,
          tierName: 'Bronze',
          description: '40k Steps walked in Decentraland',
          criteria: { steps: 40000 }
        },
        {
          tierId: TierWalkaboutWanderer.SILVER,
          tierName: 'Silver',
          description: '150k Steps walked in Decentraland',
          criteria: { steps: 150000 }
        },
        {
          tierId: TierWalkaboutWanderer.GOLD,
          tierName: 'Gold',
          description: '600k Steps walked in Decentraland',
          criteria: { steps: 600000 }
        },
        {
          tierId: TierWalkaboutWanderer.PLATINUM,
          tierName: 'Platinum',
          description: '2.5M Steps walked in Decentraland',
          criteria: { steps: 2500000 }
        },
        {
          tierId: TierWalkaboutWanderer.DIAMOND,
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
          tierId: TierEmoteCreator.STARTER,
          tierName: 'Starter',
          description: '1 Emote published',
          criteria: { steps: 1 }
        },
        {
          tierId: TierEmoteCreator.BRONZE,
          tierName: 'Bronze',
          description: '5 Emotes published',
          criteria: { steps: 5 }
        },
        {
          tierId: TierEmoteCreator.SILVER,
          tierName: 'Silver',
          description: '10 Emotes published',
          criteria: { steps: 10 }
        },
        {
          tierId: TierEmoteCreator.GOLD,
          tierName: 'Gold',
          description: '20 Emotes published',
          criteria: { steps: 20 }
        },
        {
          tierId: TierEmoteCreator.PLATINUM,
          tierName: 'Platinum',
          description: '50 Emotes published',
          criteria: { steps: 50 }
        },
        {
          tierId: TierEmoteCreator.DIAMOND,
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
          tierId: TierWearableDesigner.STARTER,
          tierName: 'Starter',
          description: '1 Wearable published',
          criteria: { steps: 1 }
        },
        {
          tierId: TierWearableDesigner.BRONZE,
          tierName: 'Bronze',
          description: '5 Wearables published',
          criteria: { steps: 5 }
        },
        {
          tierId: TierWearableDesigner.SILVER,
          tierName: 'Silver',
          description: '25 Wearables published',
          criteria: { steps: 25 }
        },
        {
          tierId: TierWearableDesigner.GOLD,
          tierName: 'Gold',
          description: '50 Wearables published',
          criteria: { steps: 50 }
        },
        {
          tierId: TierWearableDesigner.PLATINUM,
          tierName: 'Platinum',
          description: '175 Wearables published',
          criteria: { steps: 175 }
        },
        {
          tierId: TierWearableDesigner.DIAMOND,
          tierName: 'Diamond',
          description: '350 Wearables published',
          criteria: { steps: 350 }
        }
      ]
    }
  ],
  [
    BadgeId.MUSIC_FESTIVAL,
    {
      id: BadgeId.MUSIC_FESTIVAL,
      name: 'Music Festival',
      category: BadgeCategory.EXPLORER,
      description: 'Days in events',
      tiers: [
        {
          tierId: TierMusicFestival.FIRST_DAY,
          tierName: 'First Day',
          description: 'One day in the music festival',
          criteria: { steps: 1 }
        },
        {
          tierId: TierMusicFestival.SECOND_DAY,
          tierName: 'Second Day',
          description: 'Two days in the music festival',
          criteria: { steps: 2 }
        },
        {
          tierId: TierMusicFestival.THIRD_DAY,
          tierName: 'Third Day',
          description: 'Three days in the music festival',
          criteria: { steps: 3 }
        },
        {
          tierId: TierMusicFestival.FINAL_DAY,
          tierName: 'Four Day',
          description: 'Four days in the music festival',
          criteria: { steps: 4 }
        }
      ]
    }
  ]
])

export { badges }
