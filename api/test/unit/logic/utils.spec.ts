import { Badge, BadgeId, UserBadge } from '@badges/common'
import {
  parseBadgeId,
  getCompletedAt,
  getUniqueSortedItems,
  getBadgeAchievedTiers,
  tryToGetAchievedTiers,
  tryToGetCompletedAt,
  validateUserProgress
} from '../../../src/logic/utils'
import { TierId } from '@badges/common/src/types/tiers'

describe('Utils', () => {
  describe('when parsing a badge id', () => {
    it('should return the badge id correctly typed when it exists', () => {
      const id = BadgeId.EMOTIONISTA
      const result = parseBadgeId(id)
      expect(result).toBe(id)
    })

    it('should return undefined when the badge id does not exist', () => {
      const result = parseBadgeId('non-existent-badge-id')
      expect(result).toBeUndefined()
    })
  })

  describe('when getting the completed at timestamp', () => {
    it('should return alreadyCompletedAt when it is defined', () => {
      const userProgress = { completed_at: 1620000000000 } as UserBadge
      const result = getCompletedAt(userProgress)
      expect(result).toBe(1620000000000)
    })

    it('should return lastTierAchievedAt when the user has not completed the badge yet', () => {
      const userProgress = { completed_at: undefined } as UserBadge
      const result = getCompletedAt(userProgress, 1630000000000)
      expect(result).toBe(1630000000000)
    })

    it('should return Date.now() when both completedAt and lastTierAchievedAt are undefined', () => {
      const userProgress = { completed_at: undefined } as UserBadge
      const now = Date.now()
      const result = getCompletedAt(userProgress)
      expect(result).toBeGreaterThanOrEqual(now)
    })
  })

  describe('when getting unique sorted items', () => {
    it('should return items sorted by timestamp', () => {
      const items = [
        { id: 'a', timestamp: 2 },
        { id: 'b', timestamp: 1 }
      ]
      const result = getUniqueSortedItems(items, 'id', 'timestamp')
      expect(result).toEqual([
        { id: 'b', timestamp: 1 },
        { id: 'a', timestamp: 2 }
      ])
    })

    it('should remove duplicate items and keep the latest timestamp', () => {
      const items = [
        { id: 'a', timestamp: 1 },
        { id: 'a', timestamp: 3 },
        { id: 'b', timestamp: 2 }
      ]
      const result = getUniqueSortedItems(items, 'id', 'timestamp')
      expect(result).toEqual([
        { id: 'b', timestamp: 2 },
        { id: 'a', timestamp: 3 }
      ])
    })
  })

  describe('when getting badge achieved tiers', () => {
    it('should return achieved tiers based on user progress steps', () => {
      const badge = {
        tiers: [
          { tierId: 'tier1' as TierId, criteria: { steps: 1 } },
          { tierId: 'tier2' as TierId, criteria: { steps: 5 } }
        ]
      } as Badge

      const userProgress = { progress: { steps: 5 } } as UserBadge
      const result = getBadgeAchievedTiers(badge, userProgress)
      expect(result).toEqual([
        { tierId: 'tier1' as TierId, criteria: { steps: 1 } },
        { tierId: 'tier2' as TierId, criteria: { steps: 5 } }
      ])
    })

    it('should return an empty array if no tiers are achieved', () => {
      const badge = {
        tiers: [
          { tierId: 'tier1' as TierId, criteria: { steps: 10 } },
          { tierId: 'tier2' as TierId, criteria: { steps: 20 } }
        ]
      } as Badge

      const userProgress = { progress: { steps: 5 } } as UserBadge
      const result = getBadgeAchievedTiers(badge, userProgress)
      expect(result).toEqual([])
    })
  })

  describe('when trying to get the achieved tiers', () => {
    it('should return achieved tiers with completed_at timestamps', () => {
      const badge = {
        tiers: [
          { tierId: 'tier1' as TierId, criteria: { steps: 1 } },
          { tierId: 'tier2' as TierId, criteria: { steps: 5 } }
        ]
      } as Badge

      const userProgress = {
        progress: { steps: 5 },
        achieved_tiers: [
          { tier_id: 'tier1' as TierId, completed_at: 10000 },
          { tier_id: 'tier2' as TierId, completed_at: 50000 }
        ]
      } as UserBadge

      const sortedItems = Array.from({
        length: 5
      }).map((_, index) => ({ id: `item${index}`, timestamp: (index + 1) * 1000 }))

      const result = tryToGetAchievedTiers(badge, userProgress, sortedItems, 'timestamp')
      expect(result).toEqual([
        { tier_id: 'tier1' as TierId, completed_at: 1000 },
        { tier_id: 'tier2' as TierId, completed_at: 5000 }
      ])
    })

    it('should throw an error if no item found for a tier', () => {
      const badge = {
        tiers: [{ tierId: 'tier1' as TierId, criteria: { steps: 1 } }]
      } as Badge

      const userProgress = { progress: { steps: 1 }, achieved_tiers: [] } as UserBadge

      const sortedItems = []

      expect(() => tryToGetAchievedTiers(badge, userProgress, sortedItems, 'timestamp')).toThrow(Error)
    })
  })

  describe('when trying to get the completed at timestamp', () => {
    it('should return undefined when the user have not achieved all the tiers', () => {
      const badge = {
        tiers: [
          { tierId: 'tier1' as TierId, criteria: { steps: 1 } },
          { tierId: 'tier2' as TierId, criteria: { steps: 5 } }
        ]
      } as Badge

      const userProgress = { achieved_tiers: [{ tier_id: 'tier2' as TierId, completed_at: 2000 }] } as UserBadge

      const sortedItems = [{ timestamp: 1000 }, { timestamp: 2000 }]

      const result = tryToGetCompletedAt(badge, userProgress, sortedItems, 'timestamp')
      expect(result).toBeUndefined()
    })

    it('should return undefined if no tiers were achieved', () => {
      const badge = { tiers: [] } as Badge
      const userProgress = { achieved_tiers: [] } as UserBadge

      const result = tryToGetCompletedAt(badge, userProgress, [], 'timestamp')
      expect(result).toBeUndefined()
    })

    it('should return the completed at timestamp from the last tier', () => {
      const badge = {
        tiers: [
          { tierId: 'tier1' as TierId, criteria: { steps: 1 } },
          { tierId: 'tier2' as TierId, criteria: { steps: 5 } }
        ]
      } as Badge

      const userProgress = {
        achieved_tiers: badge.tiers.map((tier, i) => ({
          tier_id: tier.tierId,
          completed_at: 1000 * (i + 1)
        }))
      } as UserBadge

      const sortedItems = Array.from({
        length: 5
      }).map((_, index) => ({ id: `item${index}`, timestamp: (index + 1) * 1000 }))

      const result = tryToGetCompletedAt(badge, userProgress, sortedItems, 'timestamp')
      expect(result).toBe(5000)
    })

    it('should throw an error if the item for the last tier is not found', () => {
      const badge = {
        tiers: [{ tierId: 'tier1' as TierId, criteria: { steps: 1 } }]
      } as Badge

      const userProgress = {
        progress: { steps: 1 },
        achieved_tiers: [{ tier_id: 'tier1' as TierId, completed_at: 1000 }]
      } as UserBadge

      const sortedItems = []

      expect(() => tryToGetCompletedAt(badge, userProgress, sortedItems, 'timestamp')).toThrow(Error)
    })
  })

  describe('when validating the user progress', () => {
    it('should return ok when no errors nor mismatches found', () => {
      const badge = {
        tiers: [
          { tierId: 'tier1' as TierId, criteria: { steps: 1 } },
          { tierId: 'tier2' as TierId, criteria: { steps: 5 } }
        ]
      } as Badge

      const userProgress = {
        achieved_tiers: [
          { tier_id: 'tier1' as TierId, completed_at: 1000 },
          { tier_id: 'tier2' as TierId, completed_at: 2000 }
        ],
        progress: { steps: 5 },
        completed_at: 2000
      } as UserBadge

      const result = validateUserProgress(userProgress, badge)
      expect(result).toEqual({ ok: true, errors: [] })
    })

    it('should return an error when the badge is undefined', () => {
      const userProgress = {
        achieved_tiers: null,
        progress: {}
      } as UserBadge

      const result = validateUserProgress(userProgress, undefined)
      expect(result.ok).toBe(false)
      expect(result.errors).toHaveLength(1)
    })

    it('should return an error when user completed the badge and there is a mismatch between the achieved tiers', () => {
      const userProgress = {
        achieved_tiers: [],
        completed_at: 2000
      } as UserBadge

      const badge = {
        tiers: [{ tierId: 'tier1' as TierId, criteria: { steps: 1 } }]
      } as Badge

      const result = validateUserProgress(userProgress, badge)
      expect(result.ok).toBe(false)
      expect(result.errors).toHaveLength(1)
    })

    it('should return an error when user completed a badge without tiers and there is a mismatch within the progress and the criteria', () => {
      const userProgress = {
        progress: { steps: 2 },
        completed_at: 2000
      } as UserBadge

      const badge = {
        criteria: { steps: 1 }
      } as Badge

      const result = validateUserProgress(userProgress, badge)
      expect(result.ok).toBe(false)
      expect(result.errors).toHaveLength(1)
    })

    it('should return an error when user achieved a non existent tier', () => {
      const userProgress = {
        achieved_tiers: [{ tier_id: 'non-existent-tier' as TierId, completed_at: 1000 }]
      } as UserBadge

      const badge = {
        tiers: [{ tierId: 'tier1' as TierId, criteria: { steps: 1 } }]
      } as Badge

      const result = validateUserProgress(userProgress, badge)
      expect(result.ok).toBe(false)
      expect(result.errors).toHaveLength(1)
    })

    it('should return an error when there is a mismatch between the tier criteria and the user progress', () => {
      const userProgress = {
        achieved_tiers: [
          { tier_id: 'tier1' as TierId, completed_at: 1000 },
          { tier_id: 'tier2' as TierId, completed_at: 2000 },
          { tier_id: 'tier3' as TierId, completed_at: 3000 }
        ],
        progress: { steps: 5 }
      } as UserBadge

      const badge = {
        tiers: [
          { tierId: 'tier1' as TierId, criteria: { steps: 1 } },
          { tierId: 'tier2' as TierId, criteria: { steps: 5 } },
          { tierId: 'tier3' as TierId, criteria: { steps: 10 } }
        ]
      } as Badge

      const result = validateUserProgress(userProgress, badge)
      expect(result.ok).toBe(false)
      expect(result.errors).toHaveLength(1)
    })

    it('should return an error when there is a mismatch between the completion time of two contiguous tiers', () => {
      const userProgress = {
        achieved_tiers: [
          { tier_id: 'tier1' as TierId, completed_at: 1000 },
          { tier_id: 'tier2' as TierId, completed_at: 500 }
        ],
        progress: { steps: 5 }
      } as UserBadge

      const badge = {
        tiers: [
          { tierId: 'tier1' as TierId, criteria: { steps: 1 } },
          { tierId: 'tier2' as TierId, criteria: { steps: 5 } }
        ]
      } as Badge

      const result = validateUserProgress(userProgress, badge)
      expect(result.ok).toBe(false)
      expect(result.errors).toHaveLength(1)
    })
  })
})
