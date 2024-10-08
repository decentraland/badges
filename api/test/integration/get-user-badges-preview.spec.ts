import { test } from '../components'

test('GET /users/:address/preview', function ({ components }) {
  const endpointPath = (userAddress: string) => `/users/${userAddress}/preview`

  it('should return the latest badges the user achieved', async function () {
    const userAddress = '0x1234567890abcdef1234567890abcdef12345678'
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
