import { Badge, BadgeId, badges } from '../../../src'
import { aggregateAssetsFor } from '../../../src/utils/assets-aggregator'

describe('Assets Aggregator', () => {
  let aggregatedBadges: Map<BadgeId, Badge>
  const CDN_URL = 'https://cdn.decentraland.org/badges'

  describe('badges with tiers', () => {
    const badgeId = BadgeId.FASHIONISTA

    beforeEach(() => {
      const badgesWithTiers = new Map<BadgeId, Badge>([[badgeId, badges.get(badgeId)]])
      aggregatedBadges = aggregateAssetsFor(badgesWithTiers, CDN_URL)
    })

    it('should return the correct assets for each tier', () => {
      const badge = aggregatedBadges.get(badgeId)!

      badge.tiers!.forEach((tier) => {
        expect(tier.assets).toEqual(getMockedAssetsFor(badgeId, tier.tierName))
      })
    })
  })

  describe('badges without tiers', () => {
    const badgeId = BadgeId.DECENTRALAND_CITIZEN

    beforeEach(() => {
      const badgesWithoutTiers = new Map<BadgeId, Badge>([[badgeId, badges.get(badgeId)]])
      aggregatedBadges = aggregateAssetsFor(badgesWithoutTiers, CDN_URL)
    })

    it('should return the correct assets for the badge', () => {
      const badge = aggregatedBadges.get(badgeId)!
      expect(badge.assets).toEqual(getMockedAssetsFor(badgeId))
    })
  })

  // Helpers
  function getMockedAssetsFor(badgeId: BadgeId, tierName?: string) {
    const baseUrl = `${CDN_URL}/${badgeId}${tierName ? `/${tierName.toLocaleLowerCase()}` : ''}`

    return {
      '2d': {
        normal: `${baseUrl}/2d/normal.png`
      },
      '3d': {
        normal: `${baseUrl}/3d/normal.png`,
        hrm: `${baseUrl}/3d/hrm.png`,
        basecolor: `${baseUrl}/3d/basecolor.png`
      }
    }
  }
})
