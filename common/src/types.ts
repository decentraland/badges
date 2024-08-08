export type BadgeTier = {
  tierId: number
  /**
   * The tier name
   * e.g. "Bronze", "Silver", "Gold"
   * @type {string}
   */
  tierName: string
  criteria: any // TODO: define a type that satisfies all type of tiered criteria
  description: string
  image: string
}

export type Badge = {
  id: BadgeId
  name: string
  description: string
  image?: string
  tier?: BadgeTier
}

export type UserBadge = {
  user_address: string
  badge_id: BadgeId
  progress: any
  completed_at?: number
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
