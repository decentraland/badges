import { BadgeId } from '@badges/common'
import { test } from '../components'
import { getBadgeIdsPartition } from '../utils'

test('GET /badges/:id/tiers', function ({ components }) {
  const endpointPath = (id: string) => `/badges/${id}/tiers`
  const [nonTieredBadgeIds, tieredBadgeIds] = getBadgeIdsPartition()

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

  it.each(nonTieredBadgeIds)(
    'should return an empty array when the badge id is %s and it does not have tiers',
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
          tiers: []
        }
      })
    }
  )

  it.each(tieredBadgeIds)(
    'should return the tiers of the badge when the id is %s it has tiers',
    async function (badgeId: BadgeId) {
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
    }
  )
})
