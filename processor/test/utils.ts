import { Badge, BadgeId, badges, UserBadge } from '@badges/common'

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

export function getMockedUserProgressForBadgeBuilder(badgeId: BadgeId, userAddress: string) {
  const badge = badges.get(badgeId) as Badge

  return function (
    userProgress: Omit<UserBadge, 'badge_id' | 'achieved_tiers' | 'user_address'> &
      Partial<Pick<UserBadge, 'user_address'>>
  ): UserBadge {
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
