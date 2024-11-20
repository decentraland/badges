import { Badge, BadgeId, BadgeTier, createBadgeStorage, DbComponent, IBadgeStorage, UserBadge } from '@badges/common'
import { createDbMock } from '../mocks/db-mock'
import { AppComponents, IBadgeService, TierProgress, UserBadgesPreview } from '../../../src/types'
import { createBadgeService } from '../../../src/adapters/badge-service'
import { EthAddress } from '@dcl/schemas'
import { TierId } from '@badges/common/src/types/tiers'

const MOCK_ASSET_URL = 'https://any-url.tld'

describe('Badge Service', () => {
  const userAddress = '0x1234567890abcdef1234567890abcdef12345678'
  let badgeStorage: IBadgeStorage, badgeService: IBadgeService, db: DbComponent

  beforeEach(async () => {
    const components = await getMockedComponents()
    badgeStorage = components.badgeStorage
    db = components.db
    badgeService = await createBadgeService(components)
  })

  describe('getBadge', () => {
    it('should return the badge definition', async () => {
      const badgeId = BadgeId.DECENTRALAND_CITIZEN
      const badge = badgeService.getBadge(badgeId)

      expect(badge).toMatchObject(badgeStorage.getBadge(badgeId))
    })
  })

  describe('getBadges', () => {
    it('should return an array with the badges definitions', async () => {
      const badgesIds = [BadgeId.DECENTRALAND_CITIZEN, BadgeId.EMOTE_CREATOR, BadgeId.WALKABOUT_WANDERER]
      const badges = badgeService.getBadges(badgesIds)
      const expectedBadges = badgesIds.map((id) => badgeStorage.getBadge(id))

      expect(badges).toStrictEqual(expectedBadges)
    })
  })

  describe('getAllBadges', () => {
    it('should return an array with all the badges definitions', async () => {
      const allBadges = badgeService.getAllBadges()
      const allExpectedBadges = Array.from(badgeStorage.getBadges().values())

      expect(allBadges).toStrictEqual(allExpectedBadges)
    })
  })

  describe('getUserStates', () => {
    it('should get all the user progress for the different badges from the db', async () => {
      await badgeService.getUserStates(userAddress)
      expect(db.getAllUserProgresses).toHaveBeenCalledWith(userAddress)
    })

    it('should throw an error when the database call fails', async () => {
      db.getAllUserProgresses = jest.fn().mockRejectedValueOnce(new Error('DB call failed'))
      await expect(badgeService.getUserStates(userAddress)).rejects.toThrow('DB call failed')
    })
  })

  describe('getUserState', () => {
    const badgeId = BadgeId.DECENTRALAND_CITIZEN

    it('should get the user progress for a specific badge from the db', async () => {
      await badgeService.getUserState(userAddress, badgeId)
      expect(db.getUserProgressFor).toHaveBeenCalledWith(badgeId, userAddress)
    })

    it('should throw an error when the database call fails', async () => {
      db.getUserProgressFor = jest.fn().mockRejectedValueOnce(new Error('DB call failed'))
      await expect(badgeService.getUserState(userAddress, badgeId)).rejects.toThrow('DB call failed')
    })
  })

  describe('getLatestAchievedBadges', () => {
    it('should return the latest achieved badges either with or without tiers', async () => {
      const userBadges: UserBadge[] = [
        getMockedUserBadge(BadgeId.DECENTRALAND_CITIZEN, userAddress),
        getMockedUserBadgeWithTiers(BadgeId.EMOTE_CREATOR, userAddress, ['emote-creator-starter' as TierId])
      ]
      db.getLatestUserBadges = jest.fn().mockResolvedValueOnce(userBadges)

      const result = await badgeService.getLatestAchievedBadges(userAddress)

      expect(result).toStrictEqual([
        getExpectedBadge(BadgeId.DECENTRALAND_CITIZEN),
        getExpectedBadge(BadgeId.EMOTE_CREATOR, { tierName: 'Starter' })
      ])
    })

    it('should return an empty array when no badges are achieved', async () => {
      db.getLatestUserBadges = jest.fn().mockResolvedValueOnce([])

      const result = await badgeService.getLatestAchievedBadges(userAddress)

      expect(result).toEqual([])
    })

    it('should throw an error when the database call fails', async () => {
      db.getLatestUserBadges = jest.fn().mockRejectedValueOnce(new Error('DB call failed'))
      await expect(badgeService.getLatestAchievedBadges(userAddress)).rejects.toThrow('DB call failed')
    })
  })

  describe('calculateUserProgress', () => {
    let allBadges: Badge[]
    let nonTierBadgeUserProgress: UserBadge, badgeWithTiersUserProgress: UserBadge
    let userProgresses: UserBadge[]
    let achieved = []

    beforeEach(() => {
      allBadges = badgeService.getAllBadges()

      nonTierBadgeUserProgress = getMockedUserBadge(BadgeId.DECENTRALAND_CITIZEN, userAddress, { steps: 1 }, true)
      badgeWithTiersUserProgress = getMockedUserBadgeWithTiers(
        BadgeId.EMOTE_CREATOR,
        userAddress,
        ['emote-creator-starter' as TierId],
        { steps: 1 }
      )

      userProgresses = [nonTierBadgeUserProgress, badgeWithTiersUserProgress]

      const {
        tiers: [currentTier, nextTier]
      } = badgeStorage.getBadge(badgeWithTiersUserProgress.badge_id)

      achieved = [
        getExpectedUserProgressForBadge(nonTierBadgeUserProgress.badge_id, nonTierBadgeUserProgress, null),
        getExpectedUserProgressForBadge(badgeWithTiersUserProgress.badge_id, badgeWithTiersUserProgress, {
          currentTier,
          nextTier
        })
      ]
    })

    it('should return only the achieved badges when the flag shouldIncludeNotAchieved is false', async () => {
      const result = badgeService.calculateUserProgress(allBadges, userProgresses, false)

      expect(result).toMatchObject({
        achieved,
        notAchieved: []
      })
    })

    it('should return also the non achieved badges when the flag shouldIncludeNotAchieved is true', async () => {
      const result = badgeService.calculateUserProgress(allBadges, userProgresses, true)
      const notAchieved = allBadges
        .filter((badge) => !userProgresses.some((userBadge) => userBadge.badge_id === badge.id))
        .map((badge) => getExpectedUserProgressForBadge(badge.id, getMockedUserBadge(badge.id, userAddress), null))

      expect(result).toMatchObject({
        achieved,
        notAchieved
      })
    })

    it('should throw an error when some of the badges have corrupted data', async () => {
      const corruptedBadge = {
        ...getMockedUserBadge(BadgeId.TRAVELER, userAddress),
        achieved_tiers: undefined // No tiers
      }
      userProgresses.push(corruptedBadge)

      expect(() => {
        badgeService.calculateUserProgress(allBadges, userProgresses, false)
      }).toThrow(TypeError) // reading property 'length' of undefined
    })
  })

  describe('resetUserProgressFor', () => {
    const badgeId = BadgeId.DECENTRALAND_CITIZEN

    it('should reset the user progress for a badge in the db', async () => {
      await badgeService.resetUserProgressFor(badgeId, userAddress)
      expect(db.deleteUserProgress).toHaveBeenCalledWith(badgeId, userAddress)
    })

    it('should throw an error when the database call fails', async () => {
      db.deleteUserProgress = jest.fn().mockRejectedValueOnce(new Error('DB call failed'))
      await expect(badgeService.resetUserProgressFor(badgeId, userAddress)).rejects.toThrow('DB call failed')
    })
  })

  describe('saveOrUpdateUserProgresses', () => {
    it('should store the user progress for different badges in the db', async () => {
      const userBadges: UserBadge[] = [
        getMockedUserBadge(BadgeId.DECENTRALAND_CITIZEN, userAddress),
        getMockedUserBadge(BadgeId.EMOTE_CREATOR, userAddress),
        getMockedUserBadge(BadgeId.WALKABOUT_WANDERER, userAddress)
      ]

      await badgeService.saveOrUpdateUserProgresses(userBadges)
      expect(db.saveUserProgresses).toHaveBeenCalledWith(userBadges)
    })

    it('should throw an error when the database call fails', async () => {
      db.saveUserProgresses = jest.fn().mockRejectedValueOnce(new Error('DB call failed'))
      await expect(badgeService.saveOrUpdateUserProgresses([])).rejects.toThrow('DB call failed')
    })
  })

  // Helpers
  async function getMockedComponents(): Promise<Pick<AppComponents, 'db' | 'logs' | 'badgeStorage'>> {
    const config = { requireString: jest.fn(), getString: jest.fn() } as any
    return {
      db: createDbMock(),
      logs: {
        getLogger: jest.fn().mockReturnValue({
          error: jest.fn(),
          debug: jest.fn(),
          info: jest.fn(),
          warn: jest.fn()
        })
      },
      badgeStorage: await createBadgeStorage({
        config: { ...config, requireString: jest.fn().mockResolvedValue(MOCK_ASSET_URL) }
      })
    }
  }

  function getMockedUserBadge(
    badgeId: BadgeId,
    userAddress: EthAddress,
    progress?: UserBadge['progress'],
    completed?: boolean
  ): UserBadge {
    return {
      user_address: userAddress,
      badge_id: badgeId,
      progress: {
        steps: 0,
        ...progress
      },
      completed_at: completed ? Date.now() : null
    }
  }

  function getMockedUserBadgeWithTiers(
    badgeId: BadgeId,
    userAddress: EthAddress,
    tiers: TierId[],
    progress?: UserBadge['progress']
  ): UserBadge {
    const badge = badgeStorage.getBadge(badgeId)
    const completed = tiers.length === badge.tiers!.length
    return {
      ...getMockedUserBadge(badgeId, userAddress, progress, completed),
      achieved_tiers: tiers.map((tier_id) => ({ tier_id, completed_at: Date.now() }))
    }
  }

  function getExpectedBadge(badgeId: BadgeId, achievedTier?: Pick<BadgeTier, 'tierName'>): UserBadgesPreview {
    const badge = badgeStorage.getBadge(badgeId)
    return {
      id: badgeId,
      name: badge.name,
      tierName: achievedTier?.tierName || undefined,
      image: `${MOCK_ASSET_URL}/${badgeId}${!!achievedTier ? `/${achievedTier.tierName.toLowerCase()}` : ''}/2d/normal.png`
    }
  }

  function getExpectedUserProgressForBadge(badgeId: BadgeId, badgeProgress: UserBadge, tierProgress: TierProgress) {
    const badge = badgeStorage.getBadge(badgeId)
    const isTierBadge = badge.tiers && badge.tiers.length > 0

    const calculatedNextTarget = isTierBadge
      ? tierProgress?.nextTier?.criteria.steps || badge.tiers![badge.tiers!.length - 1].criteria.steps
      : badge.criteria.steps

    const wasAchieved = badgeProgress.completed_at || !!tierProgress?.currentTier

    const baseUserProgress = {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      category: badge.category,
      isTier: !!isTierBadge,
      completedAt: badgeProgress.completed_at ? expect.any(Number) : null,
      assets: isTierBadge ? tierProgress?.currentTier?.assets || badge.tiers![0].assets : badge.assets
    }

    return {
      ...baseUserProgress,
      progress: wasAchieved
        ? {
            achievedTiers: badgeProgress.achieved_tiers?.map((achievedTier) => ({
              tierId: achievedTier.tier_id,
              completedAt: expect.any(Number)
            })),
            stepsDone: badgeProgress.progress.steps,
            nextStepsTarget: badgeProgress.completed_at ? null : calculatedNextTarget,
            totalStepsTarget: isTierBadge ? badge.tiers![badge.tiers!.length - 1].criteria.steps : badge.criteria.steps,
            lastCompletedTierAt: isTierBadge ? expect.any(Number) : null,
            lastCompletedTierName: isTierBadge ? tierProgress?.currentTier?.tierName : null,
            lastCompletedTierImage: isTierBadge ? tierProgress?.currentTier?.assets?.['2d'].normal : null
          }
        : {
            stepsDone: badgeProgress.progress.steps,
            nextStepsTarget: isTierBadge ? badge.tiers![0].criteria.steps : badge.criteria.steps,
            totalStepsTarget: isTierBadge ? badge.tiers![badge.tiers!.length - 1].criteria.steps : badge.criteria.steps
          }
    }
  }
})
