import { BadgeId } from '@badges/common'
import { test } from '../components'

test('GET /badges/:id', function ({ components }) {
  const endpointPath = (id: string) => `/badges/${id}`

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

  it.each(Object.values(BadgeId))(
    'should return the badge definition when the id is %s',
    async function (badgeId: BadgeId) {
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
          badge: components.badgeService.getBadge(badgeId)
        }
      })
    }
  )
})
