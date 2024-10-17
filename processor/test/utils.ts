import { Badge, BadgeId, badges, UserBadge } from '@badges/common'
import { createLogComponent } from '@well-known-components/logger'
import { createBadgeContextMock } from './mocks/badge-context-mock'
import { createBadgeStorageMock } from './mocks/badge-storage-mock'
import { createDbMock } from './mocks/db-mock'
import { createMetricsMock } from './mocks/metrics-mock'
import { AppComponents } from '../src/types'
import { createDotEnvConfigComponent } from '@well-known-components/env-config-provider'
import { EthAddress, Event, Events, Rarity } from '@dcl/schemas'

export const timestamps = {
  now: () => Date.now(),
  oneMinuteBefore: (from: number) => from - 60 * 1000,
  twoMinutesBefore: (from: number) => from - 2 * 60 * 1000,
  tenSecondsBefore: (from: number) => from - 10 * 1000,
  thirtySecondsBefore: (from: number) => from - 30 * 1000,
  thirtySecondsInFuture: (from: number) => from + 30 * 1000
}

export function mapBadgeToHaveTierNth(index: number, badge: Badge): Badge {
  return {
    ...badge,
    tiers: [badge.tiers[index]]
  }
}

type UserProgress = Omit<UserBadge, 'badge_id' | 'achieved_tiers' | 'user_address'> &
  Partial<Pick<UserBadge, 'user_address'>>

export function getMockedUserProgressForBadgeWithTiersBuilder(badgeId: BadgeId, userAddress: string) {
  const badge = badges.get(badgeId) as Badge

  return function (userProgress: UserProgress): UserBadge {
    const {
      user_address,
      progress: { steps, ...progress },
      completed_at
    } = userProgress
    return {
      user_address: user_address || userAddress,
      badge_id: badgeId,
      progress: {
        steps,
        ...progress
      },
      achieved_tiers: badge.tiers
        .filter((tier) => steps >= tier.criteria.steps)
        .map((tier) => ({
          tier_id: tier.tierId,
          completed_at: timestamps.twoMinutesBefore(timestamps.now())
        })),
      completed_at
    }
  }
}

export function getExpectedUserProgressForBadgeBuilder(badgeId: BadgeId, userAddress: string) {
  const badge = badges.get(badgeId) as Badge

  return function (userProgress: UserProgress & { completed?: boolean }): UserBadge {
    const {
      progress: { steps, ...progress }
    } = userProgress
    const completed = userProgress.completed || (!!progress.completed_with && progress.completed_with.length > 0)
    const withTiers = !!badge.tiers && badge.tiers.length > 0
    return {
      user_address: userAddress,
      badge_id: badgeId,
      progress: {
        steps: withTiers ? steps : completed ? 1 : 0,
        ...progress
      },
      achieved_tiers: withTiers
        ? badge.tiers
            .filter((tier) => steps >= tier.criteria.steps)
            .map((tier) => ({
              tier_id: tier.tierId,
              completed_at: expect.any(Number)
            }))
        : undefined,
      completed_at: completed ? expect.any(Number) : undefined
    }
  }
}

export async function getMockedComponents(components: Partial<AppComponents> = {}) {
  const config = await createDotEnvConfigComponent({ path: ['.env.test'] })
  return {
    db: createDbMock(),
    config,
    logs: await createLogComponent({ config }),
    badgeContext: createBadgeContextMock(),
    badgeStorage: await createBadgeStorageMock(),
    metrics: createMetricsMock(),
    ...components
  }
}

export function createRandomWearableUrns(length: number, wearableBaseUrn?: string): string[] {
  wearableBaseUrn ||= 'urn:decentraland:mumbai:collections-v2:0xaa40af0b4a18e0555ff3c87beab1d5b591947abe:'
  return Array.from({ length }, (_, i) => wearableBaseUrn + i + ':1')
}

export function mapToWearablesWithRarity(wearablesUrns: string[], rarity: Rarity) {
  return wearablesUrns.map((urn) => ({
    metadata: { rarity, id: urn }
  }))
}

export function createExpectedResult(badgeGranted: Badge, userAddress: EthAddress) {
  return {
    badgeGranted,
    userAddress
  }
}

export function getMockEvent(type: Events.Type, subType: Event['subType'], userAddress: EthAddress): Event {
  return {
    type,
    subType,
    key: [userAddress, type, subType].join('-'),
    timestamp: Date.now(),
    metadata: {} as any
  } as Event
}
