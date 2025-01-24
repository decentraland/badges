import { Entity } from '@dcl/schemas'
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

jest.mock('dcl-catalyst-client/dist/contracts-snapshots', () => ({
  getCatalystServersFromCache: jest
    .fn()
    .mockReturnValue([
      { address: 'http://catalyst-server-1.com' },
      { address: 'http://catalyst-server-2.com' },
      { address: 'http://catalyst-server-3.com' }
    ])
}))

jest.mock('../../../src/utils/array', () => ({
  shuffleArray: jest.fn((array) => array) // for predictability
}))

jest.mock('../../../src/utils/timer', () => ({
  sleep: jest.fn()
}))

const CATALYST_CONTENT_URL_LOADBALANCER = 'http://catalyst-server.com/content'

describe('Badge Context', () => {
  let badgeContext: IBadgeContext
  let contentClientMock: ContentClient

  beforeEach(async () => {
    const { fetch, config } = await getMockedComponents()
    badgeContext = await createBadgeContext({
      fetch,
      config: { ...config, requireString: jest.fn().mockReturnValueOnce(CATALYST_CONTENT_URL_LOADBALANCER) }
    })
    contentClientMock = createContentClient({ fetcher: fetch, url: CATALYST_CONTENT_URL_LOADBALANCER })
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
    let entityId: string
    let entity: Pick<Entity, 'id'>
    let customContentServer: string

    beforeEach(() => {
      entityId = 'some-entity-id'
      entity = { id: entityId }
      customContentServer = 'http://custom-content-server.com/content'
    })

    it('should fetch entity by ID with retries and default values', async () => {
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
      contentClientMock.fetchEntityById = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValueOnce(entity)

      const result = await badgeContext.getEntityById(entityId, { retries: 5, waitTime: 1000 })

      expect(contentClientMock.fetchEntityById).toHaveBeenCalledTimes(2)
      expect(result).toEqual(entity)
    })

    it('should fetch entity by ID from custom content server on the first attempt', async () => {
      contentClientMock.fetchEntityById = jest.fn().mockResolvedValue(entity)

      const result = await badgeContext.getEntityById(entityId, { contentServerUrl: customContentServer })

      expectContentClientToHaveBeenCalledWithUrl(customContentServer)
      expect(contentClientMock.fetchEntityById).toHaveBeenCalledTimes(1)

      expect(result).toEqual(entity)
    })

    it('should rotate among catalyst server URLs on subsequent attempts', async () => {
      contentClientMock.fetchEntityById = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failure on first attempt'))
        .mockRejectedValueOnce(new Error('Failure on second attempt'))
        .mockResolvedValueOnce(entity)

      await badgeContext.getEntityById(entityId)

      expectContentClientToHaveBeenCalledWithUrl(CATALYST_CONTENT_URL_LOADBALANCER)
      expectContentClientToHaveBeenCalledWithUrl('http://catalyst-server-3.com/content')
      expectContentClientToHaveBeenCalledWithUrl('http://catalyst-server-2.com/content')

      expect(contentClientMock.fetchEntityById).toHaveBeenCalledTimes(3)
    })

    it('should not reuse the same catalyst server URL on different attempts', async () => {
      contentClientMock.fetchEntityById = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failure on first attempt'))
        .mockRejectedValueOnce(new Error('Failure on second attempt'))
        .mockRejectedValueOnce(new Error('Failure on third attempt'))

      await badgeContext.getEntityById(entityId, { retries: 3 }).catch(() => {})

      const createContentClientMock = createContentClient as jest.Mock
      const currentCalls = createContentClientMock.mock.calls.slice(1) // Avoid the first call which is the one made in the beforeEach

      const urlsUsed = currentCalls.map((args) => args[0].url)
      const uniqueUrls = new Set(urlsUsed)

      expect(uniqueUrls.size).toBe(urlsUsed.length)
    })
  })

  describe('getEntitiesByPointers', () => {
    let pointers: string[]
    let entities: Pick<Entity, 'id'>[]
    let customContentServer: string

    beforeEach(() => {
      pointers = ['pointer1', 'pointer2']
      entities = [{ id: 'entity1' }, { id: 'entity2' }]
      customContentServer = 'http://custom-content-server.com'
    })

    it('should fetch entities by pointers with retries and default values', async () => {
      contentClientMock.fetchEntitiesByPointers = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failure on first attempt'))
        .mockResolvedValueOnce(entities)

      const result = await badgeContext.getEntitiesByPointers(pointers)

      expect(contentClientMock.fetchEntitiesByPointers).toHaveBeenCalledTimes(2)
      expect(result).toEqual(entities)
    })

    it('should fetch entities by pointers with custom retries and wait time', async () => {
      contentClientMock.fetchEntitiesByPointers = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValueOnce(entities)

      const result = await badgeContext.getEntitiesByPointers(pointers, { retries: 5, waitTime: 500 })

      expect(contentClientMock.fetchEntitiesByPointers).toHaveBeenCalledTimes(2)
      expect(result).toEqual(entities)
    })

    it('should fetch entities by pointers from custom content server on the first attempt', async () => {
      contentClientMock.fetchEntitiesByPointers = jest.fn().mockResolvedValue(entities)

      const result = await badgeContext.getEntitiesByPointers(pointers, { contentServerUrl: customContentServer })

      expectContentClientToHaveBeenCalledWithUrl(customContentServer)
      expect(contentClientMock.fetchEntitiesByPointers).toHaveBeenCalledTimes(1)

      expect(result).toEqual(entities)
    })

    it('should rotate among catalyst server URLs on subsequent attempts', async () => {
      contentClientMock.fetchEntitiesByPointers = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failure on first attempt'))
        .mockRejectedValueOnce(new Error('Failure on second attempt'))
        .mockResolvedValueOnce(entities)

      await badgeContext.getEntitiesByPointers(pointers)

      expectContentClientToHaveBeenCalledWithUrl(CATALYST_CONTENT_URL_LOADBALANCER)
      expectContentClientToHaveBeenCalledWithUrl('http://catalyst-server-3.com/content')
      expectContentClientToHaveBeenCalledWithUrl('http://catalyst-server-2.com/content')

      expect(contentClientMock.fetchEntitiesByPointers).toHaveBeenCalledTimes(3)
    })

    it('should not reuse the same catalyst server URL on different attempts', async () => {
      contentClientMock.fetchEntitiesByPointers = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failure on first attempt'))
        .mockRejectedValueOnce(new Error('Failure on second attempt'))
        .mockRejectedValueOnce(new Error('Failure on third attempt'))

      await badgeContext.getEntitiesByPointers(pointers, { retries: 3 }).catch(() => {})

      const createContentClientMock = createContentClient as jest.Mock
      const currentCalls = createContentClientMock.mock.calls.slice(1) // Avoid the first call which is the one made in the beforeEach

      const urlsUsed = currentCalls.map((args) => args[0].url)
      const uniqueUrls = new Set(urlsUsed)

      expect(uniqueUrls.size).toBe(urlsUsed.length)
    })
  })

  // Helpers
  function expectContentClientToHaveBeenCalledWithUrl(url: string) {
    expect(createContentClient).toHaveBeenCalledWith(
      expect.objectContaining({
        url
      })
    )
  }
})
