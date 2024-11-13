import { BadgeId, UserBadge } from '@badges/common'
import { test } from '../components'
import { getExpectedAchievedBadge, getExpectedNotAchievedBadges } from '../utils'

test('GET /users/:address/badges', function ({ components }) {
  const endpointPath = (userAddress: string, includeNotAchieved?: boolean) =>
    `/users/${userAddress}/badges${includeNotAchieved ? '?includeNotAchieved=true' : ''}`

  const userAddress = '0x1234567890abcdef1234567890abcdef12345678'

  describe('when the user has no progress in the db', function () {
    it('should return empty arrays for achieved and not achieved badges', async function () {
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
          achieved: [],
          notAchieved: []
        }
      })
    })
  })

  describe('when the user has some progress related to different badges in the db', function () {
    let achievedBadges: UserBadge[] = []
    let notAchievedBadges: UserBadge[] = []
    let expectedAchievedBadges: any[] = []

    beforeAll(async () => {
      achievedBadges.push({
        user_address: userAddress,
        badge_id: BadgeId.DECENTRALAND_CITIZEN,
        progress: {
          steps: 1
        },
        completed_at: Date.now()
      })
      notAchievedBadges.push({
        user_address: userAddress,
        badge_id: BadgeId.EMOTIONISTA,
        progress: {
          steps: 0
        },
        achieved_tiers: []
      })
      await components.badgeService.saveOrUpdateUserProgresses([...achievedBadges, ...notAchievedBadges])

      expectedAchievedBadges.push(
        getExpectedAchievedBadge(BadgeId.DECENTRALAND_CITIZEN, {
          steps: 1,
          isTier: false,
          completed: true
        })
      )
    })

    afterAll(async () => {
      await Promise.all(
        [...achievedBadges, ...notAchievedBadges].map(
          async ({ badge_id }) => await components.badgeService.resetUserProgressFor(badge_id, userAddress)
        )
      )
    })

    it('should not show not achieved badges when the query param includeNotAchieved is not set', async function () {
      const response = await components.localFetch.fetch(endpointPath(userAddress), {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.data.achieved).toStrictEqual(expectedAchievedBadges)
      expect(body.data.notAchieved).toStrictEqual([])
    })

    it('should include the not achieved badges in the response when the query param includeNotAchieved is true', async function () {
      const response = await components.localFetch.fetch(endpointPath(userAddress, true), {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.data.achieved).toStrictEqual(expectedAchievedBadges)
      expect(body.data.notAchieved).toStrictEqual(
        getExpectedNotAchievedBadges(components.badgeService.getAllBadges(), [BadgeId.DECENTRALAND_CITIZEN])
      )
    })
  })
})
