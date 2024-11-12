enum TierBadge {
  TRAVELER = 'traveler',
  EMOTIONISTA = 'emotionista',
  FASHIONISTA = 'fashionista',
  EVENT_ENTHUSIAST = 'event-enthusiast',
  MOVES_MASTER = 'moves-master',
  SOCIAL_BUTTERFLY = 'social-butterfly',
  WALKABOUT_WANDERER = 'walkabout-wanderer',
  EMOTE_CREATOR = 'emote-creator',
  WEARABLE_DESIGNER = 'wearable-designer'
}

enum TierLevel {
  STARTER = 'starter',
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond'
}

enum TierEvent {
  EXAMPLE = 'example'
}

enum TierDay {
  ONE = 'one',
  TWO = 'two',
  THREE = 'three',
  FOUR = 'four',
  FIVE = 'five',
  SIX = 'six',
  SEVEN = 'seven',
  EIGHT = 'eight',
  NINE = 'nine'
}

type TierBadgeLevelType = `${TierBadge}-${TierLevel}`

type TierEventType = `${TierEvent}-day-${TierDay}`

type TierId = TierBadgeLevelType | TierEventType

export { TierBadge, TierLevel, TierDay, TierEvent, TierBadgeLevelType, TierEventType, TierId }
