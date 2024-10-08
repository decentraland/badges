import { BadgeId, createBadgeStorage, DbComponent, IBadgeStorage } from '@badges/common'
import { createDbMock } from '../mocks/db-mock'
import { createLogComponent } from '@well-known-components/logger'
import { AppComponents, IBadgeService } from '../../../src/types'
import { createBadgeService } from '../../../src/adapters/badge-service'

describe('Badge Service', () => {
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
    it('should get all the user progress for the different badges', async () => {
      const userAddress = '0x123testAddress'
      await badgeService.getUserStates(userAddress)
      expect(db.getAllUserProgresses).toHaveBeenCalledWith(userAddress)

      // TODO: put data in the db and check the return value
    })
  })

  describe('getUserState', () => {
    it('should get the user progress for a specific badge', async () => {
      const userAddress = '0x123testAddress'
      const badgeId = BadgeId.DECENTRALAND_CITIZEN
      await badgeService.getUserState(userAddress, badgeId)
      expect(db.getUserProgressFor).toHaveBeenCalledWith(badgeId, userAddress)

      // TODO: put data in the db and check the return value
    })
  })
})

// Helpers
async function getMockedComponents(): Promise<Pick<AppComponents, 'db' | 'logs' | 'badgeStorage'>> {
  const config = { requireString: jest.fn(), getString: jest.fn() } as any
  return {
    db: createDbMock(),
    logs: await createLogComponent({ config }),
    badgeStorage: await createBadgeStorage({
      config
    })
  }
}
