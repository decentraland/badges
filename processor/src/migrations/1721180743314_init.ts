/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from 'node-pg-migrate'

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('badge', {
    id: { type: 'varchar(255)', primaryKey: true },
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'varchar(255)', notNull: true },
    criteria: { type: 'json', notNull: true }
  })

  pgm.createTable('user_progress', {
    user_address: { type: 'varchar(255)', notNull: true },
    badge_id: { type: 'varchar(255)', notNull: true },
    progress: { type: 'json', notNull: true },
    awarded_at: { type: 'timestamp', notNull: false, default: pgm.func('current_timestamp') }
  })

  pgm.addConstraint('user_progress', 'pk_user_progress', {
    primaryKey: ['user_address', 'badge_id']
  })

  pgm.addConstraint('user_progress', 'fk_user_progress_badge_id', {
    foreignKeys: {
      columns: 'badge_id',
      references: 'badge(id)',
      onDelete: 'CASCADE'
    }
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('badge')
  pgm.dropTable('user_progress')
}
