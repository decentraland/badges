import { IPgComponent } from '@well-known-components/pg-component'

export type DbComponents = {
  pg: IPgComponent
}

export type UpsertResult<T> = {
  inserted: T[]
  updated: T[]
}

export type DbComponent = any

export function createDbComponent({ pg }: Pick<DbComponents, 'pg'>): DbComponent {
  return undefined
}
