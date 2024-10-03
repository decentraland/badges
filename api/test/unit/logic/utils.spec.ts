import { BadgeId } from '@badges/common'
import { parseBadgeId } from '../../../src/logic/utils'

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
})
