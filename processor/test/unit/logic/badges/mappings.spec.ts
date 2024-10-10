import { BadgeId, badges } from '@badges/common'

describe('Badges definitions', () => {
  it('should have a badge id for each badge', () => {
    const badgeIds = Object.values(BadgeId)
    expect(badgeIds.length).toBe(badges.size)
  })
})
