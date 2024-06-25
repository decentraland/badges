import { IBadgeManager } from '../types'
import { BadgeDefinition } from '@badges/common'

export async function createBadgeManagerComponent(): Promise<IBadgeManager> {
  async function getUserBadges(_: string): Promise<(BadgeDefinition & { acquiredOn: Date })[]> {
    return [
      {
        name: 'Been in DCL Since',
        family: 'OG',
        rarity: 'TBD',
        description: 'TBD',
        image: 'TBD',
        acquiredOn: new Date(2023, 11, 25)
      },
      {
        name: 'Total Hours Spent in World',
        family: 'Active',
        rarity: 'TBD',
        description: 'TBD',
        image: 'TBD',
        acquiredOn: new Date(2023, 2, 25)
      }
    ]
  }

  return { getUserBadges }
}
