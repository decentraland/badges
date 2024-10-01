import { createLogComponent } from '@well-known-components/logger'
import { AppComponents, ParsingEventError } from '../../../src/types'
import { createEventParser, SubType } from '../../../src/adapters/event-parser'
import { CatalystDeploymentEvent, Events } from '@dcl/schemas'
import * as CatalystClient from 'dcl-catalyst-client'

jest.mock('dcl-catalyst-client')

describe('Event Parser', () => {
  it('should return undefined if it does not know the event to be parsed', async () => {
    const { config, logs, badgeContext } = await getMockedComponents()
    const parser = await createEventParser({ config, logs, badgeContext })
    const result = await parser.parse({ type: 'UnknownEvent' })
    expect(result).toBeUndefined()
  })

  describe.each([
    [
      Events.Type.BLOCKCHAIN,
      [
        Events.SubType.Blockchain.COLLECTION_CREATED,
        Events.SubType.Blockchain.ITEM_SOLD,
        Events.SubType.Blockchain.ITEM_PUBLISHED
      ]
    ],
    [
      Events.Type.CLIENT,
      [
        Events.SubType.Client.MOVE_TO_PARCEL,
        Events.SubType.Client.USED_EMOTE,
        Events.SubType.Client.PASSPORT_OPENED,
        Events.SubType.Client.VERTICAL_HEIGHT_REACHED,
        Events.SubType.Client.WALKED_DISTANCE
      ]
    ]
  ])('when type is %s', (type: Events.Type, subTypes: SubType[]) => {
    it.each(subTypes)('and subtype %s should parse the event properly', async (subType) => {
      const { config, logs, badgeContext } = await getMockedComponents()
      const parser = await createEventParser({ config, logs, badgeContext })
      const event = { type, subType }

      const result = await parser.parse(event)

      expect(result).toBeDefined()
      expect(result).toHaveProperty('type', type)
      expect(result).toHaveProperty('subType', subType)
    })
  })

  describe('when type is catalyst-deployment', () => {
    const mockEntity = {
      version: 'v3',
      id: 'some-id',
      type: 'some-type',
      pointers: ['0xTest:store'],
      timestamp: 1708380838534,
      content: [],
      metadata: {
        owner: '0xTest:owner'
      }
    }

    it('and the entity type is not included in the subtypes should return undefined', async () => {
      const { config, logs, badgeContext } = await getMockedComponents()
      const parser = await createEventParser({ config, logs, badgeContext })
      const event = {
        entity: { entityId: 'some-id', entityType: 'non-existing-entity-type' }
      }

      const result = await parser.parse(event)
      expect(result).toBeUndefined()
    })

    it('and event does not have a content server url should use the load balancer url to fetch the entity', async () => {
      const { config, logs, badgeContext } = await getMockedComponents()
      const parser = await createEventParser({ config, logs, badgeContext })
      const event = {
        entity: { entityId: 'some-id', pointers: ['0xTest'], entityType: Events.SubType.CatalystDeployment.PROFILE }
      }

      badgeContext.getEntitiesByPointers = jest.fn().mockResolvedValue([mockEntity])

      const result = await parser.parse(event)
      const loadBalancerUrl = await config.requireString('CATALYST_CONTENT_URL_LOADBALANCER')

      expect(badgeContext.getEntitiesByPointers).toHaveBeenCalledWith(event.entity.pointers, {
        contentServerUrl: loadBalancerUrl
      })

      expect(result).toEqual({
        type: Events.Type.CATALYST_DEPLOYMENT,
        subType: Events.SubType.CatalystDeployment.PROFILE,
        key: event.entity.entityId,
        timestamp: mockEntity.timestamp,
        entity: mockEntity
      })
    })

    it.each(Object.values(Events.SubType.CatalystDeployment))(
      'and the entity type is %s should parse the event properly',
      async (subType) => {
        const { config, logs, badgeContext } = await getMockedComponents()
        const parser = await createEventParser({ config, logs, badgeContext })
        const event = {
          entity: { entityId: 'some-id', entityType: subType },
          contentServerUrls: ['http://some-url']
        }

        badgeContext.getEntitiesByPointers = jest.fn().mockResolvedValue([mockEntity])

        const result = await parser.parse(event)

        expect(result).toEqual({
          type: Events.Type.CATALYST_DEPLOYMENT,
          subType,
          key: event.entity.entityId,
          timestamp: mockEntity.timestamp,
          entity: mockEntity
        } as CatalystDeploymentEvent)
      }
    )

    it('and something goes wrong when fetching the entity should throw a ParsingEventError', async () => {
      const { config, logs, badgeContext } = await getMockedComponents()
      const event = {
        entity: { entityId: 'some-id', entityType: Events.SubType.CatalystDeployment.PROFILE },
        contentServerUrls: ['http://some-url']
      }

      badgeContext.getEntitiesByPointers = jest.fn().mockRejectedValue(new Error('Error fetching entity from content server'))
      const parser = await createEventParser({ config, logs, badgeContext })


      await expect(parser.parse(event)).rejects.toThrow(ParsingEventError)
    })
  })

  // Helpers
  async function getMockedComponents(): Promise<Pick<AppComponents, 'config' | 'logs' | 'badgeContext'>> {
    return {
      config: {
        requireString: jest.fn(),
        getString: jest.fn(),
        getNumber: jest.fn(),
        requireNumber: jest.fn()
      },
      logs: await createLogComponent({ config: { requireString: jest.fn(), getString: jest.fn() } as any }),
      badgeContext: {
        getEntityById: jest.fn().mockResolvedValue({} as any),
        getEntitiesByPointers: jest.fn().mockResolvedValue([] as any),
        getWearablesWithRarity: jest.fn().mockResolvedValue([] as any)
      }
    }
  }
})
