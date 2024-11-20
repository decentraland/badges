import { BadgeId, createBadgeStorage } from '@badges/common'
import { createBadgeService } from '../../../src/adapters/badge-service'
import { AppComponents, IBadgeService, IUserProgressValidator } from '../../../src/types'
import { createDbMock } from '../mocks/db-mock'
import { createBackfillMergerComponent } from '../../../src/logic/backfill-merger'
import { InvalidRequestError } from '@dcl/platform-server-commons'
import {
  mergeEmoteCreatorProgress,
  mergeEmotionistaProgress,
  mergeEventEnthusiastProgress,
  mergeFashionistaProgress,
  mergeLandArchitectProgress,
  mergeMovesMasterProgress,
  mergeOpenForBusinessProgress,
  mergeProfileProProgress,
  mergeSocialButterflyProgress,
  mergeWearableDesignerProgress,
  mergeWearablesEquipmentProgress,
  mergeUniqueEventProgress
} from '../../../src/logic/backfills'

jest.mock('../../../src/logic/backfills')

const MOCK_ASSET_URL = 'https://any-url.tld'

describe('Backfill Merger', () => {
  const userAddress = '0x1234567890abcdef1234567890abcdef12345678'

  let badgeService: IBadgeService
  let backfillMerger: IUserProgressValidator

  beforeEach(async () => {
    const components = await getMockedComponents()
    badgeService = components.badgeService
    backfillMerger = createBackfillMergerComponent(components)
  })

  it('should throw invalid request error when the badge does not have a backfill process', () => {
    expect(() => backfillMerger.mergeUserProgress(BadgeId.DECENTRALAND_CITIZEN, userAddress, undefined, {})).toThrow(
      InvalidRequestError
    )
  })

  it('should throw invalid request error when the backfill fails', () => {
    const mergeWearablesEquipmentProgressMock = mergeWearablesEquipmentProgress as jest.Mock

    mergeWearablesEquipmentProgressMock.mockImplementationOnce(() => {
      throw new Error('Backfill failed')
    })

    expect(() => backfillMerger.mergeUserProgress(BadgeId.REGALLY_RARE, userAddress, undefined, {})).toThrow(
      InvalidRequestError
    )
  })

  it.each([
    [BadgeId.REGALLY_RARE, mergeWearablesEquipmentProgress],
    [BadgeId.EXOTIC_ELEGANCE, mergeWearablesEquipmentProgress],
    [BadgeId.EPIC_ENSEMBLE, mergeWearablesEquipmentProgress],
    [BadgeId.UNIQUE_UNICORN, mergeWearablesEquipmentProgress],
    [BadgeId.LEGENDARY_LOOK, mergeWearablesEquipmentProgress],
    [BadgeId.MYTHIC_MODEL, mergeWearablesEquipmentProgress],
    [BadgeId.EMOTIONISTA, mergeEmotionistaProgress],
    [BadgeId.EMOTE_CREATOR, mergeEmoteCreatorProgress],
    [BadgeId.FASHIONISTA, mergeFashionistaProgress],
    [BadgeId.WEARABLE_DESIGNER, mergeWearableDesignerProgress],
    [BadgeId.EVENT_ENTHUSIAST, mergeEventEnthusiastProgress],
    [BadgeId.MOVES_MASTER, mergeMovesMasterProgress],
    [BadgeId.SOCIAL_BUTTERFLY, mergeSocialButterflyProgress],
    [BadgeId.LAND_ARCHITECT, mergeLandArchitectProgress],
    [BadgeId.PROFILE_PRO, mergeProfileProProgress],
    [BadgeId.OPEN_FOR_BUSINESS, mergeOpenForBusinessProgress],
    [BadgeId.MUSIC_FESTIVAL_2024, mergeUniqueEventProgress]
  ])('should merge the progress for the user when the badge id is %s', (badgeId: BadgeId, merger: jest.Mock) => {
    const mergerMock = merger as jest.Mock

    mergerMock.mockReturnValueOnce({
      badgeId,
      userAddress,
      progress: { steps: 1 }
    })

    backfillMerger.mergeUserProgress(badgeId, userAddress, undefined, {})

    expect(mergerMock).toHaveBeenCalledWith(userAddress, undefined, badgeService.getBadge(badgeId), {})
  })

  // Helpers
  async function getMockedComponents(): Promise<Pick<AppComponents, 'logs' | 'badgeService'>> {
    const config = { requireString: jest.fn(), getString: jest.fn() } as any
    const logs = {
      getLogger: jest.fn().mockReturnValue({
        error: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn()
      })
    }
    return {
      logs,
      badgeService: await createBadgeService({
        db: createDbMock(),
        logs,
        badgeStorage: await createBadgeStorage({
          config: {
            ...config,
            requireString: jest.fn().mockResolvedValue(MOCK_ASSET_URL)
          }
        })
      })
    }
  }
})
