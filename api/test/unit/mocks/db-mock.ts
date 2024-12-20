import { DbComponent } from '@badges/common'

export function createDbMock(db: Partial<DbComponent> = {}): DbComponent {
  return {
    getBadgeDefinitions: jest.fn(),
    getUserProgressFor: jest.fn(),
    getUserProgressesForMultipleBadges: jest.fn(),
    getAllUserProgresses: jest.fn(),
    getLatestUserBadges: jest.fn(),
    saveUserProgress: jest.fn(),
    saveUserProgresses: jest.fn(),
    deleteUserProgress: jest.fn(),
    ...db
  }
}
