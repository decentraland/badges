export type UserBadge = {
  user_address: string
  badge_id: BadgeId
  progress: any
  achieved_tiers?: { tier_id: string; completed_at: number }[]
  completed_at?: number
  updated_at: number
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
  tierId: string
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
  COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION = 'completed-store-and-submitted-one-collection',
  REGALLY_RARE = 'regally_rare',
  EPIC_ENSEMBLE = 'epic_ensemble',
  LEGENDARY_LOOK = 'legendary_look',
  EXOTIC_ELEGANCE = 'exotic_elegance',
  MYTHIC_MODEL = 'mythic_model',
  UNIQUE_UNICORN = 'unique_unicorn',
  DECENTRALAND_CITIZEN = 'dclcitizen',
  TRAVELER = 'traveler'
}

export enum BadgeCategory {
  EXPLORER = 'Explorer',
  COLLECTOR = 'Collector',
  CREATOR = 'Creator',
  SOCIALIZER = 'Socializer',
  BUILDER = 'Builder'
}
