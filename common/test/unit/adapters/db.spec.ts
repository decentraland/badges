import { IPgComponent } from '@well-known-components/pg-component'
import { BadgeId, createDbComponent, DbComponent } from '../../../src'
import { EthAddress } from '@dcl/schemas'

describe('db', () => {
  const userAddress: EthAddress = '0x1234567890abcdef1234567890abcdef12345678'
  const rows = [
    {
      badge_id: 'badgeId1' as BadgeId,
      user_address: userAddress
    },
    {
      badge_id: 'badgeId2' as BadgeId,
      user_address: userAddress
    }
  ]

  let pg: IPgComponent
  let db: DbComponent

  beforeEach(async () => {
    pg = {
      query: jest.fn(),
      start: jest.fn(),
      streamQuery: jest.fn(),
      getPool: jest.fn(),
      stop: jest.fn()
    }

    db = createDbComponent({ pg })
  })

  it('getUserProgressFor should return the user progress for a specific badge', async () => {
    const badgeId = 'badgeId' as BadgeId
    const rows = [
      {
        badge_id: badgeId,
        user_address: userAddress
      }
    ]

    mockQueryResult(rows)

    const result = await db.getUserProgressFor(badgeId, userAddress)

    expect(pg.query).toHaveBeenCalledWith(queryContaining([badgeId, userAddress.toLowerCase()]))
    expect(result).toMatchObject(rows[0])
  })

  it('getUserProgressesForMultipleBadges should return the user progress for multiple badges', async () => {
    const badgeIds = ['badgeId1' as BadgeId, 'badgeId2' as BadgeId]
    const userAddresses: EthAddress[] = [userAddress]

    mockQueryResult(rows)

    const result = await db.getUserProgressesForMultipleBadges(badgeIds, userAddresses)

    expect(pg.query).toHaveBeenCalledWith(
      queryContaining([badgeIds, userAddresses.map((address) => address.toLowerCase())])
    )
    expect(result).toEqual(rows)
  })

  it('getAllUserProgresses should return the user progress for all badges', async () => {
    mockQueryResult(rows)

    const result = await db.getAllUserProgresses(userAddress)

    expect(pg.query).toHaveBeenCalledWith(queryContaining([userAddress.toLowerCase()]))
    expect(result).toEqual(rows)
  })

  it('getLatestUserBadges should return the latest user badges', async () => {
    mockQueryResult(rows)

    const result = await db.getLatestUserBadges(userAddress)
    const queryValues = [userAddress.toLowerCase(), userAddress.toLowerCase()]

    expect(pg.query).toHaveBeenCalledWith(queryContaining(queryValues))
    expect(result).toEqual(rows)
  })

  describe('saveUserProgress', () => {
    const userBadge = {
      badge_id: 'badgeId' as BadgeId,
      user_address: userAddress,
      progress: {
        steps: 0
      },
      completed_at: Date.now()
    }
    const expectedTimestamp = expect.any(Number)

    it('should save the user progress for a badge with tiers', async () => {
      const achievedTiers = [
        {
          tier_id: 'tierId',
          completed_at: Date.now()
        }
      ]
      const expectedAchievedTiers = JSON.stringify(achievedTiers)

      await db.saveUserProgress({
        ...userBadge,
        achieved_tiers: achievedTiers
      })

      expect(pg.query).toHaveBeenCalledWith(
        queryContaining([
          userBadge.badge_id,
          userBadge.user_address.toLowerCase(),
          userBadge.progress,
          expectedAchievedTiers,
          expectedTimestamp,
          expectedTimestamp,
          userBadge.progress,
          expectedAchievedTiers,
          expectedTimestamp,
          expectedTimestamp
        ])
      )
    })

    it('should save the user progress for a badge without tiers', async () => {
      const expectedAchievedTiers = null

      await db.saveUserProgress(userBadge)

      expect(pg.query).toHaveBeenCalledWith(
        queryContaining([
          userBadge.badge_id,
          userBadge.user_address.toLowerCase(),
          userBadge.progress,
          expectedAchievedTiers,
          expectedTimestamp,
          expectedTimestamp,
          userBadge.progress,
          expectedAchievedTiers,
          expectedTimestamp,
          expectedTimestamp
        ])
      )
    })
  })

  it('saveUserProgresses should save all the user progresses', async () => {
    const userBadges = Array.from({ length: 150 }, (_, i) => ({
      badge_id: `badgeId${i % 15}` as BadgeId,
      user_address: userAddress + i,
      progress: {
        steps: i
      },
      achieved_tiers: i % 2 === 0 ? [{ tier_id: 'tierId', completed_at: Date.now() }] : undefined,
      completed_at: Date.now()
    }))

    await db.saveUserProgresses(userBadges)
    expect(pg.query).toHaveBeenCalledTimes(2)
  })

  it('deleteUserProgress should delete the user progress for a specific badge', async () => {
    const badgeId = 'badgeId' as BadgeId

    await db.deleteUserProgress(badgeId, userAddress)

    expect(pg.query).toHaveBeenCalledWith(queryContaining([badgeId, userAddress.toLowerCase()]))
  })

  // Helpers
  function mockQueryResult(rows: any) {
    pg.query = jest.fn().mockResolvedValueOnce({
      rows
    })
  }

  function queryContaining(values: any[]) {
    return expect.objectContaining({
      text: expect.any(String),
      values
    })
  }
})
