/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from 'node-pg-migrate'

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('user_progress', {
    user_address: { type: 'varchar(255)', notNull: true },
    badge_id: { type: 'varchar(255)', notNull: true },
    progress: { type: 'json', notNull: true },
    completed_at: { type: 'bigint', notNull: false }
  })

  pgm.addConstraint('user_progress', 'pk_user_progress', {
    primaryKey: ['user_address', 'badge_id']
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('user_progress')
}
