import { BadgeCategory } from '@badges/common'
import { test } from '../components'

test('GET /categories', function ({ components }) {
    const endpointPath = '/categories'

    it('should return all categories', async function () {
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
            data: {
                categories: Object.values(BadgeCategory)
            }
        })
    })
})
