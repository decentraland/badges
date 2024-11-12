import { TierDay, TierEvent, TierId, TierBadge, TierLevel } from '../../../src/types/tiers'
import {
  getOrdinalForTierDay,
  createEventBadgeTiers,
  createLevelBadgeTiers,
  capitalize
} from '../../../src/types/utils'

describe('types utils', () => {
  describe('get the position of the enum', () => {
    it('should return the correct position of the enum key', () => {
      expect(getOrdinalForTierDay(TierDay.ONE)).toBe(1)
      expect(getOrdinalForTierDay(TierDay.FIVE)).toBe(5)
    })
  })

  describe('create tiers for events with type BadgeTiers', () => {
    it('should create the correct number of badge tiers for the given event and days', () => {
      const result = createEventBadgeTiers(TierEvent.EXAMPLE, TierDay.FOUR)

      expect(result).toHaveLength(4)
      result.forEach((tier, index) => {
        expect(tier).toEqual({
          tierId: `${TierEvent.EXAMPLE}-day-${TierDay.FOUR}` as TierId,
          tierName: `${TierDay.FOUR} day`,
          description: `${TierDay.FOUR} day in the ${TierEvent.EXAMPLE.split('-').join(' ')}`,
          criteria: { steps: index + 1 }
        })
      })
    })

    it('should handle single-day events', () => {
      const result = createEventBadgeTiers(TierEvent.EXAMPLE, TierDay.ONE)
      expect(result).toHaveLength(1)
      expect(result[0].criteria.steps).toBe(1)
    })
  })

  describe('capitalize', () => {
    it('should capitalize each word in a hyphenated string', () => {
      expect(capitalize('music-festival')).toBe('Music Festival')
      expect(capitalize('event-enthusiast')).toBe('Event Enthusiast')
    })

    it('should handle single words correctly', () => {
      expect(capitalize('starter')).toBe('Starter')
    })

    it('should handle empty strings', () => {
      expect(capitalize('')).toBe('')
    })
  })

  describe('create tiers with levels type BadgeTiers', () => {
    it('should create the correct badge tiers for levels', () => {
      const tierBadge = TierBadge.TRAVELER
      const steps = [10, 20, 30, 40, 50, 60]
      const descriptions = [
        'Starter Level',
        'Bronze Level',
        'Silver Level',
        'Gold Level',
        'Platinum Level',
        'Diamond Level'
      ]

      const result = createLevelBadgeTiers(tierBadge, steps, descriptions)
      const levels = Object.values(TierLevel)

      expect(result).toHaveLength(levels.length)

      result.forEach((tier, index) => {
        expect(tier).toEqual({
          tierId: `${tierBadge}-${levels[index]}` as TierId,
          tierName: capitalize(levels[index]),
          description: descriptions[index],
          criteria: { steps: steps[index] }
        })
      })
    })

    it('should throw an error if the steps array length does not match the levels length', () => {
      const tierBadge = TierBadge.SOCIAL_BUTTERFLY
      const steps = [10, 20]
      const descriptions = ['Starter Level', 'Bronze Level']

      expect(() => createLevelBadgeTiers(tierBadge, steps, descriptions)).toThrow(
        'The number of steps must match the number of levels'
      )
    })
  })
})
