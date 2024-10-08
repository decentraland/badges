import { BadgeId } from '@badges/common'
import { test } from '../components'

test('DELETE /users/:address/badges/:id', function ({ components }) {
  const endpointPath = (userAddress: string, badgeId: string) => `/users/${userAddress}/badges/${badgeId}`

  it('should return 404 if it cannot parse the badge id', async function () {
    const userAddress = '0x1234567890abcdef1234567890abcdef12345678'
    const response = await components.localFetch.fetch(endpointPath(userAddress, 'unknown'), {
      method: 'DELETE',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toMatchObject({
      error: 'Not Found',
      message: 'Badge does not exists'
    })
  })

  it.skip('should return 204 when reset the user progress successfully', async function () {
    const userAddress = '0x1234567890abcdef1234567890abcdef12345678'
    const badgeId = BadgeId.DECENTRALAND_CITIZEN
    const response = await components.localFetch.fetch(endpointPath(userAddress, badgeId), {
      method: 'DELETE',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // TODO: mock the resetUserProgressFor method
    // jest.spyOn(components.badgeService, 'resetUserProgressFor').mockResolvedValueOnce()

    expect(response.status).toBe(204)
  })
})
