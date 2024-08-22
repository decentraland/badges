export type UserBadge = {
  user_address: string
  badge_id: BadgeId
  progress: any
  achieved_tiers?: { tier_id: string; completed_at: number }[]
  completed_at?: number
  updated_at: number
}

export type Badge = {
  id: BadgeId
  name: string
  category: string
  description: string
  criteria?: { steps: number } & any
  image?: string
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
  image: string
}

export enum BadgeId {
  COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION = 'completed-store-and-submitted-one-collection',
  REGALLY_RARE = 'regally-rare',
  EPIC_ENSEMBLE = 'epic-ensemble',
  LEGENDARY_LOOK = 'legendary-look',
  EXOTIC_ELEGANCE = 'exotic-elegance',
  MYTHIC_MODEL = 'mythic-model',
  UNIQUE_UNICORN = 'unique-unicorn',
  DECENTRALAND_CITIZEN = 'decentraland-citizen',
  TRAVELER = 'traveler'
}

export enum BadgeCategory {
  EXPLORER = 'Explorer',
  COLLECTOR = 'Collector',
  CREATOR = 'Creator',
  SOCIALIZER = 'Socializer',
  BUILDER = 'Builder'
}
