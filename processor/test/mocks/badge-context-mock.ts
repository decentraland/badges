import { IBadgeContext } from '../../src/types'

export function createBadgeContextMock(badgeContext: Partial<IBadgeContext> = {}): IBadgeContext {
  return {
    getWearablesWithRarity: jest.fn(),
    getEntityById: jest.fn(),
    getEntitiesByPointers: jest.fn(),
    ...badgeContext
  }
}
