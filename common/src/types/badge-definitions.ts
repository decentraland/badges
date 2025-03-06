import { TierId } from './tiers'

export type UserBadge = {
  user_address: string
  badge_id: BadgeId
  progress: any
  achieved_tiers?: {
    tier_id: TierId
    completed_at: number
  }[]
  completed_at?: number
  updated_at?: number
}

type BadgeAssets = {
  '2d': {
    normal: string
  }
  '3d': {
    normal: string
    hrm: string
    basecolor: string
  }
}

export type Badge = {
  id: BadgeId
  name: string
  category: string
  description: string
  criteria?: { steps: number } & any
  assets?: BadgeAssets
  tiers?: BadgeTier[]
}

export type BadgeTier = {
  tierId: TierId
  /**
   * The tier name
   * e.g. "Bronze", "Silver", "Gold"
   * @type {string}
   */
  tierName: string
  criteria?: { steps: number } & any
  description: string
  assets?: BadgeAssets
}

export enum BadgeId {
  OPEN_FOR_BUSINESS = 'open_for_business',
  REGALLY_RARE = 'regally_rare',
  EPIC_ENSEMBLE = 'epic_ensemble',
  LEGENDARY_LOOK = 'legendary_look',
  EXOTIC_ELEGANCE = 'exotic_elegance',
  MYTHIC_MODEL = 'mythic_model',
  UNIQUE_UNICORN = 'unique_unicorn',
  DECENTRALAND_CITIZEN = 'dclcitizen',
  TRAVELER = 'traveler',
  PROFILE_PRO = 'profile_pro',
  EMOTIONISTA = 'emotionista',
  FASHIONISTA = 'fashionista',
  EVENT_ENTHUSIAST = 'event_enthusiast',
  MOVES_MASTER = 'moves_master',
  SOCIAL_BUTTERFLY = 'social_butterfly',
  VERTICAL_VOYAGER = 'vertical_voyager',
  WALKABOUT_WANDERER = 'walkabout_wanderer',
  LAND_ARCHITECT = 'land_architect',
  EMOTE_CREATOR = 'emote_creator',
  WEARABLE_DESIGNER = 'wearable_designer',
  MUSIC_FESTIVAL_2024 = 'music_festival_2024',
  FASHION_WEEK_2025 = 'fashion_week_2025'
}

export enum BadgeCategory {
  EXPLORER = 'Explorer',
  COLLECTOR = 'Collector',
  CREATOR = 'Creator',
  SOCIALIZER = 'Socializer',
  BUILDER = 'Builder'
}
