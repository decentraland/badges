import { Badge, BadgeId, UserBadge } from "@badges/common"
import { CatalystDeploymentEvent, CollectionCreatedEvent, EntityType, Events } from "@dcl/schemas"
import { createDbMock } from "../../mocks/db-mock"
import { createOpenForBusinessObserver } from "../../../src/logic/badges/open-for-business"
import { AppComponents } from "../../../src/types"

describe('Open for Business badge handler should', () => {
    const testAddress = '0xTest'
    function getMockedComponents(): Pick<AppComponents, 'db' | 'logs'> {
        return {
            db: createDbMock(),
            logs: {
                getLogger: jest.fn().mockReturnValue({
                    info: jest.fn(),
                    debug: jest.fn(),
                    error: jest.fn(),
                    warn: jest.fn()
                })
            }
        }
    }

    it('update userProgress correctly when a CatalystDeploymentEvent is received', async () => {
        const { db, logs } = getMockedComponents()
        
        const currentUserProgress: UserBadge = {
            user_address: testAddress,
            badge_id: BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION,
            progress: {}
        }

        const event: CatalystDeploymentEvent = {
            type: Events.Type.CATALYST_DEPLOYMENT,
            subType: Events.SubType.CatalystDeployment.STORE,
            key: 'bafkreicamuc6ecbu6a3jzew2g6bkiu4m7zclfm6wy5js4mlnyo6pljsveu',
            timestamp: 1708380838534,
            entity: {
                version: 'v3',
                id: 'bafkreicamuc6ecbu6a3jzew2g6bkiu4m7zclfm6wy5js4mlnyo6pljsveu',
                type: EntityType.STORE,
                pointers: ['0xTest:store'],
                timestamp: 1708380838534,
                content: [],
                metadata: {
                    owner: testAddress,
                }
            }
        }

        db.getUserProgressFor = jest.fn().mockResolvedValue(currentUserProgress)

        const handler = createOpenForBusinessObserver({ db, logs })

        const result = await handler.check(event)

        expect(db.getUserProgressFor).toHaveBeenCalledWith(BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION, testAddress)
        expect(db.saveUserProgress).toHaveBeenCalledWith({
            user_address: testAddress,
            badge_id: BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION,
            progress: {
                steps: 1,
                storeCompleted: true
            }
        })
        expect(result).toBeUndefined()
    })

    it('update userProgress correctly when a CollectionCreatedEvent is received', async () => {
        const { db, logs } = getMockedComponents()
        
        const currentUserProgress: UserBadge = {
            user_address: testAddress,
            badge_id: BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION,
            progress: {}
        }

        const event: CollectionCreatedEvent = {
            type: Events.Type.BLOCKCHAIN,
            subType: Events.SubType.Blockchain.COLLECTION_CREATED,
            key: 'bafkreicamuc6ecbu6a3jzew2g6bkiu4m7zclfm6wy5js4mlnyo6pljsveu',
            timestamp: 1630051200,
            metadata: {
                creator: testAddress,
                name: 'Test collection'
            }
        }

        db.getUserProgressFor = jest.fn().mockResolvedValue(currentUserProgress)

        const handler = createOpenForBusinessObserver({ db, logs })

        const result = await handler.check(event)

        expect(db.getUserProgressFor).toHaveBeenCalledWith(BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION, testAddress)
        expect(db.saveUserProgress).toHaveBeenCalledWith({
            user_address: testAddress,
            badge_id: BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION,
            progress: {
                steps: 1,
                collectionSubmitted: true
            }
        })
        expect(result).toBeUndefined()
    })

    it('update userProgress correctly and grant badge when both events are received', async () => {
        const { db, logs } = getMockedComponents()

        const currentUserProgress: UserBadge = {
            user_address: testAddress,
            badge_id: BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION,
            progress: {}
        }

        const storeDeploymentEvent: CatalystDeploymentEvent = {
            type: Events.Type.CATALYST_DEPLOYMENT,
            subType: Events.SubType.CatalystDeployment.STORE,
            key: 'bafkreicamuc6ecbu6a3jzew2g6bkiu4m7zclfm6wy5js4mlnyo6pljsveu',
            timestamp: 1630051200,
            entity: {
                version: 'v3',
                id: 'bafkreicamuc6ecbu6a3jzew2g6bkiu4m7zclfm6wy5js4mlnyo6pljsveu',
                type: EntityType.STORE,
                pointers: ['0xTest:store'],
                timestamp: 1630051200,
                content: [],
                metadata: {
                    owner: testAddress,
                }
            }
        }

        const collectionCreatedEvent: CollectionCreatedEvent = {
            type: Events.Type.BLOCKCHAIN,
            subType: Events.SubType.Blockchain.COLLECTION_CREATED,
            key: 'bafkreicamuc6ecbu6a3jzew2g6bkiu4m7zclfm6wy5js4mlnyo6pljsveu',
            timestamp: 1630051200,
            metadata: {
                creator: testAddress,
                name: 'Test collection'
            }
        }

        db.getUserProgressFor = jest.fn()
            .mockResolvedValueOnce(currentUserProgress)
            .mockResolvedValueOnce({ ...currentUserProgress, progress: {
                steps: 1,
                storeCompleted: true
            }})

        const handler = createOpenForBusinessObserver({ db, logs })

        let result = await handler.check(storeDeploymentEvent)

        expect(db.saveUserProgress).toHaveBeenCalledWith({
            user_address: testAddress,
            badge_id: BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION,
            progress: {
                steps: 1,
                storeCompleted: true
            }
        })
        expect(result).toBeUndefined()

        result = await handler.check(collectionCreatedEvent)

        expect(db.getUserProgressFor).toHaveBeenCalledWith(BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION, testAddress)
        expect(db.getUserProgressFor).toHaveBeenCalledTimes(2)
        expect(db.saveUserProgress).toHaveBeenCalledWith({
            user_address: testAddress,
            badge_id: BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION,
            completed_at: expect.any(Number),
            progress: {
                steps: 2,
                storeCompleted: true,
                collectionSubmitted: true
            }
        })
    })

    it('do not grant badge when the user already has the badge granted', async () => { 
        const { db, logs } = getMockedComponents()

        const currentUserProgress: UserBadge = {
            user_address: testAddress,
            badge_id: BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION,
            completed_at: 1708380838534,
            progress: {
                steps: 2,
                storeCompleted: true,
                collectionSubmitted: true
            }
        }

        const storeDeploymentEvent: CatalystDeploymentEvent = {
            type: Events.Type.CATALYST_DEPLOYMENT,
            subType: Events.SubType.CatalystDeployment.STORE,
            key: 'bafkreicamuc6ecbu6a3jzew2g6bkiu4m7zclfm6wy5js4mlnyo6pljsveu',
            timestamp: 1630051200,
            entity: {
                version: 'v3',
                id: 'bafkreicamuc6ecbu6a3jzew2g6bkiu4m7zclfm6wy5js4mlnyo6pljsveu',
                type: EntityType.STORE,
                pointers: ['0xTest:store'],
                timestamp: 1630051200,
                content: [],
                metadata: {
                    owner: testAddress,
                }
            }
        }

        const collectionCreatedEvent: CollectionCreatedEvent = {
            type: Events.Type.BLOCKCHAIN,
            subType: Events.SubType.Blockchain.COLLECTION_CREATED,
            key: 'bafkreicamuc6ecbu6a3jzew2g6bkiu4m7zclfm6wy5js4mlnyo6pljsveu',
            timestamp: 1630051200,
            metadata: {
                creator: testAddress,
                name: 'Test collection'
            }
        }

        db.getUserProgressFor = jest.fn()
            .mockResolvedValueOnce(currentUserProgress)

        const handler = createOpenForBusinessObserver({ db, logs })

        let result = await handler.check(storeDeploymentEvent)

        expect(db.getUserProgressFor).toHaveBeenCalledWith(BadgeId.COMPLETED_STORE_AND_SUBMITTED_ONE_COLLECTION, testAddress)
        expect(db.saveUserProgress).not.toHaveBeenCalled()
        expect(result).toBeUndefined()
    })
})