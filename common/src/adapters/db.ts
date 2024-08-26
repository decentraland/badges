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
  getLatestUserBadges(userAddress: EthAddress): Promise<UserBadge[]>
  saveUserProgress(userBadge: UserBadge): Promise<void>
  deleteUserProgress(badgeId: BadgeId, userAddress: EthAddress): Promise<void>
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
      SELECT badge_id, user_address, progress, achieved_tiers, completed_at, updated_at FROM user_progress
      WHERE badge_id = ${id} AND user_address = ${userAddress.toLocaleLowerCase()}
    `

    const result = await pg.query<UserBadge>(query)
    return result.rows[0]
  }

  async function getAllUserProgresses(userAddress: EthAddress): Promise<UserBadge[]> {
    const query: SQLStatement = SQL`
      SELECT badge_id, user_address, progress, achieved_tiers, completed_at, updated_at FROM user_progress
      WHERE user_address = ${userAddress.toLocaleLowerCase()}
    `

    const result = await pg.query<UserBadge>(query)
    return result.rows
  }

  async function getLatestUserBadges(userAddress: EthAddress): Promise<UserBadge[]> {
    const query: SQLStatement = SQL`
      WITH badge_achievements AS (
        SELECT 
          badge_id,
          completed_at AS achievement_date,
          updated_at
        FROM user_progress
        WHERE user_address = ${userAddress.toLocaleLowerCase()} 
          AND completed_at IS NOT NULL
          
        UNION ALL
        
        SELECT 
          badge_id,
          (tier->>'completed_at')::bigint AS achievement_date,
          updated_at
        FROM user_progress,
        jsonb_array_elements(achieved_tiers) AS tier
        WHERE user_address = ${userAddress.toLocaleLowerCase()} 
          AND achieved_tiers IS NOT NULL
      )
      SELECT badge_id, achievement_date, updated_at
      FROM badge_achievements
      ORDER BY achievement_date DESC
      LIMIT 5
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

  async function deleteUserProgress(badgeId: BadgeId, userAddress: EthAddress): Promise<void> {
    const query: SQLStatement = SQL`
      DELETE FROM user_progress
      WHERE badge_id = ${badgeId} AND user_address = ${userAddress.toLocaleLowerCase()}
    `

    await pg.query<UserBadge>(query)
  }

  return {
    getBadgeDefinitions,
    getUserProgressFor,
    getAllUserProgresses,
    getLatestUserBadges,
    saveUserProgress,
    deleteUserProgress
  }
}
