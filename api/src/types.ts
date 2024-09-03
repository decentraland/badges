import type {
  IBaseComponent,
  IConfigComponent,
  IFetchComponent,
  IHttpServerComponent,
  ILoggerComponent,
  IMetricsComponent
} from '@well-known-components/interfaces'
import { IPgComponent } from '@well-known-components/pg-component'
import { Badge, BadgeId, DbComponent, IBadgeStorage, UserBadge } from '@badges/common'
import { metricDeclarations } from './metrics'
import { EthAddress } from '@dcl/schemas'

export type GlobalContext = {
  components: BaseComponents
}

// components used in every environment
export type BaseComponents = {
  config: IConfigComponent
  fetch: IFetchComponent
  logs: ILoggerComponent
  server: IHttpServerComponent<GlobalContext>
  metrics: IMetricsComponent<keyof typeof metricDeclarations>
  db: DbComponent
  badgeService: IBadgeService
  badgeStorage: IBadgeStorage
  backfillMerger: IUserProgressValidator
}

// components used in runtime
export type AppComponents = BaseComponents & {
  pg: IPgComponent
  statusChecks: IBaseComponent
}

// components used in tests
export type TestComponents = BaseComponents & {
  // A fetch component that only hits the test server
  localFetch: IFetchComponent
}

// this type simplifies the typings of http handlers
export type HandlerContextWithPath<
  ComponentNames extends keyof AppComponents,
  Path extends string = any
> = IHttpServerComponent.PathAwareContext<
  IHttpServerComponent.DefaultContext<{
    components: Pick<AppComponents, ComponentNames>
  }>,
  Path
>

export type UserBadgesPreview = {
  id: string
  name: string
  tierName: string | undefined
  image: string
}

export type IBadgeService = {
  getBadge(id: BadgeId): Badge
  getBadges(ids: BadgeId[]): Badge[]
  getAllBadges(): Badge[]
  getUserStates(address: string): Promise<UserBadge[]>
  getUserState(address: EthAddress, badgeId: BadgeId): Promise<UserBadge>
  getLatestAchievedBadges(address: EthAddress): Promise<UserBadgesPreview[]>
  calculateUserProgress(
    allBadges: Badge[],
    userProgresses: UserBadge[],
    shouldIncludeNotAchieved: boolean
  ): { achieved: any; notAchieved: any }
  resetUserProgressFor(badgeId: BadgeId, address: EthAddress): Promise<void>
  saveOrUpdateUserProgresses(userBadges: UserBadge[]): Promise<void>
}

export type IUserProgressValidator = {
  mergeUserProgress(
    badgeId: BadgeId,
    userAddress: string,
    currentUserProgress: UserBadge | undefined,
    backfillData: any
  ): UserBadge
}
