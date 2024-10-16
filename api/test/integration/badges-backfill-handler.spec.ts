import { BadgeId, UserBadge } from '@badges/common'
import { test } from '../components'

test('GET /badges/:id/backfill', function ({ components }) {
  const endpointPath = (id: string) => `/badges/${id}/backfill`

  describe('when the request is not correctly authorized', () => {
    it('should return 401', async () => {
      const response = await components.localFetch.fetch(endpointPath('unknown'), {
        method: 'POST',
        redirect: 'manual',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      expect(response.status).toBe(401)
    })
  })

  describe('when the authorization is correctly set', () => {
    let authorization: string

    beforeEach(async () => {
      authorization = `Bearer ${await components.config.getString('API_ADMIN_TOKEN')}`
    })

    describe('and the badge id is invalid', () => {
      const invalidBadgeId = 'unknown'

      it('should return 404', async () => {
        const response = await components.localFetch.fetch(endpointPath(invalidBadgeId), {
          method: 'POST',
          redirect: 'manual',
          headers: {
            'Content-Type': 'application/json',
            authorization
          }
        })

        expect(response.status).toBe(404)
      })
    })

    describe('and the badge id is valid', () => {
      const badgeId: BadgeId = BadgeId.LAND_ARCHITECT

      let registries: {
        userAddress: string
        data: {
          progress: any
        }
      }[]

      beforeEach(async () => {
        registries = [
          {
            userAddress: '0x1234567890abcdef1234567890abcdef12345678',
            data: {
              progress: {
                firstSceneDeployedAt: 1234567890
              }
            }
          },
          {
            userAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
            data: {
              progress: {
                firstSceneDeployedAt: 1234567890
              }
            }
          }
        ]
      })

      afterEach(async () => {
        registries.forEach(async ({ userAddress }) => {
          await components.badgeService.resetUserProgressFor(badgeId, userAddress)
        })
      })

      it('should return 200 when all the registries are correctly processed', async () => {
        const response = await components.localFetch.fetch(endpointPath(badgeId), {
          method: 'POST',
          redirect: 'manual',
          headers: {
            'Content-Type': 'application/json',
            authorization
          },
          body: JSON.stringify({ registries })
        })

        const body = await response.json()

        expect(response.status).toBe(200)
        expect(body).toMatchObject({
          data: {
            badge: components.badgeStorage.getBadge(badgeId),
            userProgressesMerged: registries.length,
            failures: []
          }
        })

        const userAddresses = registries.map(({ userAddress }) => userAddress)
        const userProgresses = await Promise.all(
          userAddresses.map((userAddress) => components.badgeService.getUserState(userAddress, badgeId))
        )
        const expectedUserProgresses = userAddresses.map((userAddress) =>
          createExpectedUserProgress({
            user_address: userAddress,
            badge_id: badgeId,
            progress: { steps: 1 },
            completed: true
          })
        )

        expect(userProgresses).toEqual(expect.arrayContaining(expectedUserProgresses))
      })

      it.todo('should return 200 and show the failures when some of the registries set an invalid user progress')

      it('should return 500 when one of the registries fails on being processed', async () => {
        const registriesWithErrors = [...registries]
        registriesWithErrors[1].data.progress.firstSceneDeployedAt = 'invalid'

        const response = await components.localFetch.fetch(endpointPath(badgeId), {
          method: 'POST',
          redirect: 'manual',
          headers: {
            'Content-Type': 'application/json',
            authorization
          },
          body: JSON.stringify({ registries: registriesWithErrors })
        })

        await response.json()

        expect(response.status).toBe(500)
      })
    })
  })

  // Helpers
  function createExpectedUserProgress({
    user_address,
    badge_id,
    progress,
    achieved_tiers = null,
    completed = false
  }: UserBadge & { completed?: boolean }): UserBadge {
    // completed_at and updated_at are should be numbers
    return {
      user_address,
      badge_id,
      completed_at: completed ? expect.any(String) : undefined,
      achieved_tiers,
      updated_at: expect.any(String),
      progress
    }
  }
})
