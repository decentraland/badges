import { BadgeId } from '@badges/common'
import { test } from '../components'

test('DELETE /users/:address/badges/:id', function ({ components }) {
  const endpointPath = (userAddress: string, badgeId: string) => `/users/${userAddress}/badges/${badgeId}`
  const userAddress = '0x1234567890abcdef1234567890abcdef12345678'
  const validBadgeId = BadgeId.DECENTRALAND_CITIZEN

  beforeAll(async () => {
    await components.badgeService.saveOrUpdateUserProgresses([
      {
        user_address: userAddress,
        badge_id: validBadgeId,
        progress: {
          steps: 1
        },
        completed_at: Date.now()
      }
    ])
  })

  afterAll(async () => {
    await components.badgeService.resetUserProgressFor(validBadgeId, userAddress)
  })

  it('should return 404 if it cannot parse the badge id', async function () {
    const response = await components.localFetch.fetch(endpointPath(userAddress, 'unknown'), {
      method: 'DELETE',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await components.config.getString('API_ADMIN_TOKEN')}`
      }
    })

    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toMatchObject({
      error: 'Not Found',
      message: 'Badge does not exists'
    })
  })

  it('should return 204 when reset the user progress successfully', async function () {
    const progressBeforeReset = await components.badgeService.getUserState(userAddress, validBadgeId)
    expect(progressBeforeReset).toBeDefined()

    const response = await components.localFetch.fetch(endpointPath(userAddress, validBadgeId), {
      method: 'DELETE',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await components.config.getString('API_ADMIN_TOKEN')}`
      }
    })
    expect(response.status).toBe(204)

    const currentProgress = await components.badgeService.getUserState(userAddress, validBadgeId)
    expect(currentProgress).toBeUndefined()
  })
})
