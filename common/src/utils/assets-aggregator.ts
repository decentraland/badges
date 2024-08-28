import { Badge, BadgeId, BadgeTier } from 'types'

function addAssetsTo(badge: Badge, cdnUrl: string): Badge {
  const isTieredBadge = badge.tiers && badge.tiers.length > 0
  const badgeId: string = badge.id as string

  if (isTieredBadge) {
    return {
      ...badge,
      tiers: badge.tiers!.map((tier: BadgeTier) => {
        return {
          ...tier,
          assets: {
            '2d': {
              normal: `${cdnUrl}/${badgeId}/${tier.tierName.toLocaleLowerCase()}/2d/normal.png`
            },
            '3d': {
              normal: `${cdnUrl}/${badgeId}/${tier.tierName.toLocaleLowerCase()}/3d/normal.png`,
              hrm: `${cdnUrl}/${badgeId}/${tier.tierName.toLocaleLowerCase()}/3d/hrm.png`,
              basecolor: `${cdnUrl}/${badgeId}/${tier.tierName.toLocaleLowerCase()}/3d/basecolor.png`
            }
          }
        }
      })
    }
  }

  return {
    ...badge,
    assets: {
      '2d': {
        normal: `${cdnUrl}/${badgeId}/2d/normal.png`
      },
      '3d': {
        normal: `${cdnUrl}/${badgeId}/3d/normal.png`,
        hrm: `${cdnUrl}/${badgeId}/3d/hrm.png`,
        basecolor: `${cdnUrl}/${badgeId}/3d/basecolor.png`
      }
    }
  }
}

export function aggregateAssetsFor(badges: Map<BadgeId, Badge>, cdnUrl: string): Map<BadgeId, Badge> {
  const aggregatedBadges = new Map<BadgeId, Badge>()

  badges.forEach((badge, id) => {
    const badgeWithAssets = addAssetsTo(badge, cdnUrl)
    aggregatedBadges.set(id, badgeWithAssets)
  })

  return aggregatedBadges
}
