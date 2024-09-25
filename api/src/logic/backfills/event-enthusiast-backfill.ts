import { Badge, UserBadge } from '@badges/common'
import { EthAddress } from '@dcl/schemas'

function validateEventEnthusiastProgress(data: {
  progress: {
    eventsAttended: {
      eventId: string
      eventName: string
      firstVisitAt: number
      timeSpentInSeconds: number
    }[]
  }
}): boolean {
  if (!Array.isArray(data.progress.eventsAttended)) return false
  if (
    !data.progress.eventsAttended.every(
      (event: any) => typeof event.eventId === 'string' && typeof event.eventName === 'string'
    )
  )
    return false
  if (
    !data.progress.eventsAttended.every(
      (event: any) => Number.isInteger(event.firstVisitAt) && Number.isInteger(event.timeSpentInSeconds)
    )
  )
    return false

  return true
}

export function mergeEventEnthusiastProgress(
  userAddress: EthAddress,
  currentUserProgress: UserBadge | undefined,
  badge: Badge,
  backfillData: any
): UserBadge {
  const isValid = validateEventEnthusiastProgress(backfillData)
  if (!badge || !isValid) {
    throw new Error(`Failed while processing back-fill. Badge: ${JSON.stringify(badge)}. User: ${userAddress}.`)
  }

  const userProgress = currentUserProgress || {
    user_address: userAddress,
    badge_id: backfillData.badgeId,
    completed_at: undefined,
    progress: {
      steps: 0,
      events_ids_visited: []
    },
    achieved_tiers: []
  }

  const uniqueVisitedEvents = new Set<string>([
    ...userProgress.progress.events_ids_visited.map((eventId: string) => eventId),
    ...backfillData.progress.eventsAttended.map((event: any) => event.eventId)
  ])

  userProgress.progress = {
    steps: uniqueVisitedEvents.size,
    events_ids_visited: Array.from(uniqueVisitedEvents)
  }

  const sortedVisitedEvents = backfillData.progress.eventsAttended.sort(
    (a: any, b: any) => a.firstVisitAt - b.firstVisitAt
  )

  const achievedTiers = badge.tiers!.filter((tier) => {
    return userProgress.progress.steps >= tier.criteria.steps
  })

  if (achievedTiers.length > 0) {
    userProgress.achieved_tiers = achievedTiers.map((tier) => {
      const eventFound = sortedVisitedEvents[tier.criteria.steps - 1]
      const userAlreadyHadThisTier = userProgress.achieved_tiers!.find(
        (achievedTier) => achievedTier.tier_id === tier.tierId
      )

      if (eventFound) {
        return {
          tier_id: tier.tierId,
          completed_at:
            userAlreadyHadThisTier && userAlreadyHadThisTier.completed_at < eventFound.firstVisitAt
              ? userAlreadyHadThisTier.completed_at
              : eventFound.firstVisitAt
        }
      } else {
        return {
          tier_id: tier.tierId,
          completed_at: userAlreadyHadThisTier ? userAlreadyHadThisTier.completed_at : Date.now()
        }
      }
    })
  }

  if (
    userProgress.achieved_tiers &&
    userProgress.achieved_tiers.length > 0 &&
    userProgress.achieved_tiers.length === badge.tiers?.length
  ) {
    const [lastTier] = badge.tiers.slice(-1)
    const alreadyAchievedDate = userProgress.completed_at
    const eventFound = sortedVisitedEvents[lastTier?.criteria.steps - 1]

    if (eventFound && (!alreadyAchievedDate || eventFound.firstVisitAt < alreadyAchievedDate)) {
      userProgress.completed_at = eventFound.firstVisitAt
    }

    if (!eventFound && !alreadyAchievedDate) {
      userProgress.completed_at = Date.now()
    }
  }

  return userProgress
}
