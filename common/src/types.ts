export type Badge = {
  id: BadgeId
  name: string
  description: string
  criteria: any
}

export type UserBadge = {
  user_address: string
  badge_id: BadgeId
  progress: any
  awarded_at?: number
}

export enum BadgeId {
  COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION = 'completed-store-and-submitted-one-collection',
  REGALLY_RARE = 'regally-rare'
}
