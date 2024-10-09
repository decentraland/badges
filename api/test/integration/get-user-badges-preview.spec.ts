import { Badge, BadgeId, badges, BadgeTier, UserBadge } from '@badges/common'
import { Response } from '@well-known-components/interfaces'
import { test } from '../components'

const PREVIEW_LIMIT = 5

test('GET /users/:address/preview', function ({ components }) {
  const endpointPath = (userAddress: string) => `/users/${userAddress}/preview`

  const userAddress = '0x1234567890abcdef1234567890abcdef12345678'

  describe('when the user has no badges achieved', function () {
    it('should return the latest badges the user achieved', async function () {
      const response = await components.localFetch.fetch(endpointPath(userAddress), {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        data: {
          latestAchievedBadges: []
        }
      })
    })
  })

  describe('when the user achieved some badges', function () {
    let achievedBadges: UserBadge[] = []
    let response: Response, body: any

    beforeAll(async () => {
      const completedAt = Date.now()

      achievedBadges.push({
        user_address: userAddress,
        badge_id: BadgeId.DECENTRALAND_CITIZEN,
        progress: {
          steps: 1
        },
        completed_at: completedAt + 1
      })
      achievedBadges.push({
        user_address: userAddress,
        badge_id: BadgeId.EMOTIONISTA,
        progress: {
          steps: 12
        },
        achieved_tiers: [
          {
            tier_id: 'emotionista-starter',
            completed_at: completedAt - 2
          },
          {
            tier_id: 'emotionista-bronze',
            completed_at: completedAt + 2
          }
        ]
      })
      achievedBadges.push({
        user_address: userAddress,
        badge_id: BadgeId.VERTICAL_VOYAGER,
        progress: {
          steps: 1
        },
        completed_at: completedAt + 3
      })
      achievedBadges.push({
        user_address: userAddress,
        badge_id: BadgeId.WALKABOUT_WANDERER,
        progress: {
          steps: 350000
        },
        achieved_tiers: [
          {
            tier_id: 'walkabout-wanderer-starter',
            completed_at: completedAt - 4
          },
          {
            tier_id: 'walkabout-wanderer-bronze',
            completed_at: completedAt - 3
          },
          {
            tier_id: 'walkabout-wanderer-silver',
            completed_at: completedAt - 2
          },
          {
            tier_id: 'walkabout-wanderer-gold',
            completed_at: completedAt + 4
          }
        ]
      })

      await components.badgeService.saveOrUpdateUserProgresses(achievedBadges)

      response = await components.localFetch.fetch(endpointPath(userAddress), {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      body = await response.json()
    })

    afterAll(async () => {
      await Promise.all(
        achievedBadges.map(
          async ({ badge_id }) => await components.badgeService.resetUserProgressFor(badge_id, userAddress)
        )
      )
    })

    it(`should return the latest ${PREVIEW_LIMIT} badges the user achieved`, async function () {
      expect(response.status).toBe(200)
      expect(body.data.latestAchievedBadges).toHaveLength(PREVIEW_LIMIT)
    })

    it(`should return the latest ${PREVIEW_LIMIT} badges the user achieved`, async function () {
      expect(body.data.latestAchievedBadges).toStrictEqual([
        getExpectedAchievedBadge(BadgeId.WALKABOUT_WANDERER, {
          tierName: 'Gold'
        }),
        getExpectedAchievedBadge(BadgeId.VERTICAL_VOYAGER),
        getExpectedAchievedBadge(BadgeId.EMOTIONISTA, {
          tierName: 'Bronze'
        }),
        getExpectedAchievedBadge(BadgeId.DECENTRALAND_CITIZEN),
        getExpectedAchievedBadge(BadgeId.EMOTIONISTA, {
          tierName: 'Starter'
        })
      ])
    })
  })

  // Helpers
  function getExpectedAchievedBadge(badgeId: BadgeId, achievedTier?: Pick<BadgeTier, 'tierName'>) {
    const badge = badges.get(badgeId) as Badge

    const partialExpectedAchievedBadge = {
      id: badgeId,
      name: badge.name,
      image: expect.any(String)
    }

    return !!achievedTier
      ? {
          ...partialExpectedAchievedBadge,
          tierName: achievedTier.tierName
        }
      : partialExpectedAchievedBadge
  }
})
