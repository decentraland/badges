import { BadgeId, badges, createBadgeStorage, IBadgeStorage } from '../../../src'

describe('Badge Storage', () => {
  let badgeStorage: IBadgeStorage

  beforeEach(async () => {
    badgeStorage = await createBadgeStorage({
      config: {
        requireString: jest.fn(),
        getString: jest.fn(),
        getNumber: jest.fn(),
        requireNumber: jest.fn()
      }
    })
  })

  it('should return the badges', async () => {
    const aggregatedBadges = badgeStorage.getBadges()
    expect(aggregatedBadges.size).toEqual(badges.size)
  })

  it('should return a badge', async () => {
    const badgeId = BadgeId.DECENTRALAND_CITIZEN
    const badge = badgeStorage.getBadge(badgeId)
    const expectedBadge = badgeStorage.getBadge(badgeId)
    expect(badge).toEqual(expectedBadge)
  })

  it('should throw an error when the badge is not found', async () => {
    const badgeId = 'non-existing-badge' as BadgeId
    expect(() => badgeStorage.getBadge(badgeId)).toThrow(`Badge with id ${badgeId} not found`)
  })
})
