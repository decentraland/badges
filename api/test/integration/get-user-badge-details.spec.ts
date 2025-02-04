import { BadgeId } from '@badges/common'
import { test } from '../components'

test('GET /users/:address/badges/:id', function ({ components }) {
  const endpointPath = (userAddress, badgeId) => `/users/${userAddress}/badges/${badgeId}`
  const userAddress = '0x1234567890abcdef1234567890abcdef12345678'

  it('should return 404 when it is not possible to parse the badge id', async () => {
    const response = await components.localFetch.fetch(endpointPath(userAddress, 'unknown'), {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await components.config.getString('API_ADMIN_TOKEN')}`
      }
    })

    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toMatchObject({
      error: 'Not Found'
    })
  })

  it('should return 404 when the user has no progress for the badge', async () => {
    const badgeId = BadgeId.DECENTRALAND_CITIZEN
    const response = await components.localFetch.fetch(endpointPath(userAddress, badgeId), {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await components.config.getString('API_ADMIN_TOKEN')}`
      }
    })

    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toMatchObject({
      error: 'Not Found'
    })
  })

  describe('when the user has progress for the badge', () => {
    let decentralandCitizenUserBadge
    let emotionistaUserBadge

    beforeAll(async () => {
      decentralandCitizenUserBadge = {
        user_address: userAddress,
        badge_id: BadgeId.DECENTRALAND_CITIZEN,
        progress: {
          steps: 1,
          visited: '(0,0)'
        },
        completed_at: Date.now()
      }

      emotionistaUserBadge = {
        user_address: userAddress,
        badge_id: BadgeId.EMOTIONISTA,
        progress: {
          steps: 5
        },
        achieved_tiers: [
          {
            tier_id: 'emotionista-starter',
            completed_at: Date.now()
          }
        ]
      }
      await components.badgeService.saveOrUpdateUserProgresses([decentralandCitizenUserBadge, emotionistaUserBadge])
    })

    afterAll(async () => {
      await components.badgeService.resetUserProgressFor(decentralandCitizenUserBadge.badge_id, userAddress)
      await components.badgeService.resetUserProgressFor(emotionistaUserBadge.badge_id, userAddress)
    })

    it('should return the badge state with the user progress', async () => {
      const response = await components.localFetch.fetch(endpointPath(userAddress, decentralandCitizenUserBadge.badge_id), {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await components.config.getString('API_ADMIN_TOKEN')}`
        }
      })

      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toMatchObject({
        data: {
          user_address: userAddress,
          badge_id: decentralandCitizenUserBadge.badge_id,
          progress: {
            steps: 1,
            visited: '(0,0)'
          },
          completed_at: expect.any(String)
        }
      })
    })

    it('should return the badge state with the user progress including tiers', async () => {
        const response = await components.localFetch.fetch(endpointPath(userAddress, emotionistaUserBadge.badge_id), {
          method: 'GET',
          redirect: 'manual',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await components.config.getString('API_ADMIN_TOKEN')}`
          }
        })
  
        const body = await response.json()
  
        expect(response.status).toBe(200)
        expect(body).toMatchObject({
          data: {
            user_address: userAddress,
            badge_id: emotionistaUserBadge.badge_id,
            progress: {
              steps: 5
            },
            achieved_tiers: [
              {
                tier_id: 'emotionista-starter',
                completed_at: expect.any(Number)
              }
            ]
          }
      })
    })
  })
})
