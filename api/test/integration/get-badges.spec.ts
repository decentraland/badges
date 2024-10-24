import { test } from '../components'

test('GET /badges', function ({ components }) {
  const endpointPath = '/badges'

  it('should return all badges', async function () {
    const response = await components.localFetch.fetch(endpointPath, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      data: components.badgeService.getAllBadges()
    })
  })
})
