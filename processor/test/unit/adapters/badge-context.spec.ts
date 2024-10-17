import { createBadgeContext } from '../../../src/adapters/badge-context'
import { IBadgeContext } from '../../../src/types'
import { getMockedComponents } from '../../utils'
import { ContentClient, createContentClient } from 'dcl-catalyst-client'

jest.mock('dcl-catalyst-client', () => ({
  ...jest.requireActual('dcl-catalyst-client'),
  createContentClient: jest.fn().mockReturnValue({
    fetchEntityById: jest.fn(),
    fetchEntitiesByPointers: jest.fn()
  })
}))

const LOAD_BALANCER_URL = 'http://localhost:5000'

describe('badge-context', () => {
  let badgeContext: IBadgeContext
  let contentClientMock: ContentClient

  beforeEach(async () => {
    const { fetch, config } = await getMockedComponents()
    badgeContext = await createBadgeContext({
      fetch,
      config: { ...config, requireString: jest.fn().mockReturnValueOnce(LOAD_BALANCER_URL) }
    })
    contentClientMock = createContentClient({ fetcher: fetch, url: LOAD_BALANCER_URL })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getWearablesWithRarity', () => {
    it('should return the wearables with rarity', async () => {
      const baseUrn = 'urn:decentraland:mumbai:collections-v2:0xaa40af0b4a18e0555ff3c87beab1d5b591947abe:1'
      const extendedUrn = `${baseUrn}:1`
      const wearables = [baseUrn, extendedUrn, 'urn:decentraland:ethereum:0x3:0x4', 'invalid-urn']
      const entities = [{ id: '1' }, { id: '2' }]

      contentClientMock.fetchEntitiesByPointers = jest.fn().mockResolvedValue(entities)

      const result = await badgeContext.getWearablesWithRarity(wearables)

      expect(contentClientMock.fetchEntitiesByPointers).toHaveBeenCalledWith([baseUrn, baseUrn])

      expect(result).toEqual(entities)
    })

    it('should return an empty array if no valid URNs are provided', async () => {
      const wearables = ['urn:decentraland:ethereum:0x3:0x4']

      contentClientMock.fetchEntitiesByPointers = jest.fn().mockResolvedValue([])

      const result = await badgeContext.getWearablesWithRarity(wearables)

      expect(contentClientMock.fetchEntitiesByPointers).toHaveBeenCalledWith([])
      expect(result).toEqual([])
    })
  })

  describe('getEntityById', () => {
    it('should fetch entity by ID with retries and default values', async () => {
      const entityId = 'some-entity-id'
      const entity = { id: entityId }

      // Simulate failure on the first try, success on the second
      contentClientMock.fetchEntityById = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failure on first attempt'))
        .mockResolvedValueOnce(entity)

      const result = await badgeContext.getEntityById(entityId)

      expect(contentClientMock.fetchEntityById).toHaveBeenCalledTimes(2)
      expect(result).toEqual(entity)
    })

    it('should fetch entity by ID with custom retries and wait time', async () => {
      const entityId = 'some-entity-id'
      const entity = { id: entityId }

      contentClientMock.fetchEntityById = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValueOnce(entity)

      const result = await badgeContext.getEntityById(entityId, { retries: 5, waitTime: 1000 })

      expect(contentClientMock.fetchEntityById).toHaveBeenCalledTimes(2)
      expect(result).toEqual(entity)
    })

    it('should fetch entity by ID from custom content server', async () => {
      const entityId = 'some-entity-id'
      const entity = { id: entityId }
      const customContentServer = 'http://custom-content-server.com'

      contentClientMock.fetchEntityById = jest.fn().mockResolvedValue(entity)

      const result = await badgeContext.getEntityById(entityId, { contentServerUrl: customContentServer })

      expect(result).toEqual(entity)
    })
  })

  describe('getEntitiesByPointers', () => {
    it('should fetch entities by pointers with retries and default values', async () => {
      const pointers = ['pointer1', 'pointer2']
      const entities = [{ id: 'entity1' }, { id: 'entity2' }]

      contentClientMock.fetchEntitiesByPointers = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failure on first attempt'))
        .mockResolvedValueOnce(entities)

      const result = await badgeContext.getEntitiesByPointers(pointers)

      expect(contentClientMock.fetchEntitiesByPointers).toHaveBeenCalledTimes(2)
      expect(result).toEqual(entities)
    })

    it('should fetch entities by pointers with custom retries and wait time', async () => {
      const pointers = ['pointer1', 'pointer2']
      const entities = [{ id: 'entity1' }, { id: 'entity2' }]

      contentClientMock.fetchEntitiesByPointers = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValueOnce(entities)

      const result = await badgeContext.getEntitiesByPointers(pointers, { retries: 5, waitTime: 500 })

      expect(contentClientMock.fetchEntitiesByPointers).toHaveBeenCalledTimes(2)
      expect(result).toEqual(entities)
    })

    it('should fetch entities by pointers from custom content server', async () => {
      const pointers = ['pointer1', 'pointer2']
      const entities = [{ id: 'entity1' }, { id: 'entity2' }]
      const customContentServer = 'http://custom-content-server.com'

      contentClientMock.fetchEntitiesByPointers = jest.fn().mockResolvedValue(entities)

      const result = await badgeContext.getEntitiesByPointers(pointers, { contentServerUrl: customContentServer })

      expect(result).toEqual(entities)
    })
  })
})
