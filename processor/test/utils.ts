import { Badge } from '@badges/common'

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
