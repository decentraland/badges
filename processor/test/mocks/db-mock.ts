import { DbComponent } from "@badges/common";

export function createDbMock(db: Partial<DbComponent> = {}): DbComponent {
  return {
    getBadgeDefinitions: jest.fn(),
    getUserProgressFor: jest.fn(),
    getAllUserProgresses: jest.fn(),
    saveUserProgress: jest.fn(),
    ...db
  }
}
