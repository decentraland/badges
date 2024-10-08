import { BadgeId } from '@badges/common'
import { test } from '../components'

test('GET /badges/:id/tiers', function ({ components }) {
  const endpointPath = (id: string) => `/badges/${id}/tiers`

  it('should return 404 when it is not possible to parse the badge id', async function () {
    const response = await components.localFetch.fetch(endpointPath('unknown'), {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toMatchObject({
      error: 'Badge not found'
    })
  })

  it('should return an empty array when the badge does not have tiers', async function () {
    const badgeId = BadgeId.LAND_ARCHITECT
    const response = await components.localFetch.fetch(endpointPath(badgeId), {
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
        tiers: []
      }
    })
  })

  it('should return the tiers of the badge when it has tiers', async function () {
    const badgeId = BadgeId.EMOTIONISTA
    const response = await components.localFetch.fetch(endpointPath(badgeId), {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const body = await response.json()

    const { tiers } = components.badgeService.getBadge(badgeId)

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      data: {
        tiers
      }
    })
  })
})
