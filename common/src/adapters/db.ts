import SQL, { SQLStatement } from 'sql-template-strings'
import { IPgComponent } from '@well-known-components/pg-component'
import { Badge, BadgeId, UserBadge } from 'types'
import { EthAddress } from '@dcl/schemas'

export type DbComponents = {
  pg: IPgComponent
}

export type UpsertResult<T> = {
  inserted: T[]
  updated: T[]
}

export type DbComponent = {
  getBadgeDefinitions(): Promise<Badge[]>
  getUserProgressFor(id: BadgeId, userAddress: EthAddress): Promise<UserBadge>
  getAllUserProgresses(userAddress: EthAddress): Promise<UserBadge[]>
  saveUserProgress(userBadge: UserBadge): Promise<void>
}

export function createDbComponent({ pg }: Pick<DbComponents, 'pg'>): DbComponent {
  async function getBadgeDefinitions(): Promise<Badge[]> {
    const query: SQLStatement = SQL`
      SELECT * FROM badge
    `

    const result = await pg.query<Badge>(query)
    return result.rows
  }

  async function getUserProgressFor(id: BadgeId, userAddress: EthAddress): Promise<UserBadge> {
    const query: SQLStatement = SQL`
      SELECT * FROM user_progress
      WHERE badge_id = ${id} AND user_address = ${userAddress.toLocaleLowerCase()}
    `

    const result = await pg.query<UserBadge>(query)
    return result.rows[0]
  }

  async function getAllUserProgresses(userAddress: EthAddress): Promise<UserBadge[]> {
    const query: SQLStatement = SQL`
      SELECT badge_id, progress, completed_at FROM user_progress
      WHERE user_address = ${userAddress.toLocaleLowerCase()}
    `

    const result = await pg.query<UserBadge>(query)
    return result.rows
  }

  async function saveUserProgress(userBadge: UserBadge): Promise<void> {
    const updatedAt = Date.now()
    const achievedTiersJson = userBadge.achieved_tiers !== undefined ? JSON.stringify(userBadge.achieved_tiers) : null
    const query: SQLStatement = SQL`
      INSERT INTO user_progress (badge_id, user_address, progress, achieved_tiers, updated_at, completed_at)
      VALUES (${userBadge.badge_id}, ${userBadge.user_address.toLocaleLowerCase()}, ${userBadge.progress}, ${achievedTiersJson}::jsonb, ${updatedAt}, ${userBadge.completed_at})
      ON CONFLICT (badge_id, user_address) DO UPDATE
       SET progress = ${userBadge.progress},
       achieved_tiers = ${achievedTiersJson}::jsonb,
       completed_at = ${userBadge.completed_at},
       updated_at = ${updatedAt}
    `

    await pg.query<UserBadge>(query)
  }

  return {
    getBadgeDefinitions,
    getUserProgressFor,
    getAllUserProgresses,
    saveUserProgress
  }
}
