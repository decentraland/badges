import { Badge, BadgeId, UserBadge } from '@badges/common'
import { TierMusicFestival } from '@badges/common/src/types/tiers'
import { EthAddress } from '@dcl/schemas'
import { tryToGetAchievedTiers } from '../utils'

function validateEventMusicFestivalProgress(data: {
  progress: {
    steps: number
    tier: TierMusicFestival
  }
}): boolean {
  if (!Number.isInteger(data.progress.steps)) return false
  if (!Object.values(TierMusicFestival).includes(data.progress.tier)) return false

  return true
}

export function mergeEventMusicFestivalProgress(
  userAddress: EthAddress,
  currentUserProgress: UserBadge | undefined,
  badge: Badge,
  backfillData: { badgeId: BadgeId; progress: { steps: number; tier: TierMusicFestival } }
): UserBadge {
  const isValid = validateEventMusicFestivalProgress(backfillData)
  if (!badge || !isValid) {
    throw new Error(`Failed while processing back-fill. Badge: ${JSON.stringify(backfillData)}. User: ${userAddress}.`)
  }

  const userProgress = currentUserProgress || {
    user_address: userAddress,
    badge_id: backfillData.badgeId,
    completed_at: undefined,
    progress: {
      steps: 0,
      tier: TierMusicFestival
    },
    achieved_tiers: []
  }

  userProgress.progress = {
    steps: backfillData.progress.steps,
    tier: backfillData.progress.tier
  }

  const achievedTiers = tryToGetAchievedTiers(badge, userProgress, [backfillData.progress], 'steps')
  if (backfillData.progress.steps <= userProgress.progress.steps || achievedTiers.length > 0) {
    return userProgress
  }

  if (achievedTiers.length > 0) {
    userProgress.achieved_tiers = achievedTiers.map((tier) => {
      const userAlreadyHadThisTier = userProgress.achieved_tiers!.find(
        (achievedTier) => achievedTier.tier_id === tier.tier_id
      )

      return {
        tier_id: tier.tier_id,
        completed_at: userAlreadyHadThisTier ? userAlreadyHadThisTier.completed_at : Date.now()
      }
    })
  }

  return userProgress
}
