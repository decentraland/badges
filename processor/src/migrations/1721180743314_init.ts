/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from 'node-pg-migrate'

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('user_progress', {
    user_address: { type: 'varchar(255)', notNull: true },
    badge_id: { type: 'varchar(255)', notNull: true },
    progress: { type: 'jsonb', notNull: true },
    achieved_tiers: { type: 'jsonb', notNull: false, default: null },
    completed_at: { type: 'bigint', notNull: false, default: null },
    updated_at: { type: 'bigint', notNull: true }
  })

  pgm.addConstraint('user_progress', 'pk_user_progress', {
    primaryKey: ['user_address', 'badge_id']
  })

  pgm.createIndex('user_progress', 'achieved_tiers', {
    method: 'gin'
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('user_progress')
}
