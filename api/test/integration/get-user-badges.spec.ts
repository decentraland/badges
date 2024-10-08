import { test } from '../components'

test('GET /users/:address/badges', function ({ components }) {
  const endpointPath = (userAddress: string) => `/users/${userAddress}/badges`

  it('should return the user progress', async function () {
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
        achieved: [],
        notAchieved: []
      }
    })
  })
})
